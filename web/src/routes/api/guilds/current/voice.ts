import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { auth } from '@/lib/auth/auth'
import { baseURL } from '@/lib/base-url'
import { getDiscordFromSession } from '@/lib/get-discord-from-session'

export const Route = createFileRoute('/api/guilds/current/voice')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        if (!baseURL) {
          return json({ ok: false, error: 'API_URL not configured' }, { status: 500 })
        }

        const session = await auth.api.getSession({ headers: request.headers })
        if (!session) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }

        const { discordUserId } = await getDiscordFromSession(session)
        if (!discordUserId) {
          return json({ ok: false, channel: null }, { status: 200 })
        }

        const apiURL = `${baseURL}/api/voice-channel?discord_user_id=${encodeURIComponent(
          discordUserId
        )}`

        try {
          const response = await fetch(apiURL)
          if (!response.ok) {
            const detail = await response.text().catch(() => '')
            return json(
              { ok: false, error: 'Failed to detect voice channel', detail },
              { status: response.status }
            )
          }

          const data = await response.json()
          return json({ ok: true, channel: data.channel ?? null })
        } catch (error) {
          return json(
            { ok: false, error: 'Unexpected error', detail: String(error) },
            { status: 500 }
          )
        }
      },
    },
  },
})

