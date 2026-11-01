import { useEffect, useId, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useLocation } from 'react-router-dom'
import {
  Check,
  CircleCheck,
  CircleQuestionMark,
  CircleX,
  ClipboardCheck,
  Copy,
  Download,
  Eraser,
  ExternalLink,
  FileText,
  Globe,
  ImagePlus,
  Info,
  ListChecks,
  LoaderCircle,
  Lock,
  LogIn,
  MessageSquareQuote,
  Newspaper,
  RotateCcw,
  Scale,
  ScanSearch,
  ScanText,
  Search,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  UserPlus,
  X,
} from 'lucide-react'
import Alert from './Alert'
import Badge from './Badge'
import Button from './Button'
import Card from './Card'
import EmptyState from './EmptyState'
import TextField from './TextField'
import useAiAssistant from '../hooks/useAiAssistant'
import useAuth from '../hooks/useAuth'
import {
  AI_CONTENT_MAX_LENGTH,
  AI_CONTENT_MIN_LENGTH,
  AI_MAX_IMAGES,
  AI_SOURCE_URL_MAX_LENGTH,
  assessmentLabel,
  claimTypeLabel,
  verdictConfidenceLabel,
  verdictLabel,
  formatAnalysisReport,
  formatDate,
  formatDateTime,
  isWebLink,
  providerLabel,
  reportFilename,
  reportingSites,
  sourceStanceLabel,
  warningSignLabel,
} from '../utils/aiReport'
import { safeNextPath } from '../utils/forms'
import { formatBytes } from '../utils/imageAttachments'

const NEAR_LIMIT_LENGTH = Math.floor(AI_CONTENT_MAX_LENGTH * 0.9)
const MAX_LENGTH_TEXT = AI_CONTENT_MAX_LENGTH.toLocaleString('en-US')
const SLOW_AFTER_MS = 20000
const AUTH_PAGES = ['/login', '/register', '/forgot-password', '/reset-password']

const sections = [
  { icon: FileText, title: 'Content Summary', text: 'What the content is about and its main message, in simple language.' },
  { icon: ListChecks, title: 'Extracted Claims', text: 'Factual claims separated from opinions, and which ones can be checked.' },
  { icon: TriangleAlert, title: 'Potential Warning Signs', text: 'Possible red flags, quoted from the text, with why they matter.' },
  { icon: ClipboardCheck, title: 'Verification Checklist', text: 'Concrete steps for checking the content yourself.' },
  { icon: Scale, title: 'Final Assessment', text: 'How much checking it still needs. Never a "fake" or "real" verdict.' },
]

// Calm, distinct styles: none of the categories is a verdict, so none of them uses alarm colors.
const assessmentStyles = {
  NEEDS_FURTHER_VERIFICATION: { icon: Search, box: 'bg-cyan-50 ring-cyan-200', text: 'text-cyan-900', iconColor: 'text-cyan-700' },
  POTENTIAL_WARNING_SIGNS_FOUND: { icon: TriangleAlert, box: 'bg-amber-50 ring-amber-200', text: 'text-amber-900', iconColor: 'text-amber-700' },
  INSUFFICIENT_INFORMATION: { icon: CircleQuestionMark, box: 'bg-slate-100 ring-slate-200', text: 'text-navy-900', iconColor: 'text-slate-600' },
}

const verdictStyles = {
  likely_real: { icon: CircleCheck, box: 'bg-emerald-50 ring-emerald-200', text: 'text-emerald-900', iconColor: 'text-emerald-700' },
  likely_fake: { icon: CircleX, box: 'bg-rose-50 ring-rose-200', text: 'text-rose-900', iconColor: 'text-rose-700' },
  mixed: { icon: TriangleAlert, box: 'bg-amber-50 ring-amber-200', text: 'text-amber-900', iconColor: 'text-amber-700' },
  unverified: { icon: CircleQuestionMark, box: 'bg-slate-100 ring-slate-200', text: 'text-navy-900', iconColor: 'text-slate-600' },
}

const fieldLabels = { content: 'Content', sourceUrl: 'Source URL', images: 'Images' }

/**
 * Sign-in and register links that bring the user back to the page they are on (on a sign-in page, to wherever
 * that page was already heading). Slashes stay readable, so the full page keeps /login?next=/assistant.
 */
function useAuthLinks() {
  const { pathname, search, hash } = useLocation()
  const next = AUTH_PAGES.includes(pathname) ? safeNextPath(new URLSearchParams(search).get('next'), '/') : `${pathname}${search}${hash}`
  const query = `?next=${encodeURIComponent(next).replace(/%2F/gi, '/')}`
  return { login: `/login${query}`, register: `/register${query}` }
}

/** Turns an ApiError into a title, message, and the actions that make sense for it. */
function describeError(error, { signedIn = false } = {}) {
  const status = error?.status
  if (status === 400) {
    const details = Array.isArray(error.details)
      ? error.details
          .filter((detail) => typeof detail?.message === 'string')
          .map((detail) => {
            // "images.1.dataUrl" is about the second image.
            const [field, index] = String(detail.field ?? '').split('.')
            const label = field === 'images' && index !== undefined ? `Image ${Number(index) + 1}` : fieldLabels[field]
            return label ? `${label}: ${detail.message}` : detail.message
          })
      : []
    return { title: 'Please check what you entered', message: error.message, details }
  }
  if (status === 401) {
    // api.js throws AUTH_REQUIRED itself, before any request (server errors carry a requestId), when it has no token.
    // While still signed in, that means Supabase could not refresh the token (network error or 5xx) but kept the
    // session, and /login would send the user straight back. auth-js waits about a minute before it tries again.
    // A 401 from the server signs the user out instead, and the sign-in prompt replaces this message.
    if (signedIn && error.code === 'AUTH_REQUIRED' && !error.requestId) {
      return {
        title: 'We could not confirm your sign-in',
        message: 'The sign-in service could not be reached. Check your connection and try again in a minute.',
        retry: true,
      }
    }
    return { title: 'Please sign in again', message: 'Your session has ended. Sign in again to use the AI assistant.', signIn: true }
  }
  if (status === 413) {
    return {
      title: 'This content is too large',
      message: `Shorten the text to ${MAX_LENGTH_TEXT} characters or fewer, or attach fewer or smaller images, then try again.`,
    }
  }
  if (status === 429) {
    return { title: 'Please wait a moment', message: 'Several analyses were requested in a short time. Wait a few minutes, then try again.' }
  }
  if (status === 503 && error.code === 'AI_NOT_CONFIGURED') {
    return { title: 'The AI assistant is not set up yet', message: 'This copy of VerifyIT has no AI service configured. Please try again later.' }
  }
  if (status === 503 && error.code === 'AI_UNAVAILABLE') {
    return {
      title: 'The AI assistant is busy',
      message: 'The AI assistant is busy or unavailable right now. Please try again in a few minutes.',
      retry: true,
    }
  }
  if (error?.code === 'TIMEOUT') {
    return { title: 'The analysis took too long', message: 'The AI service may be busy. Please try again in a few minutes.', retry: true }
  }
  if (status === 404) {
    return { title: 'The AI assistant is not available', message: 'This VerifyIT server does not offer the AI assistant yet. Please try again later.' }
  }
  return {
    title: 'The analysis could not be completed',
    message: error?.message ?? 'Something went wrong. Please try again.',
    retry: Boolean(error?.isRetryable),
  }
}

