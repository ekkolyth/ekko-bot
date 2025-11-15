'use client'

import type { ReactNode } from 'react'

import { WeatherIcon } from '@/components/weather-icon'
import { useCondition } from '@/hooks/use-condition'
import { useLocationName } from '@/hooks/use-location-name'
import { useWeather } from '@/hooks/use-weather'

function formatTemperatureCelsiusToFahrenheit(value?: number | null) {
  if (typeof value !== 'number') {
    return null
  }
  return Math.round((value * 9) / 5 + 32)
}

function resolveLocationLabel(
  data: ReturnType<typeof useWeather>['data'],
  geocodedName?: { city?: string; state?: string; country?: string; displayName?: string | null }
) {
  if (geocodedName) {
    const parts = [geocodedName.city || geocodedName.displayName, geocodedName.state || geocodedName.country].filter(
      Boolean
    )
    if (parts.length) {
      return parts.join(', ')
    }
  }

  const reported = data?.currentWeather.metadata?.reportedLocation
  const parts = [reported?.city, reported?.state || reported?.country].filter(Boolean)

  if (parts.length) {
    return parts.join(', ')
  }

  if (reported?.fullName) {
    return reported.fullName
  }

  const metadataName = data?.currentWeather.metadata?.name
  if (metadataName) {
    return metadataName
  }

  return 'Unknown location'
}

export function WeatherCard() {
  const { data, isLoading, error, locationStatus, locationErrorMessage, coordinates } = useWeather()
  const { data: geocodedLocation } = useLocationName(coordinates ?? null)
  const { currentCondition } = useCondition(data)

  const temperature = formatTemperatureCelsiusToFahrenheit(data?.currentWeather.temperature)
  const locationLabel = resolveLocationLabel(data, geocodedLocation)

  let body: ReactNode = null

  if (locationStatus === 'pending' || locationStatus === 'idle') {
    body = <p className="text-[11px] text-muted-foreground">Locating you…</p>
  } else if (locationStatus === 'denied') {
    body = <p className="text-[11px] text-muted-foreground">Enable location access for weather.</p>
  } else if (locationStatus === 'error') {
    body = (
      <p className="text-[11px] text-muted-foreground">
        {locationErrorMessage ?? 'Unable to read your location. Please try again.'}
      </p>
    )
  } else if (isLoading) {
    body = <p className="text-[11px] text-muted-foreground">Loading weather…</p>
  } else if (error) {
    body = (
      <p className="text-[11px] text-destructive/80">
        {error instanceof Error ? error.message : 'Weather is unavailable right now.'}
      </p>
    )
  } else if (!data) {
    body = <p className="text-[11px] text-muted-foreground">Weather data unavailable.</p>
  } else {
    body = (
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex flex-col leading-tight">
          <span className="text-[11px] text-muted-foreground/90">{locationLabel}</span>
          <span className="text-sm font-medium text-foreground">{currentCondition}</span>
        </div>
        <div className="flex items-center gap-2 text-foreground">
          <WeatherIcon
            conditionCode={data.currentWeather.conditionCode}
            isDaylight={data.currentWeather.daylight}
            size={30}
            className="opacity-80"
          />
          <span className="text-xl font-semibold">{temperature !== null ? `${temperature}°` : '--'}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-transparent px-3 py-2 text-xs text-muted-foreground opacity-70">{body}</div>
  )
}
