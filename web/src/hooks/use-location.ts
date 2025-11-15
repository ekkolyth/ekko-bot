'use client'

import { useEffect, useState } from 'react'

export type LocationStatus = 'idle' | 'pending' | 'granted' | 'denied' | 'error'

export interface Coordinates {
  latitude: number
  longitude: number
}

export function useLocation(options?: PositionOptions) {
  const [status, setStatus] = useState<LocationStatus>('idle')
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setStatus('error')
      setErrorMessage('Geolocation not supported')
      return
    }

    setStatus('pending')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setStatus('granted')
      },
      (error) => {
        setStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'error')
        setErrorMessage(error.message)
      },
      { maximumAge: 60_000, timeout: 10_000, enableHighAccuracy: true, ...options }
    )
  }, [options])

  return { status, coordinates, errorMessage }
}

