import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { auth } from '@/lib/auth/auth';
import { db } from '@/lib/auth/auth';
import * as authSchema from '@/db/auth-schema';
import { eq, and, isNotNull } from 'drizzle-orm';

export const Route = createFileRoute('/api/auth/check-password-account')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user?.id) {
          return json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = new URL(request.url).searchParams.get('userId');
        if (!userId || userId !== session.user.id) {
          return json({ error: 'Invalid user ID' }, { status: 400 });
        }

        // Check if user has any account with a password (email/password account)
        const passwordAccounts = await db
          .select()
          .from(authSchema.account)
          .where(and(eq(authSchema.account.userId, userId), isNotNull(authSchema.account.password)))
          .limit(1);

        return json({
          hasPasswordAccount: passwordAccounts.length > 0,
        });
      },
    },
  },
});
