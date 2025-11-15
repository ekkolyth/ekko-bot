import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'

export const Route = createFileRoute('/api/location-name/')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const url = new URL(request.url)
        const latitude = url.searchParams.get('lat')
        const longitude = url.searchParams.get('lon')

        if (!latitude || !longitude) {
          return json({ error: 'lat and lon are required' }, { status: 400 })
        }

        const reverseUrl = new URL('https://nominatim.openstreetmap.org/reverse')
        reverseUrl.searchParams.set('format', 'jsonv2')
        reverseUrl.searchParams.set('lat', latitude)
        reverseUrl.searchParams.set('lon', longitude)
        reverseUrl.searchParams.set('zoom', '12')
        reverseUrl.searchParams.set('addressdetails', '1')

        try {
          const response = await fetch(reverseUrl, {
            headers: {
              'User-Agent': 'EkkoBotWeather/1.0 (https://ekko.gg)',
            },
          })

          if (!response.ok) {
            const detail = await response.text().catch(() => '')
            return json({ error: 'Reverse geocoding failed', detail }, { status: response.status })
          }

          const data = (await response.json()) as {
            display_name?: string
            address?: Record<string, string>
          }

          const address = data.address ?? {}
          const city =
            address.city ||
            address.town ||
            address.village ||
            address.hamlet ||
            address.municipality ||
            address.county

          return json({
            city,
            state: address.state,
            country: address.country,
            displayName: data.display_name,
          })
        } catch (error) {
          return json(
            { error: 'Reverse geocoding error', detail: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
          )
        }
      },
    },
  },
})

