import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

import { auth } from '@/lib/auth/auth';

interface DiscordChannel {
  id: string;
  name: string;
  type: number;
}

const CHANNEL_TYPE_TO_DISCORD: Record<string, number> = {
  text: 0,
  voice: 2,
};

export const Route = createFileRoute('/api/guilds/channels')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user?.id) {
          return json({ error: 'Unauthorized' }, { status: 401 });
        }

        const guildId = process.env.DISCORD_GUILD_ID;
        if (!guildId) {
          return json({ error: 'Missing DISCORD_GUILD_ID' }, { status: 500 });
        }

        const botToken = process.env.DISCORD_BOT_TOKEN;
        if (!botToken) {
          return json({ error: 'Bot token not configured' }, { status: 500 });
        }

        const url = new URL(request.url);
        const typeParam = (url.searchParams.get('type') ?? 'text').toLowerCase();
        const targetType = CHANNEL_TYPE_TO_DISCORD[typeParam] ?? CHANNEL_TYPE_TO_DISCORD.text;

        try {
          const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
            headers: {
              Authorization: `Bot ${botToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const detail = await response.text().catch(() => '');
            return json({ error: 'Failed to fetch channels', detail }, { status: response.status });
          }

          const channels = (await response.json()) as DiscordChannel[];

          const filtered = channels
            .filter((channel) => channel.type === targetType)
            .map((channel) => ({
              id: channel.id,
              name: channel.name,
            }));

          return json({ ok: true, channels: filtered });
        } catch (err: unknown) {
          return json({ error: 'Unexpected error', detail: String(err) }, { status: 500 });
        }
      },
    },
  },
});

