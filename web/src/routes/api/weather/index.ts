import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { generateWeatherKitJWT } from '@/lib/weatherkit'

export const Route = createFileRoute('/api/weather/')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const incomingUrl = new URL(request.url)
        const latitude = Number(incomingUrl.searchParams.get('lat') ?? 41.668738)
        const longitude = Number(incomingUrl.searchParams.get('lon') ?? -86.174171)

        const dataSets = ['currentWeather', 'forecastDaily', 'forecastHourly']

        try {
          const jwt = await generateWeatherKitJWT()
          const weatherURL = new URL(`https://weatherkit.apple.com/api/v1/weather/en/${latitude}/${longitude}`)
          weatherURL.searchParams.set('dataSets', dataSets.join(','))

          const response = await fetch(weatherURL, {
            headers: {
              Authorization: `Bearer ${jwt}`,
              Accept: 'application/json',
            },
          })

          if (!response.ok) {
            const detail = await response.text().catch(() => '')
            return json(
              {
                error: `WeatherKit error ${response.status}`,
                detail: detail.slice(0, 500),
              },
              { status: response.status }
            )
          }

          const data = await response.json()
          return json(data)
        } catch (error) {
          const detail = error instanceof Error ? error.message : 'Unknown error'
          return json(
            {
              error: 'Failed to fetch weather data',
              detail,
            },
            { status: 500 }
          )
        }
      },
    },
  },
})

