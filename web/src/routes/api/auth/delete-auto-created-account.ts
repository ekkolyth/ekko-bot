import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { auth } from '@/lib/auth/auth';
import { db } from '@/lib/auth/auth';
import * as authSchema from '@/db/auth-schema';
import { eq } from 'drizzle-orm';

export const Route = createFileRoute('/api/auth/delete-auto-created-account')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user?.id) {
          return json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // Delete all sessions for this user first
        await db.delete(authSchema.session).where(eq(authSchema.session.userId, userId));

        // Delete all accounts for this user
        await db.delete(authSchema.account).where(eq(authSchema.account.userId, userId));

        // Delete the user
        await db.delete(authSchema.user).where(eq(authSchema.user.id, userId));

        return json({ success: true });
      },
    },
  },
});
