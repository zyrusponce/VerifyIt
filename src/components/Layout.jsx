import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import PageBackdrop from './PageBackdrop'
import SyncBanner from './SyncBanner'

/** Scrolls to the top on page change, or to an element when the URL has a #hash. */
function ScrollManager() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1))
      if (target) {
        target.scrollIntoView()
        return
      }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])

  return null
}

export default function Layout() {
  // The home page builds its own per-section depth; every other page shares one moving background.
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-screen flex-col">
      {pathname !== '/' && <PageBackdrop />}
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-navy-900 px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to main content
      </a>
      <ScrollManager />
      <Navbar />
      <SyncBanner />
      <main id="main" className="flex-1 focus:outline-none" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
