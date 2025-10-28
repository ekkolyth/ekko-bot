import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { auth, db } from '@/lib/auth/auth';
import * as authSchema from '@/db/auth-schema';
import { eq, and } from 'drizzle-orm';

interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

export const Route = createFileRoute('/api/guilds/')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user?.id) {
          return json({ error: 'Unauthorized' }, { status: 401 });
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

          const response = await fetch('https://discord.com/api/v10/users/@me/guilds', {
            headers: {
              Authorization: `Bearer ${discordAccount.accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            console.error('Discord API error:', errorText);
            return json({ error: 'Failed to fetch guilds', detail: errorText }, { status: 502 });
          }

          const guilds = (await response.json()) as DiscordGuild[];

          return json({
            ok: true,
            guilds: guilds.map((guild) => ({
              id: guild.id,
              name: guild.name,
              icon: guild.icon,
            })),
          });
        } catch (err: unknown) {
          console.error('Error fetching guilds:', err);
          return json({ error: 'Unexpected error', detail: String(err) }, { status: 500 });
        }
      },
    },
  },
});
