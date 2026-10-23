import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ArrowRight, Award, ChartColumn, LogIn, Menu, UserRound, X } from 'lucide-react'
import Logo from './Logo'
import Button from './Button'
import ThemeToggle from './ThemeToggle'
import useAuth from '../hooks/useAuth'

export const navLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/learn', label: 'Learn' },
  { to: '/lab', label: 'Investigation Lab' },
  { to: '/quiz', label: 'Quiz' },
  { to: '/toolkit', label: 'Verification Toolkit' },
  { to: '/about', label: 'About' },
]

function desktopLinkClass({ isActive }) {
  return `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-navy-50 text-navy-900' : 'text-slate-600 hover:bg-slate-50 hover:text-navy-900'
  }`
}

function mobileLinkClass({ isActive }) {
  return `flex items-center justify-between rounded-md px-4 py-3 text-base font-medium transition-colors ${
    isActive ? 'bg-navy-50 text-navy-900' : 'text-slate-700 hover:bg-slate-50'
  }`
}

function iconLinkClass({ isActive }) {
  return `grid size-10 place-items-center rounded-md transition-colors ${
    isActive ? 'bg-navy-50 text-navy-900' : 'text-slate-500 hover:bg-slate-50 hover:text-navy-900'
  }`
}

/** Initial of the display name (or email) for the account button. */
function initialOf(profile, user) {
  return (profile?.displayName ?? user?.email ?? '?').trim().charAt(0).toUpperCase() || '?'
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const { status, user, profile } = useAuth()
  const signedIn = status === 'signedIn'
  const showSignIn = status === 'signedOut'

  // Close the mobile menu whenever the page changes.
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  // Allow closing the menu with the Escape key.
  useEffect(() => {
    if (!menuOpen) return
    function handleKey(event) {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [menuOpen])

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8" aria-label="Main">
        <Link to="/" className="shrink-0 rounded-md" aria-label="VerifyIT home">
          <Logo />
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <li key={link.to}>
              <NavLink to={link.to} end={link.end} className={desktopLinkClass}>
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 lg:flex">
          <ThemeToggle />
          <NavLink to="/results" className={iconLinkClass} aria-label="My progress" title="My progress">
            <ChartColumn className="size-5" aria-hidden="true" />
          </NavLink>
          <NavLink to="/certificate" className={iconLinkClass} aria-label="Certificate" title="Certificate">
            <Award className="size-5" aria-hidden="true" />
          </NavLink>
          {signedIn && (
            <NavLink
              to="/account"
              className={({ isActive }) =>
                `grid size-10 place-items-center rounded-full text-sm font-bold transition-colors ${
                  isActive ? 'bg-navy-900 text-cyan-300' : 'bg-navy-50 text-navy-800 hover:bg-navy-100'
                }`
              }
              aria-label="My account"
              title={profile?.displayName ?? user?.email ?? 'My account'}
            >
              {initialOf(profile, user)}
            </NavLink>
          )}
          {showSignIn && (
            <Button to="/login" size="sm" variant="secondary" icon={LogIn} iconPosition="left">
              Sign in
            </Button>
          )}
          <Button to="/learn" size="sm" icon={ArrowRight} className="hidden xl:inline-flex">
            Start Learning
          </Button>
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="grid size-10 place-items-center rounded-md text-navy-900 hover:bg-slate-100"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X className="size-6" aria-hidden="true" /> : <Menu className="size-6" aria-hidden="true" />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div id="mobile-menu" className="border-t border-slate-200 bg-white lg:hidden">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
            <ul className="space-y-1">
              {navLinks.map((link) => (
                <li key={link.to}>
                  <NavLink to={link.to} end={link.end} className={mobileLinkClass}>
                    {link.label}
                  </NavLink>
                </li>
              ))}
              <li>
                <NavLink to="/results" className={mobileLinkClass}>
                  <span>My Progress</span>
                  <ChartColumn className="size-5 text-slate-400" aria-hidden="true" />
                </NavLink>
              </li>
              <li>
                <NavLink to="/certificate" className={mobileLinkClass}>
                  <span>Certificate</span>
                  <Award className="size-5 text-slate-400" aria-hidden="true" />
                </NavLink>
              </li>
              {signedIn && (
                <li>
                  <NavLink to="/account" className={mobileLinkClass}>
                    <span>My Account</span>
                    <UserRound className="size-5 text-slate-400" aria-hidden="true" />
                  </NavLink>
                </li>
              )}
              {showSignIn && (
                <li>
                  <NavLink to="/login" className={mobileLinkClass}>
                    <span>Sign in</span>
                    <LogIn className="size-5 text-slate-400" aria-hidden="true" />
                  </NavLink>
                </li>
              )}
            </ul>
            <Button to="/learn" icon={ArrowRight} className="mt-4 w-full">
              Start Learning
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
