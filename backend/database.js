import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { Pool } from "pg";

const hostedSecretsFile = "/etc/secrets/.env";
const standardSecretsFile = fileURLToPath(new URL("./.env", import.meta.url));
const localSecretsFile = fileURLToPath(new URL("./process.env", import.meta.url));
const infositeSettingsFile = fileURLToPath(new URL("./backendfeed.txt", import.meta.url));
const defaultInfositeSettings = {
  slides: [],
  announcements: [],
  events: [],
  slidingText: "",
  newsText: "",
  settings: {
    slidingText: "",
    footerNews: "",
    tickerDuration: "24",
    timetableUrl: "",
  },
};
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

function getInfositeSettings() {
  if (!existsSync(infositeSettingsFile)) {
    return defaultInfositeSettings;
  }

  try {
    const parsedSettings = JSON.parse(readFileSync(infositeSettingsFile, "utf8"));
    if (parsedSettings === null || typeof parsedSettings !== "object" || Array.isArray(parsedSettings)) {
      return defaultInfositeSettings;
    }
    return parsedSettings;
  } catch (error) {
    console.warn("Could not read infosite settings feed:", error.message);
    return defaultInfositeSettings;
  }
}

function getJsonColumnValue(data, key) {
  if (
    data === null ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    !Object.hasOwn(data, key) ||
    data[key] === undefined
  ) {
    return null;
  }

  return JSON.stringify(data[key]);
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

  await db.query(`
    CREATE TABLE IF NOT EXISTS json_documents (
      document_key TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    ALTER TABLE json_documents
      ADD COLUMN IF NOT EXISTS slides JSONB,
      ADD COLUMN IF NOT EXISTS announcements JSONB,
      ADD COLUMN IF NOT EXISTS settings JSONB;
  `);

  await db.query(`
    UPDATE json_documents
    SET
      slides = COALESCE(slides, data->'slides'),
      announcements = COALESCE(announcements, data->'announcements'),
      settings = COALESCE(settings, data->'settings')
    WHERE slides IS NULL OR announcements IS NULL OR settings IS NULL;
  `);

  const initialInfositeSettings = getInfositeSettings();
  await db.query(
    `
      INSERT INTO json_documents (document_key, data, slides, announcements, settings)
      VALUES ($1, $2::jsonb, $3::jsonb, $4::jsonb, $5::jsonb)
      ON CONFLICT (document_key) DO NOTHING;
    `,
    [
      "infositemrsm",
      JSON.stringify(initialInfositeSettings),
      getJsonColumnValue(initialInfositeSettings, "slides"),
      getJsonColumnValue(initialInfositeSettings, "announcements"),
      getJsonColumnValue(initialInfositeSettings, "settings"),
    ]
  );

  return true;
}

export async function saveJsonData(documentKey, data) {
  if (typeof documentKey !== "string" || documentKey.trim() === "") {
    throw new TypeError("documentKey must be a non-empty string");
  }
  if (data === undefined) {
    throw new TypeError("data must be JSON-serializable");
  }

  const serializedData = JSON.stringify(data);
  if (serializedData === undefined) {
    throw new TypeError("data must be JSON-serializable");
  }

  const db = getPool();
  if (!db) {
    throw new Error("Database connection unavailable");
  }

  const result = await db.query(
    `
      INSERT INTO json_documents (
        document_key, data, slides, announcements, settings, updated_at
      )
      VALUES ($1, $2::jsonb, $3::jsonb, $4::jsonb, $5::jsonb, NOW())
      ON CONFLICT (document_key)
      DO UPDATE SET
        data = EXCLUDED.data,
        slides = EXCLUDED.slides,
        announcements = EXCLUDED.announcements,
        settings = EXCLUDED.settings,
        updated_at = NOW()
      RETURNING document_key, data, updated_at;
    `,
    [
      documentKey.trim(),
      serializedData,
      getJsonColumnValue(data, "slides"),
      getJsonColumnValue(data, "announcements"),
      getJsonColumnValue(data, "settings"),
    ]
  );

  return result.rows[0];
}

export async function getJsonData(documentKey) {
  if (typeof documentKey !== "string" || documentKey.trim() === "") {
    throw new TypeError("documentKey must be a non-empty string");
  }

  const db = getPool();
  if (!db) {
    throw new Error("Database connection unavailable");
  }

  const result = await db.query(
    "SELECT document_key, data, updated_at FROM json_documents WHERE document_key = $1;",
    [documentKey.trim()]
  );

  return result.rows[0] || null;
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