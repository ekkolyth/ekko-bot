import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { auth } from '@/lib/auth/auth';

interface DiscordChannel {
  id: string;
  name: string;
  type: number;
}

export const Route = createFileRoute('/api/guilds/$guildId/channels')({
  server: {
    handlers: {
      GET: async ({ params, request }: { params: { guildId: string }; request: Request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user?.id) {
          return json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { guildId } = params;

        if (!guildId) {
          return json({ error: 'Missing guild_id' }, { status: 400 });
        }

        // Use bot token to fetch channels (bot has permission, not user OAuth token)
        const botToken = process.env.DISCORD_BOT_TOKEN;
        if (!botToken) {
          console.error('DISCORD_BOT_TOKEN not configured');
          return json({ error: 'Bot token not configured' }, { status: 500 });
        }

        try {
          const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
            headers: {
              Authorization: `Bot ${botToken}`,
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
