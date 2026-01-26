import { 
  findLdapUserByEmail,
  buildUserDn,
  createLdapUser,
  createArgon2Password,
  ensureGroupMembership,
  serializeLdapUser
} from "./ldap.service";
import { OkPacket } from "mysql";
import { env } from "../config/env";
import { query, queryWithConnection, withTransaction } from "./db";

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
  const client = new (require("ldapts").Client)({
    url: require("../config/env").env.ldap.url,
    tlsOptions: { rejectUnauthorized: require("../config/env").env.ldap.rejectUnauthorized },
  });
  try {
    await client.bind(require("../config/env").env.ldap.bindDn, require("../config/env").env.ldap.bindPassword);
    // Prepare changes for resetToken and resetTokenExpiry attributes
    const changes = [
      new (require("ldapts").Change)({
        operation: "replace",
        modification: new (require("ldapts").Attribute)({
          type: "resetToken",
          values: [token],
        }),
      }),
      new (require("ldapts").Change)({
        operation: "replace",
        modification: new (require("ldapts").Attribute)({
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
  // Ensure user.uid is a string for SQL query
  let ldapUid: string | undefined = undefined;
  const normalizeUidValue = (value: unknown): string | undefined => {
    if (typeof value === "string") {
      return value;
    }
    if (Buffer.isBuffer(value)) {
      return value.toString();
    }
    return undefined;
  };
  ldapUid = normalizeUidValue(user.uid);
  if (!ldapUid && Array.isArray(user.uid) && user.uid.length > 0) {
    ldapUid = normalizeUidValue(user.uid[0]);
  }
  if (ldapUid) {
    const [sqlUser] = await query<{ user_id: number }>(
      "SELECT user_id FROM user_main_details WHERE ldap_uid_id = ? LIMIT 1",
      [ldapUid]
    );
    if (sqlUser && sqlUser.user_id) {
      await query(
        "INSERT INTO password_resets (user_id, resettoken, resettokenexpiry, resetused) VALUES (?, TRUE, ?, FALSE)",
        [sqlUser.user_id, expiresAt]
      );
    }
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
