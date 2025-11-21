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
  const { token, accountId } = await getDiscordAccessToken(session.user.id);

  if (!token || !accountId) {
    return { discordUserId: null, discordTag: null };
  }

  // Fetch actual Discord username from Discord API
  try {
    const response = await fetch('https://discord.com/api/v10/users/@me', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const discordUser = await response.json();
      // Discord username is the @mention handle (e.g., "johndoe")
      // This is what will appear in the welcome message mention
      const discordTag = discordUser.username || accountId;
      return {
        discordUserId: accountId,
        discordTag: discordTag,
      };
    }
  } catch (err) {
    console.error('Failed to fetch Discord user info:', err);
  }

  // Fallback to account ID if API call fails
  return {
    discordUserId: accountId,
    discordTag: accountId,
  };
}
