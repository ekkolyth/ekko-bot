import { Pool } from "pg";

const dbUrl: string | undefined = process.env.DB_URL;
const isProduction: string | undefined = process.env.NODE_ENV;

// Create PostgreSQL connection pool
export const pool = new Pool({
  connectionString: dbUrl,
  ssl: isProduction === "production" ? { rejectUnauthorized: false } : false,
});

// Test database connection
export async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW()");
    console.log("Database connected successfully:", result.rows[0]);
    client.release();
    return true;
  } catch (err) {
    console.error("Database connection error:", err);
    return false;
  }
}

// Graceful shutdown
export async function closePool() {
  await pool.end();
}
