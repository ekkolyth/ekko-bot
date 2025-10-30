import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { auth } from '@/lib/auth/auth';
import { baseURL } from '@/lib/base-url';
import { getDiscordFromSession } from '@/lib/get-discord-from-session';

interface QueueRequestBody {
  voice_channel_id: string;
  url: string;
}

export const Route = createFileRoute('/api/queue/')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        if (!baseURL) {
          return json({ error: 'Server Error: BOT_API_URL not set' }, { status: 500 });
        }

        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) {
          return json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get voice_channel_id from query params
        const url = new URL(request.url);
        const voiceChannelId = url.searchParams.get('voice_channel_id');

        if (!voiceChannelId) {
          return json({ error: 'Missing voice_channel_id query parameter' }, { status: 400 });
        }

        try {
          const apiURL = `${baseURL}/api/queue?voice_channel_id=${encodeURIComponent(voiceChannelId)}`;
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
      POST: async ({ request }: { request: Request }) => {
        if (!baseURL) {
          console.log('Server Error: BOT_API_URL not set');
          return json({ error: 'Server Error: BOT_API_URL not set' }, { status: 500 });
        }

        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) {
          return json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get Discord user ID from account table
        const { discordUserId, discordTag } = await getDiscordFromSession(session);

        if (!discordUserId) {
          return json(
            { error: 'Discord account not linked. Please connect your Discord account.' },
            { status: 403 }
          );
        }

        const requestBody = (await request.json().catch(() => null)) as QueueRequestBody | null;
        if (!requestBody) {
          return json({ error: 'Invalid Request Body' }, { status: 400 });
        }

        // Validate required fields
        if (!requestBody.voice_channel_id) {
          return json({ error: 'Missing voice_channel_id' }, { status: 400 });
        }

        if (!requestBody.url) {
          return json({ error: 'Missing url' }, { status: 400 });
        }

        // Build API URL (no guild in path)
        const apiURL = `${baseURL}/api/queue`;

        const controller = new AbortController();
        const timeout = 10 * 60 * 1000;
        const timer = setTimeout(() => controller.abort(), timeout);

        try {
          const response = await fetch(apiURL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              discord_user_id: discordUserId,
              discord_tag: discordTag,
              voice_channel_id: requestBody.voice_channel_id,
              url: requestBody.url,
            }),
            signal: controller.signal,
          });

          clearTimeout(timer);

          if (!response.ok) {
            const text = await response.text().catch(() => '');
            // Preserve upstream status for clearer debugging
            return json({ error: 'API request failed', detail: text }, { status: response.status });
          }

          const success = await response.json().catch(() => null);
          return json({ ok: true, success });
        } catch (err: unknown) {
          if (err instanceof Error && err.name === 'AbortError') {
            return json({ error: 'Request timed out' }, { status: 504 });
          }
          return json({ error: 'Unexpected error', detail: String(err) }, { status: 500 });
        } finally {
          clearTimeout(timer);
        }
      },
    },
  },
});
