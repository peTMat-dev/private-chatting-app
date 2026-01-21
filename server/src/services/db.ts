import mysql, { Pool, PoolConnection } from "mysql";
import { env } from "../config/env";

const pool: Pool = mysql.createPool({
  host: env.db.host,
  user: env.db.user,
  password: env.db.password,
  database: env.db.name,
  port: env.db.port,
  connectionLimit: 10,
});

export type QueryValues = Array<string | number | null>;

export function query<T = any>(sql: string, values: QueryValues = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    pool.query(sql, values, (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results as T[]);
    });
  });
}

export const getConnection = (): Promise<PoolConnection> => {
  return new Promise((resolve, reject) => {
    pool.getConnection((error, connection) => {
      if (error || !connection) {
        return reject(error ?? new Error("Unable to obtain DB connection"));
      }
      resolve(connection);
    });
  });
};

export const queryWithConnection = <T = any>(
  connection: PoolConnection,
  sql: string,
  values: QueryValues = []
): Promise<T> => {
  return new Promise((resolve, reject) => {
    connection.query(sql, values, (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results as T);
    });
  });
};

export async function withTransaction<T>(handler: (connection: PoolConnection) => Promise<T>): Promise<T> {
  const connection = await getConnection();
  try {
    await new Promise<void>((resolve, reject) => {
      connection.beginTransaction((err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });

    const result = await handler(connection);

    await new Promise<void>((resolve, reject) => {
      connection.commit((err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });

    return result;
  } catch (error) {
    await new Promise<void>((resolve) => {
      connection.rollback(() => resolve());
    });
    throw error;
  } finally {
    connection.release();
  }
}

export { pool };
