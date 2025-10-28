import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { authClient } from '@/lib/auth/client';

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
      GET: async () => {
        const session = await authClient.getSession();
        if (!session) {
          return json({ error: 'Unauthorized' }, { status: 401 });
        }

        try {
          // Fetch user's guilds from Discord API
          const accounts = (session as any)?.user?.accounts || [];
          const discordAccount = accounts.find((acc: any) => acc.providerId === 'discord');

          if (!discordAccount || !discordAccount.accessToken) {
            return json({ error: 'Discord account not linked or token missing' }, { status: 403 });
          }

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
