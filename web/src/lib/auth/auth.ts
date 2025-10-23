// src/lib/auth/auth.ts (or wherever)
import postgres from "postgres";
import { betterAuth } from "better-auth";
import { drizzle } from "drizzle-orm/postgres-js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { haveIBeenPwned, lastLoginMethod } from "better-auth/plugins";
import { reactStartCookies } from "better-auth/react-start";
import * as authSchema from "@/db/auth-schema";

const connection = postgres(process.env.BETTER_AUTH_DB_URL!);

const db = drizzle(connection, { schema: authSchema });

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  plugins: [
    lastLoginMethod(),
    haveIBeenPwned({
      customPasswordCompromisedMessage:
        "Password has been Pwned! Please choose a more secure password For more details, visit https://haveibeenpwned.com/",
    }),
    reactStartCookies(),
  ],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema,
  }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
});
