import {
  findLdapUserByEmail,
  findLdapUserByUid,
  buildUserDn,
  createLdapUser,
  createArgon2Password,
  ensureGroupMembership,
  serializeLdapUser,
} from "./ldap.service";
import { OkPacket } from "mysql";
import { env } from "../config/env";
import { query, queryWithConnection, withTransaction } from "./db";
const { Client: LdapClient, Change: LdapChange, Attribute: LdapAttribute } = require("ldapts");

export interface DbUserRecord {
  userId: number;
  email: string | null;
  username: string;
  displayName: string | null;
  ldapUid: string;
  origin: "primary" | "fallback";
}

export interface RegistrationInput {
  firstName: string;
  lastName: string;
  displayName: string;
  username: string;
  email: string;
  password: string;
}

type MainUserRow = { user_id: number; ldap_uid_id: string; display_name: string | null };

const mapMainUserRow = (row: MainUserRow, origin: "primary" | "fallback" = "primary"): DbUserRecord => ({
  userId: row.user_id,
  email: null,
  username: row.ldap_uid_id,
  displayName: row.display_name,
  ldapUid: row.ldap_uid_id,
  origin,
});

export const findUserByIdentifier = async (identifier: string): Promise<DbUserRecord | null> => {
  const trimmed = identifier.trim();
  if (!trimmed) {
    return null;
  }

  const primaryRows = await query<MainUserRow>(
    `SELECT user_id, ldap_uid_id, display_name FROM ${env.db.primaryUserTable} WHERE ldap_uid_id = ? LIMIT 1`,
    [trimmed]
  );
  if (primaryRows.length > 0) {
    return mapMainUserRow(primaryRows[0]);
  }

  if (env.db.fallbackUserTable) {
    const fallbackRows = await query<MainUserRow>(
      `SELECT user_id, ldap_uid_id, display_name FROM ${env.db.fallbackUserTable} WHERE ldap_uid_id = ? LIMIT 1`,
      [trimmed]
    );
    if (fallbackRows.length > 0) {
      return mapMainUserRow(fallbackRows[0], "fallback");
    }
  }

  return null;
};

export const updateLastLogin = async (user: DbUserRecord): Promise<void> => {
  const table = user.origin === "primary" ? env.db.primaryUserTable : env.db.fallbackUserTable;
  if (!table) {
    return;
  }
  await query<OkPacket>(`UPDATE ${table} SET last_login_at = NOW() WHERE user_id = ?`, [user.userId]);
};

export const findUserByEmail = async (email: string) => {
  return await findLdapUserByEmail(email);
};

export const isUsernameTaken = async (username: string): Promise<boolean> => {
  const normalized = username.trim();
  if (!normalized) return false;
  const inDb = await findUserByIdentifier(normalized);
  if (inDb) return true;
  const inLdap = await findLdapUserByUid(normalized);
  return !!inLdap;
};

export const storePasswordResetToken = async (
  email: string,
  token: string,
  expiresAt: string
): Promise<void> => {
  // Store reset token and expiry in LDAP user entry
  const user = await findLdapUserByEmail(email);
  if (!user || !user.dn || !user.uid) {
    throw new Error("User not found in LDAP");
  }
  const client = new LdapClient({
    url: env.ldap.url,
    tlsOptions: { rejectUnauthorized: env.ldap.rejectUnauthorized },
  });
  try {
    await client.bind(env.ldap.bindDn, env.ldap.bindPassword);
    // Prepare changes for resetToken and resetTokenExpiry attributes
    const changes = [
      new LdapChange({
        operation: "replace",
        modification: new LdapAttribute({
          type: "resetToken",
          values: [token],
        }),
      }),
      new LdapChange({
        operation: "replace",
        modification: new LdapAttribute({
          type: "resetTokenExpiry",
          values: [expiresAt],
        }),
      }),
    ];
    await client.modify(user.dn, changes);
  } finally {
    await client.unbind();
  }

  // Insert into cubcha_v1.password_resets table using user_main_details.user_id
  const normalizedUid = extractLdapAttribute(user.uid);
  if (normalizedUid) {
    const userId = await findUserIdByLdapUid(normalizedUid);
    if (userId) {
      await query(
        `INSERT INTO ${env.db.passwordResetTable} (user_id, resettoken, resettokenexpiry, resetused)
         VALUES (?, TRUE, ?, FALSE)`,
        [userId, expiresAt]
      );
    }
  }
};

