import { createFileRoute } from '@tanstack/react-router'
import { json } from "@tanstack/react-start"
import { baseURL } from "@/lib/base-url"

export const Route = createFileRoute('/api/healthz/')({
  server: {
    handlers: {
      GET: async () => {
        try {
          // Forward the request to your Go API
          const response = await fetch(`${baseURL}/api/health`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          })

          // If the API is unhealthy
          if (!response.ok) {
            const text = await response.text()
            return json(
              { ok: false, error: "Upstream API error", detail: text },
              { status: 502 }
            )
          }

          // Parse JSON from the Go API and return it
          const data = await response.json()
          return json(data, { status: 200 })
        } catch (error) {
          return json(
            { ok: false, error: "Failed to contact Go API", detail: String(error) },
            { status: 500 }
          )
        }
      },
    },
  },
})
