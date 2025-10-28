import { db } from '@/lib/auth/auth';
import * as authSchema from '@/db/auth-schema';
import { eq, and } from 'drizzle-orm';

/**
 * Extracts Discord user ID and tag from Better Auth session
 * Discord info is stored in the account table, not user table
 */
export async function getDiscordFromSession(session: any): Promise<{
  discordUserId: string | null;
  discordTag: string | null;
}> {
  if (!session?.user?.id) {
    return { discordUserId: null, discordTag: null };
  }

  // Query the account table directly for Discord account
  const discordAccount = await db
    .select()
    .from(authSchema.account)
    .where(
      and(
        eq(authSchema.account.userId, session.user.id),
        eq(authSchema.account.providerId, 'discord')
      )
    )
    .limit(1);

  if (!discordAccount || discordAccount.length === 0) {
    return { discordUserId: null, discordTag: null };
  }

  return {
    discordUserId: discordAccount[0].accountId, // This is the Discord user ID
    discordTag: session?.user?.name || discordAccount[0].accountId, // Fallback to ID if no name
  };
}
