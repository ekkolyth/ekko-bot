import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

import { auth } from '@/lib/auth/auth';
import { baseURL } from '@/lib/base-url';

interface CommandRequestBody {
  name: string;
  response: string;
}

export const Route = createFileRoute('/api/commands/')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        if (!baseURL) {
          return json({ error: 'Server Error: API_URL not set' }, { status: 500 });
        }

        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) {
          return json({ error: 'Unauthorized' }, { status: 401 });
        }

        try {
          const apiURL = `${baseURL}/api/commands`;
          const response = await fetch(apiURL, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });

          if (!response.ok) {
            const detail = await response.text().catch(() => '');
            return json({ error: 'API request failed', detail }, { status: response.status });
          }

          const data = await response.json();
          return json(data);
        } catch (err: unknown) {
          return json({ error: 'Unexpected error', detail: String(err) }, { status: 500 });
        }
      },
      POST: async ({ request }: { request: Request }) => {
        if (!baseURL) {
          return json({ error: 'Server Error: API_URL not set' }, { status: 500 });
        }

        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) {
          return json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = (await request.json().catch(() => null)) as CommandRequestBody | null;
        if (!body) {
          return json({ error: 'Invalid Request Body' }, { status: 400 });
        }

        try {
          const apiURL = `${baseURL}/api/commands`;
          const response = await fetch(apiURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: body.name,
              response: body.response,
            }),
          });

          if (!response.ok) {
            const detail = await response.text().catch(() => '');
            return json({ error: 'API request failed', detail }, { status: response.status });
          }

          const data = await response.json();
          return json(data, { status: 201 });
        } catch (err: unknown) {
          return json({ error: 'Unexpected error', detail: String(err) }, { status: 500 });
        }
      },
    },
  },
});

