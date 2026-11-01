import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation } from 'react-router-dom'
import { Maximize2, Sparkles, X } from 'lucide-react'
import AiAssistantWorkspace from './AiAssistantWorkspace'

// Below Tailwind's sm breakpoint, or on a very short screen (a phone held sideways), the panel is a full-screen sheet.
const SHEET_QUERY = '(width < 40rem), (height < 30rem)'
// Elements with tabindex="-1" (the heading, the hidden file input) can take focus by script but are never Tab stops.
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]',
]
  .map((selector) => `${selector}:not([tabindex="-1"])`)
  .join(', ')

function subscribeToSheetQuery(onChange) {
  const media = window.matchMedia(SHEET_QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

function sheetQueryMatches() {
  return window.matchMedia(SHEET_QUERY).matches
}

function isVisible(element) {
  return element.getClientRects().length > 0 && getComputedStyle(element).visibility === 'visible'
}

// The open/close transition fades and slides; the global reduced-motion rule (index.css) makes it instant.
// `visibility` is transitioned only while hiding (so the element stays visible as it fades out). When showing, it
// switches at once, so the element can take focus in the same tick.
const motion = 'duration-200 ease-out motion-reduce:transition-none'
const sheetLayout = 'inset-0 z-50 h-dvh w-full'
const floatingLayout =
  'right-[calc(1.5rem_+_env(safe-area-inset-right))] bottom-[calc(1.5rem_+_env(safe-area-inset-bottom))] z-30 h-[min(720px,calc(100dvh_-_7rem))] w-[min(440px,calc(100vw_-_3rem))] origin-bottom-right rounded-lg border border-slate-200 shadow-2xl'

/**
 * Floating button in the bottom-right corner that opens the AI Investigation Assistant in a panel (a full-screen
 * sheet on phones). The panel is created on first open and then kept, hidden, so its scroll position survives;
 * the input and results themselves are shared with the /assistant page, where the button is not shown.
 */
export default function AiAssistantLauncher() {
  const location = useLocation()
  const { pathname } = location
  const sheet = useSyncExternalStore(subscribeToSheetQuery, sheetQueryMatches)
  const [open, setOpen] = useState(false)
  const [created, setCreated] = useState(false)
  const [lastKey, setLastKey] = useState(location.key)
  const launcherRef = useRef(null)
  const panelRef = useRef(null)
  const titleRef = useRef(null)
  const returnFocus = useRef(false)
  const panelId = useId()
  const titleId = useId()
  const descriptionId = useId()
  const onAssistantPage = pathname === '/assistant'

  // Any navigation closes the panel, like the mobile menu, including a link that changes only the query string (the
  // panel's Sign in link on /login) or none of the URL (react-router then replaces the entry, with a new key).
  // What the user typed and the analysis are kept.
  if (lastKey !== location.key) {
    setLastKey(location.key)
    setOpen(false)
  }

  function openPanel() {
    setCreated(true)
    setOpen(true)
  }

  const closePanel = useCallback(() => {
    returnFocus.current = true
    setOpen(false)
  }, [])

  // Focus moves into the panel when it opens and back to the button when the user closes it. On larger screens an
  // empty text box gets focus so the user can paste right away; on phones the heading does, so the keyboard stays down.
  useEffect(() => {
    if (open) {
      const textarea = panelRef.current?.querySelector('textarea:not([disabled])')
      const target = !sheetQueryMatches() && textarea && !textarea.value ? textarea : titleRef.current
      target?.focus()
    } else if (returnFocus.current) {
      returnFocus.current = false
      launcherRef.current?.focus()
    }
  }, [open])

  // Escape closes the panel when focus is in it (or nowhere in particular). The phone sheet is modal, so Tab cycles
  // inside it.
  useEffect(() => {
    if (!open) return undefined
    function handleKeyDown(event) {
      const panel = panelRef.current
      if (!panel) return
      const active = document.activeElement
      const focusInPanel = panel.contains(active)
      if (event.key === 'Escape' && !event.defaultPrevented && (focusInPanel || active === document.body || sheetQueryMatches())) {
        event.preventDefault()
        closePanel()
        return
      }
      if (event.key !== 'Tab' || !sheetQueryMatches()) return
      const focusable = [...panel.querySelectorAll(FOCUSABLE)].filter(isVisible)
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && (!focusInPanel || active === first || active === titleRef.current)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (!focusInPanel || active === last)) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, closePanel])

  // While the phone sheet is open, the page behind it can neither scroll nor be reached by keyboard or screen reader.
  useEffect(() => {
    if (!open || !sheet) return undefined
    const root = document.getElementById('root')
    const html = document.documentElement
    const previous = { html: html.style.overflow, body: document.body.style.overflow }
    html.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    if (root) root.inert = true
    return () => {
      html.style.overflow = previous.html
      document.body.style.overflow = previous.body
      if (root) root.inert = false
    }
  }, [open, sheet])

  const panelState = open
    ? 'visible translate-y-0 scale-100 opacity-100 transition-[opacity,translate,scale] starting:translate-y-3 starting:opacity-0'
    : 'pointer-events-none invisible translate-y-3 opacity-0 transition-[opacity,translate,scale,visibility]'

  return (
    <>
      {!onAssistantPage && (
        <>
          {/* Extra space below the footer, so the end of every page can be scrolled clear of the floating button. */}
          <div aria-hidden="true" className="h-[calc(3rem_+_env(safe-area-inset-bottom))] shrink-0 print:hidden" />
          <button
            ref={launcherRef}
            type="button"
            onClick={open ? closePanel : openPanel}
            aria-label="Open AI Investigation Assistant"
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls={created ? panelId : undefined}
            className={`group fixed right-[calc(1.25rem_+_env(safe-area-inset-right))] bottom-[calc(1.25rem_+_env(safe-area-inset-bottom))] z-30 grid size-14 place-items-center rounded-full bg-navy-900 text-white shadow-[0_10px_28px_-8px_rgb(7_20_51/0.55)] ring-1 ring-white/10 duration-200 hover:bg-navy-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 sm:right-[calc(1.5rem_+_env(safe-area-inset-right))] sm:bottom-[calc(1.5rem_+_env(safe-area-inset-bottom))] print:hidden ${
              open
                ? 'invisible scale-90 opacity-0 transition-[background-color,opacity,translate,scale,visibility]'
                : 'transition-[background-color,opacity,translate,scale] motion-safe:hover:-translate-y-0.5'
            }`}
          >
            <Sparkles className="size-6 text-cyan-300" aria-hidden="true" />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 right-full mr-3 hidden -translate-y-1/2 rounded-md bg-navy-900 px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-white opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 sm:block"
            >
              AI Investigation Assistant
            </span>
          </button>
        </>
      )}

      {created &&
        createPortal(
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-modal={sheet ? 'true' : undefined}
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className={`fixed flex flex-col overflow-hidden supports-[overflow:clip]:overflow-clip bg-white print:hidden ${motion} ${sheet ? sheetLayout : floatingLayout} ${panelState}`}
          >
            <div className="flex shrink-0 items-start gap-3 border-b border-slate-200 bg-white px-4 pt-[calc(0.875rem_+_env(safe-area-inset-top))] pb-3.5 sm:px-5 sm:pt-4">
              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-md bg-cyan-50 text-cyan-700" aria-hidden="true">
                <Sparkles className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id={titleId} ref={titleRef} tabIndex={-1} className="text-base leading-snug font-bold focus:outline-none">
                  AI Investigation Assistant
                </h2>
                <p id={descriptionId} className="mt-0.5 text-xs leading-relaxed text-slate-600">
                  A starting point for checking content yourself.
                </p>
                <Link
                  to="/assistant"
                  className="mt-1.5 inline-flex items-center gap-1.5 rounded text-xs font-semibold text-navy-700 underline-offset-2 hover:text-navy-900 hover:underline"
                >
                  <Maximize2 className="size-3.5" aria-hidden="true" />
                  Open full page
                </Link>
              </div>
              <button
                type="button"
                onClick={closePanel}
                aria-label="Close AI Investigation Assistant"
                title="Close"
                className={`grid shrink-0 place-items-center transition-colors hover:bg-slate-100 ${
                  sheet ? 'size-11 rounded-full border border-slate-200 bg-white text-navy-900' : 'size-9 rounded-md text-slate-500 hover:text-navy-900'
                }`}
              >
                <X className={sheet ? 'size-6' : 'size-5'} aria-hidden="true" />
              </button>
            </div>
            {/* `relative` keeps absolutely positioned children (sr-only text) inside the area that scrolls, so they never
                stretch the dialog itself (whose overflow is clipped, so scrollIntoView cannot push the header away). */}
            <div
              data-assistant-scroll
              className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain bg-paper px-4 pt-4 pb-[calc(1.25rem_+_env(safe-area-inset-bottom))] sm:px-5"
            >
              <AiAssistantWorkspace layout="panel" />
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