/** A friendly message for a failed "Get text from link". The server's LINK_* messages are written for students. */
function describeLinkError(error, { signedIn = false } = {}) {
  if (error?.code?.startsWith?.('LINK_')) return error.message
  if (error?.status === 400) return 'Check the link: it must be a full web address that starts with http:// or https://.'
  if (error?.status === 401) {
    return signedIn ? 'Your sign-in could not be confirmed. Check your connection and try again in a minute.' : 'Your session has ended. Sign in again to read links.'
  }
  if (error?.status === 429) return 'Several links were read in a short time. Wait a few minutes, then try again.'
  if (error?.code === 'TIMEOUT') return 'Reading the page took too long. Try again, or copy the text from the page instead.'
  if (error?.status === 404) return 'This VerifyIT server cannot read links yet. Copy the text from the page instead.'
  return error?.message ?? 'The page could not be read. Copy the text from the page instead.'
}

// Failures where the page itself is fine for a person but not for the reader (blocked, no text, too slow, social media):
// a screenshot or the pasted text gets the student further, so those errors offer both.
const COPYABLE_LINK_ERRORS = new Set(['LINK_FETCH_FAILED', 'LINK_NO_TEXT', 'LINK_TIMEOUT', 'LINK_SOCIAL_MEDIA'])
const pageCanBeCopied = (error) => COPYABLE_LINK_ERRORS.has(error?.code)

/** Copies text, falling back to a hidden textarea where the Clipboard API is missing or blocked. */
async function copyText(text) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Permission denied or the document lost focus: try the older method below.
    }
  }
  const previousFocus = document.activeElement
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.top = '0'
  textarea.style.left = '0'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  let copied = false
  try {
    copied = document.execCommand('copy')
  } catch {
    copied = false // execCommand is unsupported here; the caller shows an error.
  }
  textarea.remove()
  previousFocus?.focus?.({ preventScroll: true })
  return copied
}

function downloadText(text, filename) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

/** True when the element is rendered and not hidden (the closed panel stays mounted but invisible). */
function isShown(element) {
  return element.getClientRects().length > 0 && getComputedStyle(element).visibility === 'visible'
}

/** LoaderCircle that spins (unless the user prefers reduced motion), for use as a Button icon. */
function Spinner({ className = '' }) {
  return <LoaderCircle className={`${className} motion-safe:animate-spin`} aria-hidden="true" />
}

