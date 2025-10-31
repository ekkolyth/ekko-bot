import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { auth } from '@/lib/auth/auth';
import { baseURL } from '@/lib/base-url';

export const Route = createFileRoute('/api/queue/remove/')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        if (!baseURL) {
          return json({ error: 'Server Error: API_URL not set' }, { status: 500 });
        }

        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) {
          return json({ error: 'Unauthorized' }, { status: 401 });
        }

        const requestBody = (await request.json().catch(() => null)) as {
          voice_channel_id: string;
          position: number;
        } | null;
        if (!requestBody || !requestBody.voice_channel_id || requestBody.position === undefined) {
          return json({ error: 'Missing voice_channel_id or position' }, { status: 400 });
        }

        try {
          const apiURL = `${baseURL}/api/queue/remove`;
          const response = await fetch(apiURL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
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
