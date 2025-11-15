import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { auth } from '@/lib/auth/auth';
import { baseURL } from '@/lib/base-url';

export const Route = createFileRoute('/api/recent/')({
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

        const url = new URL(request.url);
        const voiceChannelId = url.searchParams.get('voice_channel_id');

        if (!voiceChannelId) {
          return json({ error: 'Missing voice_channel_id query parameter' }, { status: 400 });
        }

        try {
          const apiURL = `${baseURL}/api/queue/recent?voice_channel_id=${encodeURIComponent(voiceChannelId)}`;
          const response = await fetch(apiURL, {
            method: 'GET',
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

