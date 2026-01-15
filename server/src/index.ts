import dotenv from "dotenv";
dotenv.config();

import mysql, { Pool } from "mysql";
import express, { Request, Response } from "express";
import cors from "cors";


// Homemade imports
import { testLDAPConnection } from "./services/ldap_service";

const app = express();

const corsOptions: cors.CorsOptions = {
  origin: ["http://localhost:5173"],
};

app.use(cors(corsOptions));



const conPool: Pool = mysql.createPool({
  host: process.env.DB_HOST as string,
  user: process.env.DB_USER as string,
  password: process.env.DB_PASSWORD as string,
  database: process.env.DB_NAME as string,
});
let sqlTestResult: SQL_TEST_RESULT = getSQL_Test_RESULT();
interface SQL_TEST_RESULT {
    success: number;
    message: string;
}
// checking if the database is alive
function checkDB(): void {

  sqlTestResult = getSQL_Test_RESULT();
 
}
function getSQL_Test_RESULT(): SQL_TEST_RESULT{
  let SQL_result: SQL_TEST_RESULT  = { success: 400, message: "Database not checked yet" };
  conPool.query("SELECT 1", (err: any) => {
    if (err) {
      SQL_result= { success: 400,message: err.message};
    } else {
      SQL_result = { success: 1, message: "Database connection successful" };
    }
  });
  return SQL_result;
}


async function checkLDAP(): Promise<any> {
  let ldapstatus = 400;
  let ldapmessage = "LDAP connection failed";

  const result = await testLDAPConnection();

  return result;
}
setInterval(checkDB, 20_000);

app.get("/users", async (req: Request, res: Response) => {
  conPool.query(
    "SELECT username_id FROM user_main_details",
    (err: { message: any; }, rows: any[]) => {
      if (err) {
        return res.json({ success: false, error: err.message });
      }

      res.json({
        success: true,
        count: (rows as any[]).length,
        data: rows,
      });
    }
  );
});

app.get("/", async (req: Request, res: Response) => {
  res.json({
    "Api-Server": 200,
    "Database-Connection": sqlTestResult,
    "lDAP-Connection": await checkLDAP(),
  });
});

app.listen(8080, () => {
  console.log("Server has started on port 8080");
});
