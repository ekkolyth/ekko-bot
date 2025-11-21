import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

import { auth } from '@/lib/auth/auth';
import { getDiscordFromSession } from '@/lib/get-discord-from-session';

export const Route = createFileRoute('/api/identity/')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) {
          return json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { discordTag } = await getDiscordFromSession(session);

        return json({
          discordTag: discordTag || null,
        });
      },
    },
  },
});

