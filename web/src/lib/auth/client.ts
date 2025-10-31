import { createAuthClient } from 'better-auth/react';
import { lastLoginMethodClient } from 'better-auth/client/plugins';

function getBetterAuthUrl(): string {
  // Server-side: use environment variable
  if (typeof window === 'undefined') {
    const url = process.env.BETTER_AUTH_URL;
    if (!url) {
      throw new Error(
        'BETTER_AUTH_URL environment variable is required but not set. ' +
          'Please set BETTER_AUTH_URL in your environment variables.'
      );
    }
    return url;
  }

  // Client-side: read from injected config
  const configScript = document.getElementById('better-auth-config');
  if (!configScript || !configScript.textContent) {
    throw new Error(
      'BETTER_AUTH_URL not found in page config. ' +
        'Please ensure BETTER_AUTH_URL is set in your environment variables.'
    );
  }

  try {
    const config = JSON.parse(configScript.textContent) as { betterAuthUrl?: string };
    if (!config.betterAuthUrl) {
      throw new Error(
        'BETTER_AUTH_URL is not configured. ' +
          'Please set BETTER_AUTH_URL in your environment variables.'
      );
    }
    return config.betterAuthUrl;
  } catch (err) {
    throw new Error(
      'Failed to parse BETTER_AUTH_URL configuration. ' +
        'Please ensure BETTER_AUTH_URL is set in your environment variables.'
    );
  }
}

const baseURL = getBetterAuthUrl();

export const authClient = createAuthClient({
  baseURL: baseURL,
  plugins: [lastLoginMethodClient()],
  socialProviders: {
    discord: {
      enabled: true,
    },
  },
});
