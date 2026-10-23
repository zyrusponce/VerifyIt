import { Moon, Sun } from 'lucide-react'
import useTheme from '../hooks/useTheme'

/** Switches between the light and dark color themes. */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
  const Icon = theme === 'dark' ? Sun : Moon

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="grid size-10 place-items-center rounded-md text-slate-500 transition-colors hover:bg-slate-50 hover:text-navy-900"
      aria-label={label}
      title={label}
    >
      <Icon className="size-5" aria-hidden="true" />
    </button>
  )
}
