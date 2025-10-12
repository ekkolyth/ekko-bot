import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dotenv from "dotenv";
import { haveIBeenPwned } from "better-auth/plugins";

dotenv.config();

// Create PostgreSQL connection for Better Auth
const connection = postgres(process.env.BETTER_AUTH_DB_URL!);
const db = drizzle(connection);

export const auth = betterAuth({
  plugins: [
    haveIBeenPwned({
      customPasswordCompromisedMessage: "Please choose a more secure password.",
    }),
  ],
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
});
