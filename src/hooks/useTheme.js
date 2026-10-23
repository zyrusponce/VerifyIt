import { useContext } from 'react'
import { ThemeContext } from '../context/ThemeContext'

/** The current color theme ('light' or 'dark') and a function to switch it. Must be used inside <ThemeProvider>. */
export default function useTheme() {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('useTheme must be used inside <ThemeProvider>')
  return value
}
