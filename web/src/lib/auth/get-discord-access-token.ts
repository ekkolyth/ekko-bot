import { db } from '@/lib/auth/auth';
import * as authSchema from '@/db/auth-schema';
import { eq, and } from 'drizzle-orm';
import { refreshDiscordToken } from './refresh-discord-token';

/**
 * Get Discord access token for a user, refreshing if expired
 */
export async function getDiscordAccessToken(userId: string): Promise<{
  token: string | null;
  accountId: string | null;
}> {
  const discordAccounts = await db
    .select()
    .from(authSchema.account)
    .where(and(eq(authSchema.account.userId, userId), eq(authSchema.account.providerId, 'discord')))
    .limit(1);

  if (!discordAccounts || discordAccounts.length === 0) {
    return { token: null, accountId: null };
  }

  const account = discordAccounts[0];

  // Check if token is expired or about to expire (within 5 minutes)
  const now = new Date();
  const expiresAt = account.accessTokenExpiresAt;

  if (expiresAt && expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    console.log('Discord token expired or expiring soon, refreshing...');
    const newToken = await refreshDiscordToken(account.id);
    if (newToken) {
      return { token: newToken, accountId: account.accountId };
    }
    // If refresh failed, try to use existing token anyway
  }

  return { token: account.accessToken, accountId: account.accountId };
}
