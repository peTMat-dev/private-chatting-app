import { OkPacket } from "mysql";
import { env } from "../config/env";
import {
  buildUserDn,
  createLdapUser,
  createSshaPassword,
  ensureGroupMembership,
  serializeLdapUser,
} from "./ldap.service";
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

export const findUserByEmail = async (_email: string): Promise<DbUserRecord | null> => {
  // Email field is not stored in user_main_details, so skip lookup for now.
  return null;
};

export const storePasswordResetToken = async (
  email: string,
  token: string,
  expiresAt: string
): Promise<void> => {
  await query<OkPacket>(
    `INSERT INTO ${env.db.passwordResetTable} (email, token, expires_at, created_at)
     VALUES (?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE token = VALUES(token), expires_at = VALUES(expires_at), created_at = NOW()`,
    [email, token, expiresAt]
  );
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

  const hashedPassword = createSshaPassword(payload.password);
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
