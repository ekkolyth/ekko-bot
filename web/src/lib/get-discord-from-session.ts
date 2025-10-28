import { getDiscordAccessToken } from './auth/get-discord-access-token';

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

  // Use the helper that auto-refreshes tokens
  const { accountId } = await getDiscordAccessToken(session.user.id);

  if (!accountId) {
    return { discordUserId: null, discordTag: null };
  }

  return {
    discordUserId: accountId, // This is the Discord user ID
    discordTag: session?.user?.name || accountId, // Fallback to ID if no name
  };
}
