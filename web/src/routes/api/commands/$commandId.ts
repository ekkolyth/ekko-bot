import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

import { auth } from '@/lib/auth/auth';
import { baseURL } from '@/lib/base-url';

interface CommandRequestBody {
  name: string;
  response: string;
}

export const Route = createFileRoute('/api/commands/$commandId')({
  server: {
    handlers: {
      PATCH: async ({ params, request }: { params: { commandId: string }; request: Request }) => {
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
          const apiURL = `${baseURL}/api/commands/${params.commandId}`;
          const response = await fetch(apiURL, {
            method: 'PATCH',
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
          return json(data);
        } catch (err: unknown) {
          return json({ error: 'Unexpected error', detail: String(err) }, { status: 500 });
        }
      },
      DELETE: async ({ params, request }: { params: { commandId: string }; request: Request }) => {
        if (!baseURL) {
          return json({ error: 'Server Error: API_URL not set' }, { status: 500 });
        }

        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) {
          return json({ error: 'Unauthorized' }, { status: 401 });
        }

        try {
          const apiURL = `${baseURL}/api/commands/${params.commandId}`;
          const response = await fetch(apiURL, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
          });

          if (!response.ok) {
            const detail = await response.text().catch(() => '');
            return json({ error: 'API request failed', detail }, { status: response.status });
          }

          return json({ ok: true }, { status: 204 });
        } catch (err: unknown) {
          return json({ error: 'Unexpected error', detail: String(err) }, { status: 500 });
        }
      },
    },
  },
});
