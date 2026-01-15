import ldap from "ldapjs";
import { blob } from "node:stream/consumers";


export interface LDAP_TEST_RESULT {
    success: number;
    message: string;
}
export async function testLDAPConnection(): Promise<LDAP_TEST_RESULT> {
 
    let client: ldap.Client;

    client  = await getLDAPClient();

    const bindprommise = new Promise<LDAP_TEST_RESULT>((resolve, reject) => {
        client.bind(process.env.LDAP_BIND_DN as string, process.env.LDAP_PASSWORD as string, (err: Error | null) => {
            if (err) {
                resolve({ success: 0, message: `LDAP bind failed: ${err.message}` });
               
            } else {
                resolve({ success: 1, message: "LDAP bind successful" });
            }
            client.unbind();

        
        });

        client.on("error", (err: Error) => {
            resolve({ success: 0, message: `LDAP client error: ${err.message}` });
        });
        });
       
        
   
    return bindprommise;


}

export async function getLDAPClient(): Promise<ldap.Client> {
      let url : string;
   let bindDN : string;
   let password : string;
   
   let timeout = 5000;

   url = process.env.LDAP_URL as string;
   bindDN = process.env.LDAP_BIND_DN as string;
   password = process.env.LDAP_PASSWORD as string;

   const client = ldap.createClient({
       url: url,
       timeout: timeout,
       connectTimeout: timeout,
   });
   return client;
}