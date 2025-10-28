import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { auth } from '@/lib/auth/auth';
import { getDiscordAccessToken } from '@/lib/auth/get-discord-access-token';

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
          // Get Discord access token (auto-refreshes if expired)
          const { token } = await getDiscordAccessToken(session.user.id);

          if (!token) {
            return json(
              {
                error:
                  'Discord account not linked or token expired. Please reconnect your Discord account.',
              },
              { status: 403 }
            );
          }

          const response = await fetch('https://discord.com/api/v10/users/@me/guilds', {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          console.log('Discord API response status:', response.status);

          if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            console.error('Discord API error:', response.status, errorText);
            return json(
              { error: 'Failed to fetch guilds', detail: errorText, status: response.status },
              { status: 502 }
            );
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
          console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace');
          return json({ error: 'Unexpected error', detail: String(err) }, { status: 500 });
        }
      },
    },
  },
});
