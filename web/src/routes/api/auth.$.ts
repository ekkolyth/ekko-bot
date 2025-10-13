import { createFileRoute } from '@tanstack/react-router';
import { auth } from '../../../auth';

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      ALL: async ({ request }: { request: Request }) => {
        return auth.handler(request);
      },
    },
  },
});
