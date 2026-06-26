import pkg from "pg";
const { Pool, types } = pkg;

// PostgreSQL DATE (OID 1082) → 'YYYY-MM-DD' string (avoids UTC D-1 via JS Date)
types.setTypeParser(1082, (value) => value);
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the api directory
dotenv.config({ path: join(__dirname, "../api/.env") });

console.log("Database configuration:");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PORT:", process.env.DB_PORT);

const connectionTimeoutMillis = Number(
  process.env.DB_CONNECTION_TIMEOUT_MS || 10000,
);
const idleTimeoutMillis = Number(process.env.DB_IDLE_TIMEOUT_MS || 30000);
const maxPoolSize = Number(process.env.DB_POOL_MAX || 20);

const baseConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
    }
  : {
      user: process.env.DB_USER || "postgres",
      host: process.env.DB_HOST || "localhost",
      database: process.env.DB_NAME || "real_estate_crm",
      password: process.env.DB_PASSWORD || "password",
      port: Number(process.env.DB_PORT || 5432),
    };

const pool = new Pool({
  ...baseConfig,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
  max: maxPoolSize,
  idleTimeoutMillis,
  connectionTimeoutMillis,
});

// Test connection
pool.on("connect", (client) => {
  console.log("New client connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("PostgreSQL connection error:", err);
});

const verifyDatabaseConnection = async () => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query("SELECT NOW() AS now");
      console.log("Successfully connected to PostgreSQL database");
      console.log("Database query test successful:", result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error acquiring client", error.stack || error.message);
  }
};

void verifyDatabaseConnection();

export default pool;
