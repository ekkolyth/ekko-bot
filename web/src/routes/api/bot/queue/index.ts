import { createFileRoute } from '@tanstack/react-router'
import { json } from "@tanstack/react-start"

export const Route = createFileRoute('/api/bot/queue/')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const requestBody = await request.json().catch(() => null)
        if (requestBody === null) {
          return json({ error: "Invalid or missing URL" }, { status: 400 })
        }


      }
    },
  },
});
