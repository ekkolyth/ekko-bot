import { db } from '@/lib/auth/auth';
import * as authSchema from '@/db/auth-schema';
import { eq, and } from 'drizzle-orm';

/**
 * Check if a user has a Discord account linked
 * Queries the database directly since session doesn't always include accounts
 */
export async function hasDiscordAccount(userId: string): Promise<boolean> {
  const discordAccount = await db
    .select()
    .from(authSchema.account)
    .where(and(eq(authSchema.account.userId, userId), eq(authSchema.account.providerId, 'discord')))
    .limit(1);

  return discordAccount.length > 0;
}