function SectionList() {
  return (
    <ul className="space-y-4">
      {sections.map(({ icon: Icon, title, text }) => (
        <li key={title} className="flex gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-md bg-cyan-50 text-cyan-700">
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="font-sans text-sm font-bold text-navy-900">{title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{text}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}

function SignInPrompt({ compact, links }) {
  const { isConfigured, notice } = useAuth()
  const cardPadding = compact ? 'md' : 'lg'
  const titleSize = compact ? 'text-lg' : 'text-xl'
  return (
    <div className={compact ? 'grid gap-5' : 'grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]'}>
      <Card padding={cardPadding} className={compact ? '' : 'lg:self-start'}>
        <span className="grid size-12 place-items-center rounded-md bg-cyan-50 text-cyan-700">
          <Lock className="size-6" aria-hidden="true" />
        </span>
        <h2 className={`mt-4 ${titleSize} font-bold`}>Sign in to use the AI assistant</h2>
        {isConfigured ? (
          <>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              The AI Investigation Assistant is available to signed-in users. Signing in helps keep the shared AI service fair and available
              for everyone.
            </p>
            {notice && (
              <Alert tone="warning" className="mt-5">
                {notice}
              </Alert>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <Button to={links.login} icon={LogIn} iconPosition="left">
                Sign in
              </Button>
              <Button to={links.register} variant="secondary" icon={UserPlus} iconPosition="left">
                Create an account
              </Button>
            </div>
          </>
        ) : (
          <Alert tone="info" className="mt-5">
            The AI assistant needs an account, and accounts are not available on this site yet. You can still use every lesson, quiz, and
            investigation case as a guest.
          </Alert>
        )}
      </Card>
      <Card padding={cardPadding}>
        <h2 className={`${titleSize} font-bold`}>What the assistant gives you</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Paste a suspicious article, headline, or social media post and get a structured starting point for your own investigation.
        </p>
        <div className="mt-6">
          <SectionList />
        </div>
      </Card>
    </div>
  )
}

function LoadingState({ startedAt }) {
  const [slow, setSlow] = useState(() => Date.now() - (startedAt ?? Date.now()) >= SLOW_AFTER_MS)

  // Measured from when the request started, so the message is right after switching between the page and the panel.
  useEffect(() => {
    const remaining = SLOW_AFTER_MS - (Date.now() - (startedAt ?? Date.now()))
    const timer = setTimeout(() => setSlow(true), Math.max(0, remaining))
    return () => clearTimeout(timer)
  }, [startedAt])

  return (
    <div className="space-y-4">
      <div role="status" className="flex items-start gap-3 rounded-md border border-cyan-100 bg-cyan-50/60 p-4 text-sm leading-relaxed">
        <LoaderCircle className="mt-0.5 size-4 shrink-0 text-cyan-700 motion-safe:animate-spin" aria-hidden="true" />
        <div>
          <p className="font-semibold text-navy-900">Analyzing the content…</p>
          <p className="mt-0.5 text-slate-600">
            {slow
              ? 'Still working. When AI services are busy, an analysis can take up to a minute.'
              : 'Reading the text and preparing your analysis. This can take up to a minute.'}
          </p>
        </div>
      </div>
      {/* Placeholder cards in the same order as the results; purely visual. */}
      <div className="space-y-4" aria-hidden="true">
        {sections.map(({ icon: Icon, title }, index) => (
          <Card key={title}>
            <p className="flex items-center gap-2 text-sm font-bold text-slate-400">
              <Icon className="size-4 shrink-0" />
              {title}
            </p>
            <div className="mt-4 space-y-2.5 motion-safe:animate-pulse" style={{ animationDelay: `${index * 150}ms` }}>
              <div className="h-2.5 w-full rounded-full bg-slate-200" />
              <div className="h-2.5 w-11/12 rounded-full bg-slate-200" />
              <div className="h-2.5 w-2/3 rounded-full bg-slate-200" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function ErrorState({ error, onRetry, canRetry, loginPath }) {
  const { status: authStatus } = useAuth()
  const { title, message, details = [], retry, signIn } = describeError(error, { signedIn: authStatus === 'signedIn' })
  let action = null
  if (signIn) {
    action = (
      <Button to={loginPath} size="sm" icon={LogIn} iconPosition="left">
        Sign in again
      </Button>
    )
  } else if (retry) {
    action = (
      <Button size="sm" variant="secondary" onClick={onRetry} disabled={!canRetry} icon={RotateCcw} iconPosition="left">
        Try again
      </Button>
    )
  }

  return (
    <Alert tone="error" title={title} action={action}>
      <p>{message}</p>
      {details.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {details.map((detail, index) => (
            <li key={index}>{detail}</li>
          ))}
        </ul>
      )}
    </Alert>
  )
}

function ResultSection({ icon: Icon, title, compact, children }) {
  const headingId = useId()
  return (
    <Card as="section" padding={compact ? 'sm' : 'md'} aria-labelledby={headingId}>
      <h3 id={headingId} className={`flex items-center gap-2 ${compact ? 'text-base' : 'text-lg'} font-bold`}>
        <Icon className="size-5 shrink-0 text-cyan-600" aria-hidden="true" />
        {title}
      </h3>
      <div className={compact ? 'mt-3' : 'mt-4'}>{children}</div>
    </Card>
  )
}

const stanceStyles = {
  contradicts: { tone: 'amber', icon: TriangleAlert },
  supports: { tone: 'cyan', icon: SearchCheck },
  unrelated: { tone: 'slate', icon: CircleQuestionMark },
}

/** One published fact-check or news report. Its link and rating come from the search, never from the AI. */
function SourceItem({ source, claims, itemPadding }) {
  const isNews = source.kind === 'news'
  // A news report that reports the same claim is neither a warning nor a rating: it is shown neutrally.
  const style = isNews && source.stance === 'supports' ? { tone: 'cyan', icon: Newspaper } : (stanceStyles[source.stance] ?? stanceStyles.unrelated)
  const claim = Number.isInteger(source.claimIndex) ? claims[source.claimIndex] : null
  const dated = formatDate(source.reviewDate)
  const title = source.title || source.claimReviewed || source.site
  return (
    <li className={`rounded-md border border-slate-200 ${itemPadding}`}>
      <div className="flex flex-wrap gap-2">
        <Badge tone={style.tone} icon={style.icon}>
          {sourceStanceLabel(source.stance, source.claimIndex, source.kind)}
        </Badge>
        {source.rating && (
          <Badge tone="slate">
            Rated “{source.rating}” by {source.publisher}
          </Badge>
        )}
        {isNews && <Badge tone="slate">News report</Badge>}
      </div>
      {isWebLink(source.url) ? (
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="mt-2.5 inline-flex items-start gap-1.5 text-sm font-semibold leading-snug text-navy-900 underline decoration-slate-300 underline-offset-2 hover:decoration-navy-700"
        >
          <span>{title}</span>
          <ExternalLink className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      ) : (
        <p className="mt-2.5 text-sm font-semibold leading-snug text-navy-900">{title}</p>
      )}
      <p className="mt-1 text-xs text-slate-500">{[source.publisher, dated && `${isNews ? 'Published' : 'Reviewed'} ${dated}`].filter(Boolean).join(' · ')}</p>
      {source.claimReviewed && (
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          <span className="font-semibold text-slate-700">Claim they checked:</span> “{source.claimReviewed}”
        </p>
      )}
      {claim && (
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          <span className="font-semibold text-slate-700">Matches claim {source.claimIndex + 1}:</span> “{claim}”
        </p>
      )}
      {source.note && <p className="mt-2 text-sm leading-relaxed text-slate-700">{source.note}</p>}
    </li>
  )
}

/**
 * "What Other Sources Say": published fact-checks (rated by the fact-checkers) and news reports for the claims,
 * matched to the claims by the AI.
 */
function SourcesSection({ sources, onRetry, compact, itemPadding }) {
  if (sources.status === 'idle' || sources.status === 'unavailable') return null
  const found = sources.result?.sources ?? []
  const relevant = found.filter((source) => source.stance !== 'unrelated')
  const other = found.filter((source) => source.stance === 'unrelated')
  const claims = sources.result?.claims ?? []
  const searchedNews = sources.result?.searchedNews === true
  const notChecked = sources.result?.notChecked ?? []
  const sites = reportingSites(found)
  return (
    <ResultSection icon={Newspaper} title="What Other Sources Say" compact={compact}>
      {sources.status === 'loading' && (
        <p role="status" className="flex items-center gap-2 text-sm text-slate-600">
          <Spinner className="size-4 text-cyan-700" />
          Searching fact-checks and news reports for these claims…
        </p>
      )}
      {sources.status === 'error' && (
        <Alert
          tone="warning"
          title="Other sources could not be checked"
          action={
            <Button size="sm" variant="secondary" onClick={onRetry} icon={RotateCcw} iconPosition="left">
              Try again
            </Button>
          }
        >
          {sources.error?.message ?? 'Please try again in a few minutes.'}
        </Alert>
      )}
      {sources.status === 'success' && (
        <div className="space-y-4">
          {relevant.length > 0 ? (
            <>
              {sources.result.summary && <p className={`leading-relaxed text-slate-700 ${compact ? 'text-sm' : ''}`}>{sources.result.summary}</p>}
              {sites.length > 0 && (
                <p className={`flex items-start gap-2 rounded-md border border-slate-200 bg-paper ${itemPadding} text-sm leading-relaxed text-slate-700`}>
                  <Info className="mt-0.5 size-4 shrink-0 text-navy-600" aria-hidden="true" />
                  <span>
                    Reported by {sites.length} different website{sites.length === 1 ? '' : 's'}: {sites.join(', ')}. Outlets reporting a story is a useful
                    sign, but it is not proof: they may all be repeating one source, so check who reported it first.
                  </span>
                </p>
              )}
              <ul className="space-y-3">
                {relevant.map((source) => (
                  <SourceItem key={source.id} source={source} claims={claims} itemPadding={itemPadding} />
                ))}
              </ul>
            </>
          ) : (
            <p className={`flex items-start gap-2 rounded-md border border-slate-200 bg-paper ${itemPadding} text-sm leading-relaxed text-slate-700`}>
              <Info className="mt-0.5 size-4 shrink-0 text-navy-600" aria-hidden="true" />
              {searchedNews
                ? 'No fact-checks or news reports were found about these claims. Many claims are never fact-checked and a search can miss recent or local stories, so this does not mean the content is accurate or fake. Use the checklist below to look for other reports yourself.'
                : 'No published fact-checks were found about these claims. Many claims are never fact-checked, so this does not mean the content is accurate. Use the checklist below to look for other reports yourself.'}
            </p>
          )}
          {notChecked.length > 0 && (
            <Alert
              tone="warning"
              title={notChecked.includes('news') ? 'News reports could not be searched' : 'Fact-checks could not be searched'}
              action={
                <Button size="sm" variant="secondary" onClick={onRetry} icon={RotateCcw} iconPosition="left">
                  Try again
                </Button>
              }
            >
              {notChecked.includes('news') ? 'Only fact-checks are shown below.' : 'Only news reports are shown below.'}
            </Alert>
          )}
          {other.length > 0 && (
            <details className={`group rounded-md border border-slate-200 ${itemPadding}`}>
              <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-navy-900 [&::-webkit-details-marker]:hidden">
                <span className="min-w-0">{searchedNews ? 'Other results the search found' : 'Other fact-checks the search found'} ({other.length})</span>
                <span className="ml-auto shrink-0 text-xs font-normal text-slate-500 group-open:hidden">Show</span>
                <span className="ml-auto hidden shrink-0 text-xs font-normal text-slate-500 group-open:inline">Hide</span>
              </summary>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">These do not seem to be about the claims in your content.</p>
              <ul className="mt-3 space-y-3">
                {other.map((source) => (
                  <SourceItem key={source.id} source={source} claims={claims} itemPadding={itemPadding} />
                ))}
              </ul>
            </details>
          )}
          {sources.result.queries?.length > 0 && (
            <p className="text-xs leading-relaxed text-slate-500">Searched for: {sources.result.queries.map((query) => `“${query}”`).join(', ')}</p>
          )}
          <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-500">
            <ShieldCheck className="mt-px size-3.5 shrink-0" aria-hidden="true" />
            Fact-checks come from Google Fact Check Tools. Each rating is the fact-checker&apos;s own, not VerifyIT&apos;s.
            {searchedNews && ' News reports come from a news search and show only what each outlet published.'} Open the links and read the full
            articles yourself.
          </p>
        </div>
      )}
    </ResultSection>
  )
}

/**
 * The initial verdict. It comes from the server's fixed rules over the fact-checks and news reports that were found,
 * never from the AI's opinion, and every reason restates a real result. Shown once the sources have been checked.
 */
function VerdictCard({ sources, compact }) {
  const headingId = useId()
  if (sources.status === 'loading') {
    return (
      <Card as="section" padding={compact ? 'sm' : 'md'} aria-label="Initial verdict">
        <p role="status" className="flex items-center gap-2 text-sm text-slate-600">
          <Spinner className="size-4 text-cyan-700" />
          Checking fact-checks and news reports for an initial verdict…
        </p>
      </Card>
    )
  }
  const verdict = sources.status === 'success' ? sources.result?.verdict : null
  if (!verdict || !verdictStyles[verdict.label]) return null
  const style = verdictStyles[verdict.label]
  const Icon = style.icon
  return (
    <Card as="section" padding={compact ? 'sm' : 'md'} aria-labelledby={headingId}>
      <p id={headingId} className="text-xs font-bold tracking-wide text-slate-500 uppercase">
        Initial verdict
      </p>
      <div className={`mt-2 rounded-md p-4 ring-1 ${style.box}`}>
        <p className={`flex items-center gap-2 ${compact ? 'text-lg' : 'text-xl'} font-bold ${style.text}`}>
          <Icon className={`size-6 shrink-0 ${style.iconColor}`} aria-hidden="true" />
          {verdictLabel(verdict.label)}
        </p>
        <p className={`mt-1 text-sm ${style.text}`}>{verdictConfidenceLabel(verdict.label, verdict.confidence)}</p>
        {verdict.reasons?.length > 0 && (
          <ul className={`mt-3 list-disc space-y-1 pl-5 text-sm leading-relaxed ${style.text}`}>
            {verdict.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        )}
      </div>
      <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-slate-500">
        <Info className="mt-px size-3.5 shrink-0" aria-hidden="true" />
        This is a first guess from what was found online, not a final ruling. It cannot see sources that were not found, and fact-checks and news
        reports can be wrong. Open the links under What Other Sources Say and decide for yourself.
      </p>
    </Card>
  )
}

function AnalysisResults({ result, compact, sources, onRetrySources }) {
  const { analysis, meta, sourceUrl, imageCount = 0 } = result
  const summary = analysis.summary ?? {}
  const claims = Array.isArray(analysis.claims) ? analysis.claims : []
  const warningSigns = Array.isArray(analysis.warningSigns) ? analysis.warningSigns : []
  const checklist = Array.isArray(analysis.checklist) ? analysis.checklist : []
  const assessment = analysis.assessment ?? {}
  const style = assessmentStyles[assessment.category] ?? assessmentStyles.NEEDS_FURTHER_VERIFICATION
  const AssessmentIcon = style.icon
  const generated = formatDateTime(meta?.generatedAt)
  const metaLine = [
    generated && `Generated ${generated}`,
    meta?.model && `${meta.model} via ${providerLabel(meta.provider)}`,
    imageCount > 0 && `${imageCount} ${imageCount === 1 ? 'image' : 'images'} attached`,
  ]
    .filter(Boolean)
    .join(' · ')
  const itemPadding = compact ? 'p-3.5' : 'p-4'

  return (
    <div className={compact ? 'space-y-4' : 'space-y-5'}>
      <VerdictCard sources={sources} compact={compact} />

      <ResultSection icon={FileText} title="Content Summary" compact={compact}>
        <p className={`leading-relaxed text-slate-700 ${compact ? 'text-sm' : ''}`}>{summary.overview}</p>
        {summary.mainMessage && (
          <div className={`mt-4 rounded-md border border-cyan-100 bg-cyan-50/50 ${itemPadding}`}>
            <p className="text-xs font-bold uppercase tracking-wide text-cyan-800">Main message</p>
            <p className="mt-1 text-sm leading-relaxed text-navy-900">{summary.mainMessage}</p>
          </div>
        )}
        {typeof analysis.imageText === 'string' && (
          <details className={`group mt-4 rounded-md border border-slate-200 bg-paper ${itemPadding}`}>
            <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-navy-900 [&::-webkit-details-marker]:hidden">
              <ScanText className="size-4 shrink-0 text-cyan-700" aria-hidden="true" />
              <span className="min-w-0">Text the AI read from your {imageCount === 1 ? 'image' : 'images'}</span>
              <span className="ml-auto shrink-0 text-xs font-normal text-slate-500 group-open:hidden">Show</span>
              <span className="ml-auto hidden shrink-0 text-xs font-normal text-slate-500 group-open:inline">Hide</span>
            </summary>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">AI can misread images. Compare this with your image before relying on it.</p>
            {analysis.imageText ? (
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{analysis.imageText}</p>
            ) : (
              <p className="mt-2 text-sm text-slate-600">No readable text was found in the {imageCount === 1 ? 'image' : 'images'}.</p>
            )}
          </details>
        )}
      </ResultSection>

      <ResultSection icon={ListChecks} title="Extracted Claims" compact={compact}>
        {claims.length > 0 ? (
          <ol className="space-y-3">
            {claims.map((item, index) => (
              <li key={index} className={`rounded-md border border-slate-200 ${itemPadding}`}>
                <p className={`font-semibold leading-snug text-navy-900 ${compact ? 'text-sm' : ''}`}>{item.claim}</p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <Badge tone={item.type === 'fact' ? 'navy' : 'slate'} icon={item.type === 'fact' ? FileText : MessageSquareQuote}>
                    {claimTypeLabel(item.type)}
                  </Badge>
                  {item.verifiable ? (
                    <Badge tone="cyan" icon={SearchCheck}>
                      Verifiable
                    </Badge>
                  ) : (
                    <Badge tone="slate" icon={CircleQuestionMark}>
                      Not independently verifiable
                    </Badge>
                  )}
                </div>
                {item.explanation && <p className="mt-2.5 text-sm leading-relaxed text-slate-600">{item.explanation}</p>}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm leading-relaxed text-slate-600">No specific claims were identified in this content.</p>
        )}
      </ResultSection>

      <ResultSection icon={TriangleAlert} title="Potential Warning Signs" compact={compact}>
        {warningSigns.length > 0 ? (
          <ul className="space-y-3">
            {warningSigns.map((item, index) => (
              <li key={index} className={`rounded-md border border-amber-200 bg-amber-50/60 ${itemPadding}`}>
                <p className="flex items-start gap-2 text-sm font-bold text-amber-900">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden="true" />
                  {warningSignLabel(item.indicator)}
                </p>
                {item.evidence && (
                  <blockquote className="mt-2 border-l-2 border-amber-300 pl-3 text-sm italic leading-relaxed text-slate-700">
                    <span className="sr-only">Quoted from the content: </span>“{item.evidence}”
                  </blockquote>
                )}
                {item.explanation && <p className="mt-2 text-sm leading-relaxed text-slate-700">{item.explanation}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className={`flex items-start gap-2 rounded-md border border-slate-200 bg-paper ${itemPadding} text-sm leading-relaxed text-slate-700`}>
            <Info className="mt-0.5 size-4 shrink-0 text-navy-600" aria-hidden="true" />
            No warning signs were identified. That does not mean the content is accurate or trustworthy, so still work through the
            verification checklist below.
          </p>
        )}
      </ResultSection>

      <SourcesSection sources={sources} onRetry={onRetrySources} compact={compact} itemPadding={itemPadding} />

      <ResultSection icon={ClipboardCheck} title="Verification Checklist" compact={compact}>
        <ol className={compact ? 'space-y-3.5' : 'space-y-4'}>
          {checklist.map((item, index) => (
            <li key={index} className="flex gap-3">
              <span className="keep-palette grid size-6 shrink-0 place-items-center rounded-full bg-navy-900 text-xs font-bold text-white">
                {index + 1}
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-sm font-semibold text-navy-900">{item.step}</p>
                {item.details && <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.details}</p>}
              </div>
            </li>
          ))}
        </ol>
      </ResultSection>

      <ResultSection icon={Scale} title="Final Assessment" compact={compact}>
        <div className={`rounded-md ${compact ? 'p-4' : 'p-5'} ring-1 ring-inset ${style.box}`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Assessment</p>
          <p className={`mt-1 flex items-center gap-2 font-display ${compact ? 'text-lg' : 'text-xl'} font-bold ${style.text}`}>
            <AssessmentIcon className={`${compact ? 'size-5' : 'size-6'} shrink-0 ${style.iconColor}`} aria-hidden="true" />
            {assessmentLabel(assessment.category)}
          </p>
          {assessment.explanation && <p className="mt-3 text-sm leading-relaxed text-slate-700">{assessment.explanation}</p>}
        </div>
        {analysis.disclaimer && (
          <p className={`mt-4 flex items-start gap-2 rounded-md border border-slate-200 bg-paper ${itemPadding} text-xs leading-relaxed text-slate-600`}>
            <ShieldCheck className="mt-px size-4 shrink-0 text-navy-600" aria-hidden="true" />
            {analysis.disclaimer}
          </p>
        )}
      </ResultSection>

      <p className="text-xs leading-relaxed text-slate-500">
        {metaLine}
        {sourceUrl && (
          <span className="mt-1 block break-all">
            Source URL you provided: <span className="text-slate-600">{sourceUrl}</span>
          </span>
        )}
      </p>
    </div>
  )
}

function ResultActions({ result, sources, onClear }) {
  // The report includes the published fact-checks once they have been found.
  const report = () => formatAnalysisReport({ ...result, sources: sources.status === 'success' ? sources.result : null })
  const [copyState, setCopyState] = useState('idle')
  const [downloadFailed, setDownloadFailed] = useState(false)
  const resetTimer = useRef(null)

  useEffect(() => () => clearTimeout(resetTimer.current), [])

  async function handleCopy() {
    setDownloadFailed(false)
    const copied = await copyText(report())
    setCopyState(copied ? 'copied' : 'failed')
    clearTimeout(resetTimer.current)
    if (copied) resetTimer.current = setTimeout(() => setCopyState('idle'), 2500)
  }

  function handleDownload() {
    setCopyState('idle')
    try {
      downloadText(report(), reportFilename(result.meta?.generatedAt))
      setDownloadFailed(false)
    } catch {
      setDownloadFailed(true) // Blob downloads blocked (for example by a strict in-app browser).
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={handleCopy} icon={copyState === 'copied' ? Check : Copy} iconPosition="left">
          {copyState === 'copied' ? 'Copied' : 'Copy Analysis'}
        </Button>
        <Button size="sm" variant="secondary" onClick={handleDownload} icon={Download} iconPosition="left">
          Download Report
        </Button>
        <Button size="sm" variant="ghost" onClick={onClear} icon={X} iconPosition="left">
          Clear Analysis
        </Button>
      </div>
      <p role="status" className="sr-only">
        {copyState === 'copied' ? 'Analysis copied to the clipboard.' : ''}
      </p>
      {copyState === 'failed' && (
        <Alert tone="error">This browser blocked copying. Use Download Report instead, or select the text on the page and copy it.</Alert>
      )}
      {downloadFailed && <Alert tone="error">The report could not be downloaded in this browser. Try Copy Analysis instead.</Alert>}
    </div>
  )
}

function AnalysisWorkspace({ compact, links }) {
  const {
    content,
    sourceUrl,
    urlError,
    truncated,
    images,
    imageStatus,
    preparingImages,
    acceptedImageTypes,
    link,
    analysis,
    sources,
    loading,
    canAnalyze,
    textLength,
    changeContent,
    setTruncated,
    changeSourceUrl,
    checkSourceUrl,
    addImages,
    removeImage,
    fetchLinkText,
    applyLinkText,
    dismissLink,
    runAnalysis,
    retrySources,
    clearInput,
    clearAnalysis,
  } = useAiAssistant()
  const { status: authStatus } = useAuth()
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef(null)
  // The page and the panel can both be mounted (the closed panel stays in the document), so ids must be unique.
  const uid = useId()
  const ids = {
    inputTitle: `${uid}input-title`,
    content: `${uid}content`,
    hint: `${uid}content-hint`,
    count: `${uid}content-count`,
    limit: `${uid}content-limit`,
    sourceUrl: `${uid}source-url`,
    imagesTitle: `${uid}images-title`,
    imagesHint: `${uid}images-hint`,
    resultsTitle: `${uid}results-title`,
  }
  const workspaceRef = useRef(null)
  const textareaRef = useRef(null)
  const resultsRef = useRef(null)
  const previousStatus = useRef(analysis.status)

  // Bring a newly finished analysis (or its error) into view: on the page for the stacked mobile layout, in the
  // panel inside its own scroll area. Skipped when the user moved on to something else while waiting, and by
  // whichever copy of the assistant is not on screen.
  useEffect(() => {
    const changed = previousStatus.current !== analysis.status
    previousStatus.current = analysis.status
    if (!changed || (analysis.status !== 'success' && analysis.status !== 'error')) return
    const results = resultsRef.current
    const active = document.activeElement
    if (!results || !isShown(results) || (active && active !== document.body && !workspaceRef.current?.contains(active))) return
    results.focus({ preventScroll: true })
    const scrollArea = results.closest('[data-assistant-scroll]')
    const view = scrollArea ? scrollArea.getBoundingClientRect() : { top: 0, height: window.innerHeight }
    const top = results.getBoundingClientRect().top - view.top
    if (top < 0 || top > view.height * 0.6) results.scrollIntoView({ block: 'start' })
  }, [analysis.status])

  function handleSubmit(event) {
    event.preventDefault()
    runAnalysis()
  }

  function handlePaste(event) {
    // A pasted screenshot (image only, no text) becomes an attachment.
    const files = [...(event.clipboardData?.files ?? [])].filter((file) => file.type.startsWith('image/'))
    if (files.length && !event.clipboardData.getData('text')) {
      event.preventDefault()
      addImages(files)
      return
    }
    // The browser silently cuts a paste at maxLength; remember it so the user knows text was left out.
    const pasted = (event.clipboardData?.getData('text') ?? '').replace(/\r\n?/g, '\n')
    const { selectionStart, selectionEnd, value } = event.currentTarget
    setTruncated(value.length - (selectionEnd - selectionStart) + pasted.length > AI_CONTENT_MAX_LENGTH)
  }

  function handleClear() {
    // Render first, so the textarea is enabled again (it is disabled while loading) before it takes focus.
    flushSync(clearInput)
    textareaRef.current?.focus()
  }

  const hasFiles = (event) => [...(event.dataTransfer?.types ?? [])].includes('Files')

  function handleDragOver(event) {
    if (!hasFiles(event) || loading) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    setDragging(true)
  }

  function handleDragLeave(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false)
  }

  function handleDrop(event) {
    if (!hasFiles(event)) return
    event.preventDefault()
    setDragging(false)
    addImages(event.dataTransfer.files)
  }

  function handlePickImages(event) {
    addImages(event.target.files)
    // Picking the same file again after removing it must still fire a change.
    event.target.value = ''
  }

  function handleUseLinkText() {
    applyLinkText()
    textareaRef.current?.focus()
  }

  function handleClearAnalysis() {
    clearAnalysis()
    resultsRef.current?.focus({ preventScroll: true })
  }

  const length = content.length
  const atLimit = length >= AI_CONTENT_MAX_LENGTH
  const nearLimit = length >= NEAR_LIMIT_LENGTH
  const countTone = atLimit ? 'font-semibold text-rose-700' : nearLimit ? 'font-semibold text-amber-800' : 'text-slate-500'
  let limitMessage = null
  if (truncated) limitMessage = `Your paste was longer than ${MAX_LENGTH_TEXT} characters, so only the first part was kept. Try pasting the most important part.`
  else if (atLimit) limitMessage = `You have reached the ${MAX_LENGTH_TEXT}-character limit.`
  else if (nearLimit) limitMessage = `${(AI_CONTENT_MAX_LENGTH - length).toLocaleString('en-US')} characters left.`
  // Announced only when the state changes, not on every keystroke.
  const limitAnnouncement = truncated ? 'Pasted text was cut at the character limit.' : atLimit ? 'Character limit reached.' : nearLimit ? 'Approaching the character limit.' : ''
  const describedBy = [ids.hint, ids.count, limitMessage && ids.limit].filter(Boolean).join(' ')

  let readyHint = null
  if (preparingImages) readyHint = 'Preparing your image…'
  else if (!loading && images.length === 0 && textLength === 0) readyHint = 'Paste some content or attach an image to get started.'
  else if (!loading && images.length === 0 && textLength < AI_CONTENT_MIN_LENGTH) readyHint = `Add at least ${AI_CONTENT_MIN_LENGTH} characters, or attach an image, to analyze.`
  const imagesFull = images.length >= AI_MAX_IMAGES
  const linkHost = link.result?.host ?? ''

  return (
    <div ref={workspaceRef} className={compact ? 'grid gap-6' : 'grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]'}>
      <Card as="section" padding={compact ? 'md' : 'lg'} aria-labelledby={ids.inputTitle} className={`min-w-0 wrap-anywhere ${compact ? '' : 'lg:self-start'}`}>
        <h2 id={ids.inputTitle} className={`${compact ? 'text-lg' : 'text-xl'} font-bold`}>
          Content to investigate
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">Paste an article, a headline, or a social media post, or attach a screenshot.</p>

        <form
          onSubmit={handleSubmit}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          noValidate
          className={`mt-5 space-y-5 rounded-md transition-shadow ${dragging ? 'ring-2 ring-cyan-500 ring-offset-4 ring-offset-white' : ''}`}
        >
          <TextField
            id={ids.sourceUrl}
            label={
              <>
                Original source URL <span className="font-normal text-slate-500">(optional)</span>
              </>
            }
            hint="Where you found it, starting with http:// or https://. Select Get text from link to copy the page's text into the box below."
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder="https://"
            maxLength={AI_SOURCE_URL_MAX_LENGTH}
            value={sourceUrl}
            onChange={(event) => changeSourceUrl(event.target.value)}
            onBlur={checkSourceUrl}
            error={urlError}
            disabled={loading}
          />
          <div className="-mt-2 space-y-3">
            <Button
              size="sm"
              variant="secondary"
              onClick={fetchLinkText}
              disabled={loading || link.status === 'loading' || !sourceUrl.trim()}
              icon={link.status === 'loading' ? Spinner : Globe}
              iconPosition="left"
            >
              {link.status === 'loading' ? 'Reading the page…' : 'Get text from link'}
            </Button>
            {link.status === 'confirm' && (
              <Alert
                tone="info"
                title="Replace your text with the page's text?"
                action={
                  <>
                    <Button size="sm" onClick={handleUseLinkText}>
                      Replace text
                    </Button>
                    <Button size="sm" variant="secondary" onClick={dismissLink}>
                      Keep my text
                    </Button>
                  </>
                }
              >
                We read the page at {linkHost}. The box already has text in it.
              </Alert>
            )}
            {link.status === 'loaded' && (
              <Alert tone="success" title={`Text loaded from ${linkHost}`}>
                Check it and delete anything that is not part of the article (menus, ads, related stories), then select Analyze Content.
                {link.result?.truncated && ` The page was long, so only the first ${MAX_LENGTH_TEXT} characters were kept.`}
                {link.result?.via === 'extractor' &&
                  ' This website blocks direct readers, so a page-reading service fetched the text for us. It may include extra lines, so read it carefully.'}
              </Alert>
            )}
            {link.status === 'error' && (
              <Alert
                tone="error"
                title="The page could not be read"
                action={
                  pageCanBeCopied(link.error) && (
                    <>
                      <Button size="sm" variant="secondary" icon={ImagePlus} iconPosition="left" onClick={() => fileInputRef.current?.click()} disabled={loading || imagesFull || preparingImages}>
                        Attach a screenshot
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => textareaRef.current?.focus()} disabled={loading}>
                        Paste the text
                      </Button>
                    </>
                  )
                }
              >
                {describeLinkError(link.error, { signedIn: authStatus === 'signedIn' })}
              </Alert>
            )}
          </div>

          <div>
            <label htmlFor={ids.content} className="block text-sm font-semibold text-navy-900">
              Article, headline, or post
            </label>
            <textarea
              ref={textareaRef}
              id={ids.content}
              rows={compact ? 6 : 10}
              maxLength={AI_CONTENT_MAX_LENGTH}
              value={content}
              onChange={(event) => changeContent(event.target.value)}
              onPaste={handlePaste}
              disabled={loading}
              aria-describedby={describedBy}
              placeholder="Paste the text here…"
              className={`mt-1.5 block ${compact ? 'min-h-32' : 'min-h-40'} w-full resize-y rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500`}
            />
            <div className="mt-1.5 flex flex-wrap items-start justify-between gap-x-4 gap-y-1 text-xs">
              <p id={ids.hint} className="min-w-0 flex-1 text-slate-500">
                Include the headline, author, and date if you have them.
              </p>
              <p id={ids.count} className={`shrink-0 tabular-nums ${countTone}`}>
                {length.toLocaleString('en-US')} / {MAX_LENGTH_TEXT}
                <span className="sr-only"> characters</span>
              </p>
            </div>
            {limitMessage && (
              <p id={ids.limit} className={`mt-1 text-xs font-medium ${atLimit || truncated ? 'text-rose-700' : 'text-amber-800'}`}>
                {limitMessage}
              </p>
            )}
            <p className="sr-only" aria-live="polite">
              {limitAnnouncement}
            </p>
          </div>

          <div role="group" aria-labelledby={ids.imagesTitle} aria-describedby={ids.imagesHint}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p id={ids.imagesTitle} className="text-sm font-semibold text-navy-900">
                Images <span className="font-normal text-slate-500">(optional)</span>
              </p>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || imagesFull || preparingImages}
                icon={preparingImages ? Spinner : ImagePlus}
                iconPosition="left"
              >
                {preparingImages ? 'Preparing…' : 'Attach image'}
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedImageTypes.join(',')}
              multiple
              onChange={handlePickImages}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
            />
            <p id={ids.imagesHint} className="mt-1 text-xs text-slate-500">
              Up to {AI_MAX_IMAGES} screenshots or photos (JPG, PNG, or WebP). You can also paste or drag them here.
            </p>
            {images.length > 0 && (
              <ul className={`mt-3 grid gap-2 ${compact ? 'grid-cols-3' : 'grid-cols-3 sm:grid-cols-4'}`} aria-label="Attached images">
                {images.map((image, index) => (
                  <li key={image.id} className="relative overflow-hidden rounded-md border border-slate-200 bg-paper">
                    <img src={image.dataUrl} alt={`Attached image ${index + 1}: ${image.name}`} className="aspect-square w-full object-cover" />
                    <p className="truncate px-1.5 py-1 text-[11px] text-slate-500" title={image.name}>
                      {formatBytes(image.bytes)}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeImage(image.id)}
                      disabled={loading}
                      className="keep-palette absolute top-1 right-1 grid size-7 place-items-center rounded-full bg-navy-900/80 text-white transition-colors hover:bg-navy-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 disabled:opacity-50"
                      aria-label={`Remove image ${index + 1}: ${image.name}`}
                    >
                      <X className="size-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="sr-only" aria-live="polite">
              {preparingImages ? 'Preparing image.' : images.length ? `${images.length} of ${AI_MAX_IMAGES} images attached.` : ''}
            </p>
            {imageStatus.error && (
              <Alert tone="warning" className="mt-3">
                {imageStatus.error}
              </Alert>
            )}
          </div>

          <div>
            {/* In the narrow panel both buttons stretch to fill their row, whether they fit side by side or wrap. */}
            <div className={compact ? 'flex flex-wrap gap-3' : 'flex flex-col gap-3 sm:flex-row sm:flex-wrap'}>
              <Button
                type="submit"
                size={compact ? 'md' : 'lg'}
                disabled={!canAnalyze}
                icon={loading ? Spinner : Sparkles}
                iconPosition="left"
                className={compact ? 'grow' : ''}
              >
                {loading ? 'Analyzing…' : 'Analyze Content'}
              </Button>
              <Button
                size={compact ? 'md' : 'lg'}
                className={compact ? 'grow' : ''}
                variant="secondary"
                onClick={handleClear}
                disabled={!content && !sourceUrl && images.length === 0 && !imageStatus.error && !loading && analysis.status !== 'error'}
                icon={Eraser}
                iconPosition="left"
              >
                Clear
              </Button>
            </div>
            {readyHint && <p className="mt-2 text-xs text-slate-500">{readyHint}</p>}
          </div>
        </form>

        <div className="mt-6 space-y-2 border-t border-slate-200 pt-5 text-xs leading-relaxed text-slate-500">
          <p className="flex items-start gap-2">
            <Lock className="mt-px size-3.5 shrink-0" aria-hidden="true" />
            VerifyIT does not save the text or images you submit. They are sent to an AI service only to create this analysis, so leave out
            personal or private information.
          </p>
          <p className="flex items-start gap-2">
            <Info className="mt-px size-3.5 shrink-0" aria-hidden="true" />
            AI can make mistakes. Treat the analysis and the initial verdict as a first guess, not a final ruling, and verify the content yourself.
          </p>
        </div>
      </Card>

      <section
        ref={resultsRef}
        tabIndex={-1}
        aria-labelledby={ids.resultsTitle}
        className={`min-w-0 ${compact ? 'scroll-mt-4 space-y-4' : 'scroll-mt-24 space-y-5'} wrap-anywhere focus:outline-none`}
      >
        <h2 id={ids.resultsTitle} className={`${compact ? 'text-lg' : 'text-2xl'} font-bold`}>
          AI analysis
        </h2>
        {analysis.status === 'success' && <ResultActions result={analysis.result} sources={sources} onClear={handleClearAnalysis} />}

        {analysis.status === 'idle' && (
          <EmptyState
            icon={ScanSearch}
            title="Your analysis will appear here"
            description="Paste a suspicious article, headline, or post (or attach a screenshot), then select Analyze Content. You will get a summary, the claims it makes, possible warning signs, and a checklist for verifying it yourself."
            compact={compact}
          />
        )}
        {loading && <LoadingState startedAt={analysis.startedAt} />}
        {analysis.status === 'error' && <ErrorState error={analysis.error} onRetry={runAnalysis} canRetry={canAnalyze} loginPath={links.login} />}
        {analysis.status === 'success' && <AnalysisResults result={analysis.result} compact={compact} sources={sources} onRetrySources={retrySources} />}
      </section>
    </div>
  )
}

/**
 * The AI Investigation Assistant: sign-in prompt, input form, and results with Copy / Download / Clear.
 * `layout="page"` is the two-column /assistant page; `layout="panel"` is one compact column for the floating panel.
 * Both read the same shared state (see AiAssistantContext), so they always show the same work.
 */
export default function AiAssistantWorkspace({ layout = 'page' }) {
  const { status } = useAuth()
  const links = useAuthLinks()
  const compact = layout === 'panel'

  if (status === 'loading') {
    return (
      <p role="status" className="flex items-center gap-2 text-slate-600">
        <LoaderCircle className="size-5 motion-safe:animate-spin" aria-hidden="true" />
        Loading…
      </p>
    )
  }
  if (status !== 'signedIn') return <SignInPrompt compact={compact} links={links} />
  return <AnalysisWorkspace compact={compact} links={links} />
}
