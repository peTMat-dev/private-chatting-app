import ldap from "ldapjs";
import { Client } from "ldapts";


export interface LDAP_TEST_RESULT {
    success: number;
    message: string;
}
// Test LDAP connection and return structured result
export async function testLDAPConnection(): Promise<LDAP_TEST_RESULT> {
  let client: Client | undefined;

  try {
    client = await getLDAPClient();

    // If we reach here, bind succeeded
    return {
      success: 200,
      message: "LDAP bind successful",
    };
  } catch (err: any) {
    return {
      success: 400,
      message: `LDAP bind failed: ${err.message}`,
    };
  } finally {
    if (client) {
      await client.unbind().catch(() => {}); // always clean up
    }
  }
}

export async function getLDAPClient(): Promise<Client> {
  const url = process.env.LDAP_URL as string;
  const bindDN = process.env.LDAP_BIND_DN as string;
  const password = process.env.LDAP_PASSWORD as string;

  // Create client
  const client = new Client({
    url,
    timeout: 5000,
    connectTimeout: 5000,
    tlsOptions: { rejectUnauthorized: false }, // ⚠ self-signed cert
  });

  // Bind immediately
  try {
    await client.bind(bindDN, password);
    return client;
  } catch (err) {
    // Close client on error
    await client.unbind().catch(() => {});
    throw err;
  }
}

export async function LDAP_getUser() {
    const userDN = "uid=Adam_testuser,ou=users,dc=contaboserver,dc=net";

  const client = await getLDAPClient();

    try {
    // Search for the user by DN
    const { searchEntries } = await client.search(userDN, {
      scope: "base", // "base" means only the DN itself, not child entries
      attributes: [
        "uid",
        "sn",
        "givenName",
        "cn",
        "displayName",
        "mail",
        "userPassword",
      ],
    });

    if (searchEntries.length === 0) {
      console.log("User not found");
      return null;
    }

    console.log("LDAP user:", searchEntries[0]);
    return searchEntries[0]; // returns the user object
  } catch (err) {
    console.error("LDAP error:", err);
    return null;
  } finally {
    client.unbind(); // Close the connection
}
}

