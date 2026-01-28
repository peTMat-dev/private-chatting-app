import express, { Request, Response } from "express";
import cors from "cors";

import { env } from "./config/env";
import authRouter from "./routes/auth";
import chatsRouter from "./routes/chats";
import { query, pool } from "./services/db";
import { LDAP_getUser, testLDAPConnection } from "./services/ldap.service";

const app = express();

const corsOptions: cors.CorsOptions = {
  origin: env.app.clientOrigins,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

interface SQL_TEST_RESULT {
  success: number;
  message: string;
}

let sqlTestResult: SQL_TEST_RESULT = { success: 400, message: "Database not checked yet" };

// checking if the database is alive
function checkDB(): void {
  pool.query("SELECT 1", (err: any) => {
    if (err) {
      sqlTestResult = { success: 400, message: err.message };
    } else {
      sqlTestResult = { success: 200, message: "Database connection successful" };
    }
  });
}

checkDB();
setInterval(checkDB, 4000);

async function checkLDAP(): Promise<any> {
  return testLDAPConnection();
}

const checkLDAPWithTimeout = async (timeoutMs = 5000) => {
  try {
    return await Promise.race([
      checkLDAP(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("LDAP check timed out")), timeoutMs)
      ),
    ]);
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
};

app.use("/auth", authRouter);
app.use("/chats", chatsRouter);

app.get("/users", async (_req: Request, res: Response) => {
  try {
    type Row = { ldap_uid_id: string; display_name: string };
    const rows = await query<Row>("SELECT ldap_uid_id, display_name FROM user_main_details");
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get("/ldap-users", async (_req: Request, res: Response) => {
  try {
    const users = await LDAP_getUser();
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get("/", async (_req: Request, res: Response) => {
  const ldapStatus = await checkLDAPWithTimeout();
  res.json({
    "Api-Server": 200,
    "Database-Connection": sqlTestResult,
    "LDAP-Connection": ldapStatus,
  });
});

app.listen(8080, () => {
  console.log("Server has started on port 8080");
});
