import mysql from 'mysql';

const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

export function query(sql: string, params?: unknown[]): Promise<unknown> {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, (err: mysql.MysqlError | null, results: unknown) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
} 