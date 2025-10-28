import { db } from '@/lib/auth/auth';
import * as authSchema from '@/db/auth-schema';
import { eq } from 'drizzle-orm';

/**
 * Refresh Discord access token using the refresh token
 */
export async function refreshDiscordToken(accountId: string): Promise<string | null> {
  const accounts = await db
    .select()
    .from(authSchema.account)
    .where(eq(authSchema.account.id, accountId))
    .limit(1);

  const account = accounts[0];
  if (!account || !account.refreshToken) {
    console.error('No refresh token found for account:', accountId);
    return null;
  }

  try {
    const response = await fetch('https://discord.com/api/v10/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: account.refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to refresh Discord token:', response.status, error);
      return null;
    }

    const data = await response.json();

    // Update the account with new tokens
    await db
      .update(authSchema.account)
      .set({
        accessToken: data.access_token,
        refreshToken: data.refresh_token || account.refreshToken, // Use new refresh token if provided
        accessTokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
      })
      .where(eq(authSchema.account.id, accountId));

    console.log('Successfully refreshed Discord token for account:', accountId);
    return data.access_token;
  } catch (err) {
    console.error('Error refreshing Discord token:', err);
    return null;
  }
}
