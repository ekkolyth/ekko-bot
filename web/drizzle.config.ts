import { defineConfig } from "drizzle-kit";
import "dotenv/config"

export default defineConfig({
  schema: "./src/db/auth-schema.ts",
  out: "./src/db/drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.BETTER_AUTH_DB_URL!,
  },
});
