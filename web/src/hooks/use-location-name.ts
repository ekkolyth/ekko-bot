'use client'

import { useQuery } from '@tanstack/react-query'
import type { Coordinates } from './use-location'

interface ReverseGeocodeResponse {
  city?: string
  state?: string
  country?: string
  displayName?: string
}

export function useLocationName(coordinates: Coordinates | null) {
  return useQuery<ReverseGeocodeResponse>({
    queryKey: ['location-name', coordinates?.latitude, coordinates?.longitude],
    queryFn: async () => {
      if (!coordinates) {
        throw new Error('Missing coordinates')
      }

      const params = new URLSearchParams({
        lat: String(coordinates.latitude),
        lon: String(coordinates.longitude),
      })

      const response = await fetch(`/api/location-name?${params.toString()}`)
      if (!response.ok) {
        const detail = await response.text().catch(() => '')
        throw new Error(detail || `Failed to reverse geocode: ${response.status}`)
      }

      return (await response.json()) as ReverseGeocodeResponse
    },
    enabled: Boolean(coordinates),
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
  })
}

