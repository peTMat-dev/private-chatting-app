export async function findLdapUserByEmail(email: string) {
  const client = new Client({
    url: env.ldap.url,
    tlsOptions: { rejectUnauthorized: env.ldap.rejectUnauthorized },
  });
  try {
    await client.bind(env.ldap.bindDn, env.ldap.bindPassword);
    const opts: SearchOptions = {
      scope: "sub",
      filter: `(mail=${email})`,
      attributes: ["dn", "mail", "uid"], // adjust attributes as needed
    };
    const { searchEntries } = await client.search(env.ldap.usersBaseDn, opts);
    return searchEntries.length > 0 ? searchEntries[0] : null;
  } finally {
    await client.unbind();
  }
}
import { Attribute, Change, Client, SearchOptions } from "ldapts";
import crypto from "crypto";
import argon2 from "argon2";
import { env } from "../config/env";

export interface LdapUserAttributes {
  uid: string;
  sn: string;
  givenName: string;
  cn: string;
  displayName: string;
  mail: string;
  userPassword: string;
  objectClass?: string[];
}

export interface LdapGroupAttributes {
  cn: string;
  members: string[];
  owner: string;
}

const getClient = () =>
  new Client({
    url: env.ldap.url,
    tlsOptions: { rejectUnauthorized: env.ldap.rejectUnauthorized },
  });

export async function testLDAPConnection(): Promise<{ success: boolean; message: string }> {
  const client = getClient();
  try {
    if (!env.ldap.bindDn || !env.ldap.bindPassword) {
      return { success: false, message: "LDAP bind credentials are missing" };
    }
    await client.bind(env.ldap.bindDn, env.ldap.bindPassword);
    return { success: true, message: "LDAP bind successful" };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  } finally {
    await client.unbind();
  }
}

export async function LDAP_getUser(): Promise<any[]> {
  const client = getClient();
  try {
    await bindAsServiceAccount(client);
    const options: SearchOptions = {
      scope: "sub",
      filter: "(objectClass=inetOrgPerson)",
      attributes: ["uid", "sn", "givenName", "cn", "displayName", "mail"],
    };
    const { searchEntries } = await client.search(env.ldap.usersBaseDn, options);
    return searchEntries;
  } finally {
    await client.unbind();
  }
}

export async function bindUser(ldapUid: string, password: string): Promise<void> {
  const client = getClient();
  try {
    const userDn = buildUserDn(ldapUid);
    await client.bind(userDn, password);
  } finally {
    await client.unbind();
  }
}

export async function createLdapUser(attributes: LdapUserAttributes): Promise<void> {
  const client = getClient();
  try {
    await bindAsServiceAccount(client);
    const entry = {
      uid: attributes.uid,
      sn: attributes.sn,
      givenName: attributes.givenName,
      cn: attributes.cn,
      displayName: attributes.displayName,
      mail: attributes.mail,
      objectClass: attributes.objectClass ?? ["inetOrgPerson", "top", "resetTokenAux"],
      userPassword: attributes.userPassword,
    } as Record<string, string | string[]>;

    await client.add(buildUserDn(attributes.uid), entry);
  } finally {
    await client.unbind();
  }
}

export async function createLdapGroup(attributes: LdapGroupAttributes): Promise<void> {
  const client = getClient();
  try {
    await bindAsServiceAccount(client);
    const entry = {
      objectClass: ["groupOfNames", "top"],
      member: attributes.members,
      owner: attributes.owner,
      description: `Chat group for ${attributes.cn}`,
    } as Record<string, string | string[]>;
    await client.add(buildGroupDn(attributes.cn), entry);
  } finally {
    await client.unbind();
  }
}

export async function ensureGroupMembership(groupCn: string, memberDn: string): Promise<void> {
  const client = getClient();
  try {
    await bindAsServiceAccount(client);
    try {
      const change = new Change({
        operation: "add",
        modification: new Attribute({
          type: "member",
          values: [memberDn],
        }),
      });
      await client.modify(buildGroupDn(groupCn), change);
    } catch (error) {
      if (!isAlreadyMemberError(error)) {
        throw error;
      }
    }
  } finally {
    await client.unbind();
  }
}

export async function listGroupCns(): Promise<string[]> {
  const client = getClient();
  try {
    await bindAsServiceAccount(client);
    const { searchEntries } = await client.search(env.ldap.groupsBaseDn, {
      scope: "one",
      filter: env.ldap.groupFilter,
      attributes: ["cn"],
    });
    const groups: string[] = [];
    searchEntries.forEach((entry) => {
      const cnAttribute = (entry as Record<string, unknown>).cn;
      if (typeof cnAttribute === "string") {
        groups.push(cnAttribute);
      } else if (Array.isArray(cnAttribute)) {
        cnAttribute.forEach((value) => {
          if (typeof value === "string") {
            groups.push(value);
          }
        });
      }
    });
    return groups;
  } finally {
    await client.unbind();
  }
}

const bindAsServiceAccount = async (client: Client) => {
  if (!env.ldap.bindDn || !env.ldap.bindPassword) {
    throw new Error("LDAP bind credentials are not configured");
  }
  await client.bind(env.ldap.bindDn, env.ldap.bindPassword);
};

export const buildUserDn = (uid: string) => `uid=${uid},${env.ldap.usersBaseDn}`;
export const buildGroupDn = (cn: string) => `cn=${cn},${env.ldap.groupsBaseDn}`;


// Argon2 password hashing (async)
// Match OpenLDAP's Argon2 overlay defaults so slapd can verify stored hashes.
const ARGON2_MODULE_PARAMS = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 2,
  parallelism: 1,
};

export const createArgon2Password = async (password: string): Promise<string> => {
  const hash = await argon2.hash(password, ARGON2_MODULE_PARAMS);
  return `{ARGON2}${hash}`;
};

export const serializeLdapUser = (
  {
    username,
    firstName,
    lastName,
    email,
    displayName,
  }: {
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    displayName: string;
  },
  hashedPassword: string
): LdapUserAttributes => {
  const formattedFirst = firstName.trim();
  const formattedLast = lastName.trim();
  const formattedDisplay = displayName.trim();
  const derivedSn = formattedLast || formattedFirst || username;
  const derivedGiven = formattedFirst || username;
  const derivedCn = `${derivedGiven} ${formattedLast}`.trim() || derivedGiven || username;
  const resolvedDisplay = formattedDisplay || derivedCn;
  return {
    uid: username,
    sn: derivedSn,
    givenName: derivedGiven,
    cn: derivedCn,
    displayName: resolvedDisplay,
    mail: email.toLowerCase(),
    userPassword: hashedPassword,
    objectClass: ["inetOrgPerson", "top", "resetTokenAux"],
  };
};

const isAlreadyMemberError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }
  return /exists|already/i.test(error.message);
};
