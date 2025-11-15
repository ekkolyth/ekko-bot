"use client"

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { authClient } from '@/lib/auth/client'

export type ThemeMode = 'light' | 'dark'

export type AccentColorOption = {
  id: string
  label: string
  value: string
  foreground: string
}

const ACCENT_COLORS: AccentColorOption[] = [
  { id: 'rose', label: 'Rose', value: '#ff5c7a', foreground: '#14020a' },
  { id: 'crimson', label: 'Crimson', value: '#ff7043', foreground: '#180601' },
  { id: 'sun', label: 'Sun', value: '#f5c24f', foreground: '#1a1000' },
  { id: 'mint', label: 'Mint', value: '#4ade80', foreground: '#011406' },
  { id: 'teal', label: 'Teal', value: '#2dd4bf', foreground: '#01110e' },
  { id: 'cobalt', label: 'Cobalt', value: '#5487ff', foreground: '#f8fbff' },
  { id: 'violet', label: 'Violet', value: '#7c5dff', foreground: '#fdfaff' },
  { id: 'magenta', label: 'Magenta', value: '#d946ef', foreground: '#fff5ff' },
]

const DEFAULT_COLOR_ID = 'violet'
const DEFAULT_MODE: ThemeMode = 'dark'
const STORAGE_KEY = 'appearance-prefs'

type AppearanceContextValue = {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  accentId: string
  setAccentId: (id: string) => void
  accent: AccentColorOption
  colors: AccentColorOption[]
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null)

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark'
}

function getAccentById(id: string): AccentColorOption {
  return ACCENT_COLORS.find((color) => color.id === id) ?? ACCENT_COLORS.find((color) => color.id === DEFAULT_COLOR_ID)!;
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const { data: session } = authClient.useSession()
  const storageKey = session?.user?.id ? `${STORAGE_KEY}:${session.user.id}` : STORAGE_KEY
  const [accentId, setAccentId] = useState(DEFAULT_COLOR_ID)
  const [mode, setMode] = useState<ThemeMode>(DEFAULT_MODE)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem(storageKey)

    if (!stored) {
      setAccentId(DEFAULT_COLOR_ID)
      setMode(DEFAULT_MODE)
      return
    }

    try {
      const parsed = JSON.parse(stored) as Partial<{ accentId: string; mode: ThemeMode }>

      if (parsed.accentId && ACCENT_COLORS.some((color) => color.id === parsed.accentId)) {
        setAccentId(parsed.accentId)
      } else {
        setAccentId(DEFAULT_COLOR_ID)
      }

      if (isThemeMode(parsed.mode)) {
        setMode(parsed.mode)
      } else {
        setMode(DEFAULT_MODE)
      }
    } catch {
      setAccentId(DEFAULT_COLOR_ID)
      setMode(DEFAULT_MODE)
    }
  }, [storageKey])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(storageKey, JSON.stringify({ accentId, mode }))
  }, [accentId, mode, storageKey])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const accent = getAccentById(accentId)
    const body = document.body
    const root = document.documentElement

    if (!body || !root) return

    const applyAccent = (element: HTMLElement) => {
      element.style.setProperty('--primary', accent.value)
      element.style.setProperty('--primary-foreground', accent.foreground)
      element.style.setProperty('--sidebar-primary', accent.value)
      element.style.setProperty('--sidebar-primary-foreground', accent.foreground)
      element.style.setProperty('--ring', accent.value)
      element.style.setProperty('--sidebar-ring', accent.value)
    }

    applyAccent(root)
    applyAccent(body)

    if (mode === 'dark') {
      body.classList.add('dark')
    } else {
      body.classList.remove('dark')
    }
  }, [accentId, mode])

  const accent = useMemo(() => getAccentById(accentId), [accentId])

  const value = useMemo<AppearanceContextValue>(
    () => ({
      mode,
      setMode,
      accentId,
      setAccentId,
      accent,
      colors: ACCENT_COLORS,
    }),
    [accent, accentId, mode],
  )

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>
}

export function useAppearance() {
  const context = useContext(AppearanceContext)
  if (!context) {
    throw new Error('useAppearance must be used within an AppearanceProvider')
  }
  return context
}

export const appearancePalette = ACCENT_COLORS

