import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { auth, db } from '@/lib/auth/auth';
import * as authSchema from '@/db/auth-schema';
import { eq, and } from 'drizzle-orm';

export const Route = createFileRoute('/api/auth/debug-discord')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session?.user?.id) {
          return json({ error: 'No session or user ID' }, { status: 401 });
        }

        // Query for Discord account
        const discordAccounts = await db
          .select()
          .from(authSchema.account)
          .where(
            and(
              eq(authSchema.account.userId, session.user.id),
              eq(authSchema.account.providerId, 'discord')
            )
          );

        // Query for ALL accounts for this user
        const allAccounts = await db
          .select()
          .from(authSchema.account)
          .where(eq(authSchema.account.userId, session.user.id));

        return json({
          sessionUserId: session.user.id,
          discordAccounts: discordAccounts,
          allAccounts: allAccounts,
          hasDiscord: discordAccounts.length > 0,
        });
      },
    },
  },
});
