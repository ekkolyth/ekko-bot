import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

import { auth } from '@/lib/auth/auth';
import { baseURL } from '@/lib/base-url';

interface WelcomeConfigRequest {
  channel_id: string;
  message: string;
  embed_title: string;
}

export const Route = createFileRoute('/api/welcome-config/')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        if (!baseURL) {
          return json({ error: 'API_URL not configured' }, { status: 500 });
        }

        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) {
          return json({ error: 'Unauthorized' }, { status: 401 });
        }

        try {
          const response = await fetch(`${baseURL}/api/welcome-config`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });

          if (!response.ok) {
            const detail = await response.text().catch(() => '');
            return json({ error: 'Failed to load welcome config', detail }, { status: response.status });
          }

          const data = await response.json();
          return json(data);
        } catch (err: unknown) {
          return json({ error: 'Unexpected error', detail: String(err) }, { status: 500 });
        }
      },
      PUT: async ({ request }: { request: Request }) => {
        if (!baseURL) {
          return json({ error: 'API_URL not configured' }, { status: 500 });
        }

        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) {
          return json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = (await request.json().catch(() => null)) as WelcomeConfigRequest | null;
        if (!body) {
          return json({ error: 'Invalid request' }, { status: 400 });
        }

        try {
          const response = await fetch(`${baseURL}/api/welcome-config`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          if (!response.ok) {
            const detail = await response.text().catch(() => '');
            return json({ error: 'Failed to save welcome config', detail }, { status: response.status });
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

