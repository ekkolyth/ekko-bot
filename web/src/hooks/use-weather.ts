'use client'

import { useQuery } from '@tanstack/react-query'
import { useLocation } from './use-location'

interface WeatherMetadata {
  name?: string
  latitude?: number
  longitude?: number
  reportedLocation?: {
    fullName?: string
    city?: string
    state?: string
    country?: string
  }
}

export interface WeatherResponse {
  currentWeather: {
    asOf: string
    cloudCover: number
    conditionCode: string
    daylight: boolean
    humidity: number
    metadata?: WeatherMetadata
    temperature: number
    temperatureApparent: number
    windSpeed: number
  }
  forecastDaily: {
    days: Array<{
      forecastStart: string
      forecastEnd: string
      conditionCode: string
      moonPhase: string
      precipitationChance: number
      precipitationType: string
      snowfallAmount: number
      temperatureMax: number
      temperatureMin: number
    }>
  }
  forecastHourly: {
    hours: Array<{
      forecastStart: string
      cloudCover: number
      conditionCode: string
      daylight: boolean
      precipitationChance: number
      precipitationType: string
      snowfallAmount: number
      snowfallIntensity: string
      temperature: number
      temperatureApparent: number
    }>
  }
}

export function useWeather() {
  const location = useLocation()

  const query = useQuery<WeatherResponse>({
    queryKey: ['weather', location.coordinates?.latitude, location.coordinates?.longitude],
    queryFn: async () => {
      if (!location.coordinates) {
        throw new Error('Missing coordinates')
      }

      const { latitude, longitude } = location.coordinates
      const params = new URLSearchParams({
        lat: String(latitude),
        lon: String(longitude),
      })

      const response = await fetch(`/api/weather?${params.toString()}`)

      if (!response.ok) {
        const detail = await response.text().catch(() => '')
        throw new Error(detail || `Weather API failed with ${response.status}`)
      }

      return (await response.json()) as WeatherResponse
    },
    enabled: location.status === 'granted' && Boolean(location.coordinates),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  return {
    ...query,
    locationStatus: location.status,
    coordinates: location.coordinates,
    locationErrorMessage: location.errorMessage,
  }
}