export const resetPasswordWithToken = async (token: string, newPassword: string): Promise<void> => {
  const trimmedToken = token.trim();
  if (!trimmedToken) {
    throw new Error("Invalid token");
  }

  const client = new LdapClient({
    url: env.ldap.url,
    tlsOptions: { rejectUnauthorized: env.ldap.rejectUnauthorized },
  });

  try {
    await client.bind(env.ldap.bindDn, env.ldap.bindPassword);
    const { searchEntries } = await client.search(env.ldap.usersBaseDn, {
      scope: "sub",
      filter: `(resetToken=${trimmedToken})`,
      attributes: ["dn", "uid", "resetTokenExpiry"],
    });

    if (!searchEntries || searchEntries.length === 0) {
      throw new Error("Invalid or expired token");
    }

    const entry = searchEntries[0] as Record<string, unknown> & { dn: string };
    const expiryValue = extractLdapAttribute(entry.resetTokenExpiry);
    const expiryDate = expiryValue ? parseResetTokenExpiry(expiryValue) : null;
    if (!expiryDate || expiryDate.getTime() < Date.now()) {
      throw new Error("Invalid or expired token");
    }

    const uid = extractLdapAttribute(entry.uid);
    const hashedPassword = await createArgon2Password(newPassword);

    const changes = [
      new LdapChange({
        operation: "replace",
        modification: new LdapAttribute({
          type: "userPassword",
          values: [hashedPassword],
        }),
      }),
      new LdapChange({
        operation: "delete",
        modification: new LdapAttribute({
          type: "resetToken",
          values: [],
        }),
      }),
      new LdapChange({
        operation: "delete",
        modification: new LdapAttribute({
          type: "resetTokenExpiry",
          values: [],
        }),
      }),
    ];

    await client.modify(entry.dn, changes);

    if (uid) {
      const userId = await findUserIdByLdapUid(uid);
      if (userId) {
        await query(
          `UPDATE ${env.db.passwordResetTable}
           SET resetused = TRUE, resettoken = FALSE
           WHERE user_id = ? AND resetused = FALSE`,
          [userId]
        );
      }
    }
  } finally {
    await client.unbind();
  }
};

export const registerUserInDefaultGroup = async (payload: RegistrationInput): Promise<void> => {
  const userId = await withTransaction(async (connection) => {
    const userInsert = await queryWithConnection<OkPacket>(
      connection,
      `INSERT INTO ${env.db.primaryUserTable} (ldap_uid_id, display_name, last_login_at)
       VALUES (?, ?, NOW())`,
      [payload.username, payload.displayName]
    );
    return userInsert.insertId;
  });

  // Use Argon2 for password hashing
  const hashedPassword = await createArgon2Password(payload.password);
  const ldapAttributes = serializeLdapUser(
    {
      username: payload.username,
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      displayName: payload.displayName,
    },
    hashedPassword
  );

  try {
    await createLdapUser(ldapAttributes);
    await ensureGroupMembership(env.ldap.defaultGroupCn, buildUserDn(payload.username));
  } catch (error) {
    await cleanupFailedProvision(userId);
    throw error;
  }
};

const cleanupFailedProvision = async (userId: number): Promise<void> => {
  await query<OkPacket>(`DELETE FROM ${env.db.primaryUserTable} WHERE user_id = ?`, [userId]);
};

const extractLdapAttribute = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    return value;
  }
  if (Buffer.isBuffer(value)) {
    return value.toString();
  }
  if (Array.isArray(value) && value.length > 0) {
    return extractLdapAttribute(value[0]);
  }
  return undefined;
};

const findUserIdByLdapUid = async (ldapUid: string): Promise<number | null> => {
  const rows = await query<{ user_id: number }>(
    `SELECT user_id FROM ${env.db.primaryUserTable} WHERE ldap_uid_id = ? LIMIT 1`,
    [ldapUid]
  );
  if (rows.length > 0 && rows[0].user_id) {
    return rows[0].user_id;
  }
  if (env.db.fallbackUserTable) {
    const fallbackRows = await query<{ user_id: number }>(
      `SELECT user_id FROM ${env.db.fallbackUserTable} WHERE ldap_uid_id = ? LIMIT 1`,
      [ldapUid]
    );
    if (fallbackRows.length > 0 && fallbackRows[0].user_id) {
      return fallbackRows[0].user_id;
    }
  }
  return null;
};

const parseResetTokenExpiry = (raw: string): Date | null => {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  // Ensure timestamps stored as "YYYY-MM-DD HH:MM:SS" are treated as UTC.
  const normalized = trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T");
  const withTimezone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(normalized) ? normalized : `${normalized}Z`;
  const parsed = new Date(withTimezone);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};
