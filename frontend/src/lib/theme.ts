import { useEffect, useState } from 'react'

export const THEMES = ['dark', 'light', 'github'] as const
export type Theme = (typeof THEMES)[number]

export const THEME_LABELS: Record<Theme, string> = {
  dark: 'Dark',
  light: 'Light',
  github: 'GitHub',
}

const STORAGE_KEY = 'theme'

function isTheme(value: string | null): value is Theme {
  return value !== null && (THEMES as readonly string[]).includes(value)
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return isTheme(stored) ? stored : 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  return { theme, setTheme: setThemeState }
}
