'use client'

import { useWeather, type WeatherResponse } from './use-weather'

const precipitationConditions = [
  'drizzle',
  'heavyRain',
  'isolatedThunderstorms',
  'rain',
  'sunShowers',
  'scatteredThunderstorms',
  'strongStorms',
  'thunderstorms',
]

const winterConditions = ['flurries', 'sleet', 'snow', 'sunFlurries', 'wintryMix']

const hazardConditions = ['blizzard', 'blowingSnow', 'freezingDrizzle', 'freezingRain', 'heavySnow']

const conditionDescriptions: Record<string, string> = {
  drizzle: 'Light Drizzle',
  heavyRain: 'Heavy Rain',
  isolatedThunderstorms: 'Isolated Thunderstorms',
  rain: 'Rain',
  sunShowers: 'Sun Showers',
  scatteredThunderstorms: 'Scattered Thunderstorms',
  strongStorms: 'Strong Storms',
  thunderstorms: 'Thunderstorms',
  blowingDust: 'Blowing Dust',
  clear: 'Clear',
  cloudy: 'Cloudy',
  foggy: 'Foggy',
  haze: 'Hazy',
  mostlyClear: 'Mostly Clear',
  mostlyCloudy: 'Mostly Cloudy',
  partlyCloudy: 'Partly Cloudy',
  smoky: 'Smoky',
  flurries: 'Snow Flurries',
  sleet: 'Sleet',
  snow: 'Snow',
  sunFlurries: 'Sunny with Flurries',
  wintryMix: 'Wintry Mix',
  blizzard: 'Blizzard',
  blowingSnow: 'Blowing Snow',
  freezingDrizzle: 'Freezing Drizzle',
  freezingRain: 'Freezing Rain',
  heavySnow: 'Heavy Snow',
}

export function useCondition(weatherOverride?: WeatherResponse | null) {
  const { data } = useWeather()
  const weatherData = weatherOverride ?? data
  const conditionCode = weatherData?.currentWeather.conditionCode ?? ''

  const isRaining = precipitationConditions.includes(conditionCode)
  const isSnowing = winterConditions.includes(conditionCode)
  const isHazard = hazardConditions.includes(conditionCode)
  const isClear = ['clear', 'mostlyClear'].includes(conditionCode)
  const isDaylight = weatherData?.currentWeather.daylight ?? true

  const currentCondition =
    conditionDescriptions[conditionCode] ||
    (conditionCode && conditionCode.replace(/([A-Z])/g, ' $1').trim()) ||
    'Unknown Condition'

  return {
    currentCondition,
    isRaining,
    isSnowing,
    isHazard,
    isClear,
    isDaylight,
  }
}

