import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { Pool } from "pg";

const hostedSecretsFile = "/etc/secrets/.env";
const standardSecretsFile = fileURLToPath(new URL("./.env", import.meta.url));
const localSecretsFile = fileURLToPath(new URL("./process.env", import.meta.url));
dotenv.config({
  path:
    process.env.SECRETS_FILE ||
    (existsSync(hostedSecretsFile)
      ? hostedSecretsFile
      : existsSync(standardSecretsFile)
        ? standardSecretsFile
        : localSecretsFile),
});

let pool = null;

function getPool() {
  if (pool) {
    return pool;
  }

  const connectionString =
    process.env.DATABASE_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.PG_CONNECTION_STRING;
  const hasPostgresConfig =
    process.env.PGHOST &&
    process.env.PGDATABASE &&
    process.env.PGUSER &&
    process.env.PGPASSWORD;

  if (!connectionString && !hasPostgresConfig) {
    console.warn(
      "Database is not configured. Set DATABASE_URL or PGHOST, PGDATABASE, PGUSER, and PGPASSWORD."
    );
    return null;
  }

  try {
    const host = process.env.PGHOST || "";
    const sslConfig =
      (connectionString || host).includes("neon.tech") ||
      process.env.PGSSLMODE === "require" ||
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: true }
        : false;

    pool = new Pool({
      ...(connectionString
        ? { connectionString }
        : {
            host,
            database: process.env.PGDATABASE,
            user: process.env.PGUSER,
            password: process.env.PGPASSWORD,
            port: Number(process.env.PGPORT || 5432),
          }),
      ssl: sslConfig,
      max: 5,
    });
  } catch (error) {
    console.warn("Database connection unavailable:", error.message);
    pool = null;
  }

  return pool;
}

function sanitizeJson(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const redactedKeys = ["authorization", "cookie", "x-api-key", "api-key"];
  const replacer = (key, nestedValue) => {
    if (typeof key === "string" && redactedKeys.includes(key.toLowerCase())) {
      return "[redacted]";
    }

    if (nestedValue instanceof Error) {
      return { message: nestedValue.message };
    }

    return nestedValue;
  };

  try {
    return JSON.parse(JSON.stringify(value, replacer));
  } catch (error) {
    return String(value);
  }
}
export async function initializeDatabase() {
  const db = getPool();
  if (!db) {
    return false;
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS employees (
      id BIGSERIAL PRIMARY KEY,
      first_name TEXT,
      last_name TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS incoming_requests (
      id BIGSERIAL PRIMARY KEY,
      method TEXT NOT NULL,
      path TEXT NOT NULL,
      route TEXT,
      ip TEXT,
      headers JSONB,
      query JSONB,
      params JSONB,
      body JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS chatbot_messages (
      id BIGSERIAL PRIMARY KEY,
      user_id TEXT,
      message TEXT NOT NULL,
      response TEXT,
      metadata JSONB,
      source TEXT DEFAULT 'http',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  return true;
}
export async function saveIncomingRequest(req) {
  const db = getPool();
  if (!db) {
    return null;
  }

  const result = await db.query(
    `
      INSERT INTO incoming_requests (method, path, route, ip, headers, query, params, body)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id;
    `,
    [
      req.method,
      req.originalUrl || req.url || "/",
      req.route?.path || null,
      req.ip || req.headers["x-forwarded-for"] || null,
      sanitizeJson(req.headers || {}),
      sanitizeJson(req.query || {}),
      sanitizeJson(req.params || {}),
      sanitizeJson(req.body || {}),
    ]
  );

  return result.rows[0];
}
export async function saveChatMessage({ message, userId, metadata, response, source = "http" }) {
  const db = getPool();
  if (!db) {
    return null;
  }
  const result = await db.query(
    `
      INSERT INTO chatbot_messages (user_id, message, response, metadata, source)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, user_id, message, response, metadata, source, created_at;
    `,
    [userId || null, message || "", response || null, sanitizeJson(metadata || {}), source]
  );
  return result.rows[0];
}

export async function getChatHistory(limit = 20) {
  const db = getPool();
  if (!db) {
    return [];
  }

  const result = await db.query(
    `
      SELECT id, user_id, message, response, metadata, source, created_at
      FROM chatbot_messages
      ORDER BY created_at DESC
      LIMIT $1;
    `,
    [limit]
  );

  return result.rows;
}
export async function getEmployees() {
  const db = getPool();
  if (!db) {
    return [];
  }

  const result = await db.query("SELECT * FROM employees ORDER BY id DESC LIMIT 50;");
  return result.rows;
}

export async function getEmployee(id) {
  const db = getPool();
  if (!db) {
    return [];
  }

  const result = await db.query("SELECT * FROM employees WHERE id = $1;", [id]);
  return result.rows;
}
export async function addEmployee(first_name, last_name) {
  const db = getPool();
  if (!db) {
    throw new Error("Database connection unavailable");
  }

  const result = await db.query(
    "INSERT INTO employees (first_name, last_name) VALUES ($1, $2) RETURNING id;",
    [first_name, last_name]
  );
  const id = result.rows[0]?.id;
  return getEmployee(id);
}
export default getPool;