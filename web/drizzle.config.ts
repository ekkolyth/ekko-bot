import { defineConfig } from "drizzle-kit";
import "dotenv/config"

export default defineConfig({
  schema: "@src/data/auth-schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.BETTER_AUTH_DB_URL!,
  },
});
