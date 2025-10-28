import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { auth } from '@/lib/auth/auth';
import { hasDiscordAccount } from '@/lib/auth/has-discord';

export const Route = createFileRoute('/api/auth/has-discord')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session?.user?.id) {
          return json({ hasDiscord: false }, { status: 200 });
        }

        const hasDiscord = await hasDiscordAccount(session.user.id);

        return json({ hasDiscord });
      },
    },
  },
});
