import mysql from "mysql2/promise";

declare global {
  // eslint-disable-next-line no-var
  var __mysqlPool: mysql.Pool | undefined;
}

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v || v.length === 0) {
    throw new Error(
      `[db] Falta la variable de entorno ${name}. Revisá .env.local`,
    );
  }
  return v;
}

function makePool(): mysql.Pool {
  const host = required("MYSQL_HOST");
  const port = Number(process.env.MYSQL_PORT ?? 3306);
  const user = required("MYSQL_USER");
  const password = required("MYSQL_PASSWORD");
  const database = required("MYSQL_DATABASE");
  const connectionLimit = Number(process.env.MYSQL_CONNECTION_LIMIT ?? 10);

  return mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    connectionLimit,
    waitForConnections: true,
    queueLimit: 0,
    charset: "utf8mb4_unicode_ci",
    timezone: "Z",
    dateStrings: true,
  });
}

// Hot-reload safe: reutilizar pool en dev en vez de abrir uno nuevo por archivo
export const pool: mysql.Pool = globalThis.__mysqlPool ?? makePool();
if (process.env.NODE_ENV !== "production") {
  globalThis.__mysqlPool = pool;
}

/**
 * Ejecuta una consulta parametrizada y devuelve [rows, fields].
 * Para SELECT, rows es T[].
 */
export async function query<T = unknown>(
  sql: string,
  params: unknown[] = [],
): Promise<[T, mysql.FieldPacket[]]> {
  return (await pool.execute(sql, params as mysql.ExecuteValues)) as [
    T,
    mysql.FieldPacket[],
  ];
}

/**
 * Devuelve la primera fila o null si no existe.
 */
export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T | null> {
  const [rows] = await query<T[]>(sql, params);
  return Array.isArray(rows) && rows[0] ? (rows[0] as T) : null;
}

/**
 * Ping rápido para verificar conexión. Devuelve true si ok.
 */
export async function pingDb(): Promise<boolean> {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    return true;
  } catch {
    return false;
  }
}

export default pool;
