import { createContext, useCallback, useEffect, useMemo, useState } from 'react'

export const ThemeContext = createContext(null)

// Keep in sync with public/theme-init.js, which applies the theme before React loads.
const STORAGE_KEY = 'verifyit-theme'
const darkQuery = '(prefers-color-scheme: dark)'

function readStoredTheme() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : null
  } catch {
    // Storage can be blocked (private mode, strict privacy settings); fall back to the system preference.
    return null
  }
}

function systemTheme() {
  return window.matchMedia?.(darkQuery).matches ? 'dark' : 'light'
}

/**
 * Light or dark color theme. Follows the operating system until the visitor picks one with the toggle,
 * then remembers that choice in this browser. The theme is applied as a `dark` class on <html>.
 */
export function ThemeProvider({ children }) {
  const [chosen, setChosen] = useState(readStoredTheme)
  const [system, setSystem] = useState(systemTheme)
  const theme = chosen ?? system

  // Track the operating system setting while the visitor has not picked a theme.
  useEffect(() => {
    const media = window.matchMedia?.(darkQuery)
    if (!media) return undefined
    const handleChange = () => setSystem(media.matches ? 'dark' : 'light')
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setChosen(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Storage is blocked: the choice still applies for this visit, it just is not remembered.
    }
  }, [theme])

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
