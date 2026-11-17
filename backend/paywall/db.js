const { existsSync } = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");
const { Pool } = require("pg");

const hostedSecretsFile = "/etc/secrets/.env";
const standardSecretsFile = path.resolve(__dirname, "../.env");
const localSecretsFile = path.resolve(__dirname, "../process.env");
dotenv.config({
  path:
    process.env.SECRETS_FILE ||
    (existsSync(hostedSecretsFile)
      ? hostedSecretsFile
      : existsSync(standardSecretsFile)
        ? standardSecretsFile
        : localSecretsFile),
});

let connectionString =
  process.env.DATABASE_URL ||
  process.env.NEON_DATABASE_URL ||
  process.env.PG_CONNECTION_STRING;

if (!connectionString && process.env.PGHOST && process.env.PGDATABASE && process.env.PGUSER && process.env.PGPASSWORD) {
  const connectionUrl = new URL("postgresql://");
  connectionUrl.hostname = process.env.PGHOST;
  connectionUrl.port = process.env.PGPORT || "5432";
  connectionUrl.username = process.env.PGUSER;
  connectionUrl.password = process.env.PGPASSWORD;
  connectionUrl.pathname = `/${process.env.PGDATABASE}`;
  connectionUrl.searchParams.set("sslmode", process.env.PGSSLMODE || "require");
  connectionString = connectionUrl.toString();
}

if (!connectionString) {
  throw new Error(
    "[backend] Database settings are missing. Set DATABASE_URL or the required PG* variables.",
  );
}

const host = process.env.PGHOST || "";
const ssl =
  (connectionString || host).includes("neon.tech") ||
  process.env.PGSSLMODE === "require" ||
  process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: true }
    : false;
const pool = new Pool({
  ...(connectionString
    ? { connectionString }
    : {
        host,
        database: process.env.PGDATABASE,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        port: Number(process.env.PGPORT || 5432),
      }),
  ssl,
  max: 5,
});

async function sql(parts, ...values) {
  const text = parts.reduce(
    (query, part, index) => `${query}${index ? `$${index}` : ""}${part}`,
    "",
  );
  const result = await pool.query(text, values);
  return result.rows;
}

module.exports = { sql };
