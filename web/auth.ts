import { betterAuth } from "better-auth";
import { pool } from "./src/lib/db";
import dotenv from "dotenv";
import { haveIBeenPwned } from "better-auth/plugins";

dotenv.config();

export const auth = betterAuth({
  plugins: [
    haveIBeenPwned({
      customPasswordCompromisedMessage: "Please choose a more secure password.",
    }),
  ],
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
  // Tell Better Auth to skip migrations since we're using Goose
  advanced: {
    skipMigrations: true,
  },
});
