import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { authClient } from '@/lib/auth/client';

interface DiscordChannel {
  id: string;
  name: string;
  type: number;
}

export const Route = createFileRoute('/api/guilds/$guildId/channels')({
  server: {
    handlers: {
      GET: async ({ params }: { params: { guildId: string } }) => {
        const session = await authClient.getSession();
        if (!session) {
          return json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { guildId } = params;

        if (!guildId) {
          return json({ error: 'Missing guild_id' }, { status: 400 });
        }

        try {
          // Fetch guild channels from Discord API
          // We need to get the user's Discord access token from Better Auth
          const accounts = (session as any)?.user?.accounts || [];
          const discordAccount = accounts.find((acc: any) => acc.providerId === 'discord');

          if (!discordAccount || !discordAccount.accessToken) {
            return json({ error: 'Discord account not linked or token missing' }, { status: 403 });
          }

          const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
            headers: {
              Authorization: `Bearer ${discordAccount.accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            console.error('Discord API error:', errorText);
            return json(
              { error: 'Failed to fetch guild channels', detail: errorText },
              { status: 502 }
            );
          }

          const channels = (await response.json()) as DiscordChannel[];

          // Filter for voice channels (type 2)
          const voiceChannels = channels
            .filter((channel) => channel.type === 2)
            .map((channel) => ({
              id: channel.id,
              name: channel.name,
            }));

          return json({ ok: true, channels: voiceChannels });
        } catch (err: unknown) {
          console.error('Error fetching guild channels:', err);
          return json({ error: 'Unexpected error', detail: String(err) }, { status: 500 });
        }
      },
    },
  },
});
