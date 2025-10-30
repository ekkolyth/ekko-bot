import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { auth } from '@/lib/auth/auth';
import { baseURL } from '@/lib/base-url';

export const Route = createFileRoute('/api/queue/pause/')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        if (!baseURL) {
          return json({ error: 'Server Error: BOT_API_URL not set' }, { status: 500 });
        }

        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) {
          return json({ error: 'Unauthorized' }, { status: 401 });
        }

        try {
          const apiURL = `${baseURL}/api/queue/pause`;
          const response = await fetch(apiURL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const text = await response.text().catch(() => '');
            return json({ error: 'API request failed', detail: text }, { status: response.status });
          }

          const data = await response.json();
          return json(data);
        } catch (err: unknown) {
          return json({ error: 'Unexpected error', detail: String(err) }, { status: 500 });
        }
      },
    },
  },
});

