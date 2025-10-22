import { createAuthClient } from "better-auth/react";
import { lastLoginMethodClient } from "better-auth/client/plugins"

const baseURL = import.meta.env.BETTER_AUTH_URL as string | undefined;

export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: baseURL,
  plugins: [
    lastLoginMethodClient(),
  ]
});
