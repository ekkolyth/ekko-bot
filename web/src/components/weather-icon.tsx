'use client'

import { cn } from '@/lib/utils'

type WeatherIconType =
  | 'clear-day'
  | 'clear-night'
  | 'cloudy-day'
  | 'cloudy-night'
  | 'dust'
  | 'fog-day'
  | 'fog-night'
  | 'fog'
  | 'frost-day'
  | 'frost-night'
  | 'frost'
  | 'hail'
  | 'haze-day'
  | 'haze-night'
  | 'haze'
  | 'hurricane'
  | 'isolated-thunderstorms-day'
  | 'isolated-thunderstorms-night'
  | 'isolated-thunderstorms'
  | 'rain-and-sleet-mix'
  | 'rain-and-snow-mix'
  | 'rainy-day'
  | 'rainy-night'
  | 'rainy'
  | 'scattered-thunderstorms-day'
  | 'scattered-thunderstorms-night'
  | 'scattered-thunderstorms'
  | 'severe-thunderstorm'
  | 'snow-and-sleet-mix'
  | 'snowy-day'
  | 'snowy-night'
  | 'snowy'
  | 'thunderstorms'
  | 'tornado'
  | 'tropical-storm'
  | 'wind'

const iconMap: Record<WeatherIconType, string> = {
  'clear-day': '/weather/icons/clear-day.svg',
  'clear-night': '/weather/icons/clear-night.svg',
  'cloudy-day': '/weather/icons/cloudy.svg',
  'cloudy-night': '/weather/icons/cloudy.svg',
  dust: '/weather/icons/dust.svg',
  'fog-day': '/weather/icons/fog-day.svg',
  'fog-night': '/weather/icons/fog-night.svg',
  fog: '/weather/icons/fog.svg',
  'frost-day': '/weather/icons/clear-day.svg',
  'frost-night': '/weather/icons/clear-night.svg',
  frost: '/weather/icons/clear-day.svg',
  hail: '/weather/icons/hail.svg',
  'haze-day': '/weather/icons/haze-day.svg',
  'haze-night': '/weather/icons/haze-night.svg',
  haze: '/weather/icons/haze.svg',
  hurricane: '/weather/icons/hurricane.svg',
  'isolated-thunderstorms-day': '/weather/icons/thunderstorms-day.svg',
  'isolated-thunderstorms-night': '/weather/icons/thunderstorms-night.svg',
  'isolated-thunderstorms': '/weather/icons/thunderstorms.svg',
  'rain-and-sleet-mix': '/weather/icons/sleet.svg',
  'rain-and-snow-mix': '/weather/icons/sleet.svg',
  'rainy-day': '/weather/icons/rain.svg',
  'rainy-night': '/weather/icons/rain.svg',
  rainy: '/weather/icons/rain.svg',
  'scattered-thunderstorms-day': '/weather/icons/thunderstorms-day.svg',
  'scattered-thunderstorms-night': '/weather/icons/thunderstorms-night.svg',
  'scattered-thunderstorms': '/weather/icons/thunderstorms.svg',
  'severe-thunderstorm': '/weather/icons/thunderstorms.svg',
  'snow-and-sleet-mix': '/weather/icons/sleet.svg',
  'snowy-day': '/weather/icons/snow.svg',
  'snowy-night': '/weather/icons/snow.svg',
  snowy: '/weather/icons/snow.svg',
  thunderstorms: '/weather/icons/thunderstorms.svg',
  tornado: '/weather/icons/tornado.svg',
  'tropical-storm': '/weather/icons/thunderstorms.svg',
  wind: '/weather/icons/wind.svg',
}

interface WeatherIconProps {
  conditionCode: string
  isDaylight: boolean
  size?: number
  className?: string
}

function resolveIcon(conditionCode: string, isDaylight: boolean): WeatherIconType {
  switch (conditionCode) {
    case 'clear':
    case 'mostlyClear':
      return isDaylight ? 'clear-day' : 'clear-night'
    case 'cloudy':
    case 'partlyCloudy':
    case 'mostlyCloudy':
    case 'overcast':
      return isDaylight ? 'cloudy-day' : 'cloudy-night'
    case 'foggy':
      return isDaylight ? 'fog-day' : 'fog-night'
    case 'haze':
    case 'smoky':
      return isDaylight ? 'haze-day' : 'haze-night'
    case 'blowingDust':
      return 'dust'
    case 'drizzle':
    case 'rain':
    case 'heavyRain':
      return isDaylight ? 'rainy-day' : 'rainy-night'
    case 'sunShowers':
      return 'rainy-day'
    case 'isolatedThunderstorms':
      return isDaylight ? 'isolated-thunderstorms-day' : 'isolated-thunderstorms-night'
    case 'scatteredThunderstorms':
      return isDaylight ? 'scattered-thunderstorms-day' : 'scattered-thunderstorms-night'
    case 'strongStorms':
    case 'thunderstorms':
      return 'thunderstorms'
    case 'snow':
    case 'flurries':
      return isDaylight ? 'snowy-day' : 'snowy-night'
    case 'sunFlurries':
      return 'snowy-day'
    case 'sleet':
    case 'wintryMix':
      return 'snow-and-sleet-mix'
    case 'hail':
      return 'hail'
    case 'blizzard':
    case 'blowingSnow':
      return 'wind'
    case 'heavySnow':
      return 'snowy'
    case 'freezingRain':
    case 'freezingDrizzle':
      return isDaylight ? 'frost-day' : 'frost-night'
    case 'tornado':
      return 'tornado'
    case 'hurricane':
      return 'tropical-storm'
    default:
      return isDaylight ? 'cloudy-day' : 'cloudy-night'
  }
}

export function WeatherIcon({ conditionCode, isDaylight, size = 48, className }: WeatherIconProps) {
  const iconType = resolveIcon(conditionCode, isDaylight)
  const src = iconMap[iconType]
  const altLabel = conditionCode ? `${conditionCode} weather` : 'Current weather'

  return (
    <img
      src={src}
      alt={altLabel}
      width={size}
      height={size}
      className={cn('shrink-0', className)}
      loading="lazy"
    />
  )
}

