import { defineConfig } from "@better-auth/cli";

export default defineConfig({
  database: {
    url: process.env.DB_URL || "postgres://ekko:fcd5d4b50cc95cbd43b83aede8a9102f9954025a501ac72d11af3154ec432c6a@localhost:5432/postgres_db",
  },
  secret: process.env.BETTER_AUTH_SECRET || "4FdCkpSkZrAVToinMSu5aYtIGfdfnrgD",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
});