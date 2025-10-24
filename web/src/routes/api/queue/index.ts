import { createFileRoute } from '@tanstack/react-router'
import { json } from "@tanstack/react-start"
import { authClient } from '@/lib/auth/client'
import { baseURL } from "@/lib/base-url"


export const Route = createFileRoute('/api/queue/')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        if (!baseURL) {
          console.log('Server Error: BOT_API_URL not set')
          return json({ error: 'Server Error: BOT_API_URL not set' }, { status: 500 })
        }

        const session = await authClient.getSession()
        if (!session) {
          return json({ error: 'Unauthorized' }, { status: 401 })
        }

        const requestBody = await request.json().catch(() => null)
        if (!requestBody) {
          return json({ error: "Invalid Response" }, { status: 400 })
        }
        const apiURL: string = new URL(Route.path, baseURL).toString()

        const controller = new AbortController()
        const timeout = 10 * 60 * 1000
        const timer = setTimeout(() => controller.abort(), timeout)

        try {
          const response = await fetch(apiURL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
          })

          clearTimeout(timer)

          if (!response.ok) {
            const err = await response.text().catch(() => '')
            return json({ error: 'Bot API failed', detail: err }, { status: 502 })
          }

          const success = await response.json().catch(() => null)
          return json({ ok: true, success })
        }

        catch (err: unknown) {
          if (err instanceof Error && err.name === 'AbortError') {
            return json({ error: 'Request timed out' }, { status: 504 })
          }
          return json({ error: 'Unexpected error', detail: String(err) }, { status: 500 })
        } finally {
          clearTimeout(timer)
        }
      }
    }
  }
},
);
