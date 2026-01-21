import dotenv from "dotenv";

dotenv.config();

const boolFromEnv = (value: string | undefined, fallback = false): boolean => {
  if (value === undefined) {
    return fallback;
  }
  return ["1", "true", "TRUE", "yes", "YES"].includes(value);
};

const listFromEnv = (value: string | undefined, fallback: string[]): string[] => {
  if (!value) {
    return fallback;
  }
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

export const env = {
  db: {
    host: process.env.DB_HOST ?? "localhost",
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    name: process.env.DB_NAME ?? "cubcha_v1",
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    primaryUserTable: process.env.DB_PRIMARY_USER_TABLE ?? "user_main_details",
    fallbackUserTable: process.env.DB_FALLBACK_USER_TABLE ?? "",
    groupTrackerTable: process.env.DB_GROUP_TRACKER_TABLE ?? "ldap_group_gid_tracker",
    userTrackerTable: process.env.DB_USER_TRACKER_TABLE ?? "ldap_user_uid_tracker",
    passwordResetTable: process.env.DB_PASSWORD_RESET_TABLE ?? "password_resets",
    groupMembershipRequestsTable:
      process.env.DB_GROUP_MEMBERSHIP_REQUESTS_TABLE ?? "group_membership_requests",
    groupsTable: process.env.DB_GROUPS_TABLE ?? "table_groups",
    userGroupLinkTable: process.env.DB_USER_GROUP_LINK_TABLE ?? "table_users_groups",
  },
  ldap: {
    url: process.env.LDAP_URL ?? "ldap://localhost:389",
    bindDn: process.env.LDAP_BIND_DN ?? "",
    bindPassword: process.env.LDAP_BIND_PASSWORD ?? "",
    usersBaseDn: process.env.LDAP_USERS_BASE_DN ?? "ou=users,dc=contaboserver,dc=net",
    groupsBaseDn: process.env.LDAP_GROUPS_BASE_DN ?? "ou=groups,dc=contaboserver,dc=net",
    defaultGroupCn: process.env.LDAP_DEFAULT_GROUP_CN ?? "chat_groups",
    defaultGroupGid: process.env.LDAP_DEFAULT_GROUP_GID
      ? Number(process.env.LDAP_DEFAULT_GROUP_GID)
      : 1000,
    groupFilter: process.env.LDAP_GROUP_FILTER ?? "(objectClass=groupOfNames)",
    rejectUnauthorized: boolFromEnv(process.env.LDAP_REJECT_UNAUTHORIZED, true),
  },
  app: {
    clientOrigins: listFromEnv(process.env.CLIENT_ORIGINS, ["http://localhost:3000"]),
    allowGroupCreation: boolFromEnv(process.env.ALLOW_GROUP_CREATION, false),
  },
};
