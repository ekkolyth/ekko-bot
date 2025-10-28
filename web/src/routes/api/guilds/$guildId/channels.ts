import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { auth, db } from '@/lib/auth/auth';
import * as authSchema from '@/db/auth-schema';
import { eq, and } from 'drizzle-orm';

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

        try {
          // Get Discord access token from account table
          const discordAccounts = await db
            .select()
            .from(authSchema.account)
            .where(
              and(
                eq(authSchema.account.userId, session.user.id),
                eq(authSchema.account.providerId, 'discord')
              )
            )
            .limit(1);

          if (!discordAccounts || discordAccounts.length === 0 || !discordAccounts[0].accessToken) {
            return json({ error: 'Discord account not linked or token missing' }, { status: 403 });
          }

          const discordAccount = discordAccounts[0];

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
