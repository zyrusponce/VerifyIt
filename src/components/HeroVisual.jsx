import {
  CalendarClock,
  Clock,
  FlaskConical,
  Heart,
  History,
  Megaphone,
  MessageCircle,
  Repeat2,
  ScanSearch,
} from 'lucide-react'
import FloodIllustration from './FloodIllustration'

/** Numbered marker shared by the highlighted phrases and the evidence rows, so each pair reads as linked. */
function ClueMarker({ number, className = '' }) {
  return (
    <span
      className={`inline-grid size-4 shrink-0 place-items-center rounded-full bg-orange-700 font-sans text-[10px] font-bold leading-none text-white tabular-nums ${className}`}
      aria-hidden="true"
    >
      {number}
    </span>
  )
}

function Clue({ number, nowrap = false, children }) {
  return (
    <mark className={`rounded-sm bg-amber-100 px-1 text-navy-950 ring-1 ring-amber-300 [box-decoration-break:clone] ${nowrap ? 'whitespace-nowrap' : ''}`}>
      {children}
      <ClueMarker number={number} className="ml-1 -translate-y-px align-middle" />
      <span className="sr-only"> (clue {number})</span>
    </mark>
  )
}

// Numbers match the highlighted phrases in the post.
const warningSigns = [
  {
    number: 1,
    icon: History,
    title: 'Image history',
    text: 'First appeared online in 2019.',
  },
  {
    number: 2,
    icon: CalendarClock,
    title: 'Account history',
    text: 'Created 3 weeks ago.',
  },
  {
    number: 3,
    icon: Megaphone,
    title: 'Urgent wording',
    text: 'Pressures readers to share now.',
  },
]

/**
 * Illustration for the homepage hero: one card showing a fictional post under investigation,
 * a drawn flood scene, and the warning signs found. The scenario and clues are invented for practice.
 */
export default function HeroVisual() {
  return (
    <figure className="relative mx-auto w-full max-w-md sm:max-w-lg" aria-labelledby="hero-case-caption">
      <article className="relative overflow-hidden rounded-md border border-slate-200 bg-white shadow-[0_1px_2px_rgba(11,31,77,0.06),0_16px_36px_-16px_rgba(11,31,77,0.22)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_16px_36px_-16px_rgba(0,0,0,0.7)] transition duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_1px_2px_rgba(11,31,77,0.06),0_24px_44px_-16px_rgba(11,31,77,0.28)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
        {/* Card header */}
        <header className="flex items-center justify-between gap-3 border-b border-slate-200/80 px-5 py-3 sm:px-6">
          <p className="inline-flex min-w-0 items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-navy-700">
            <span className="size-2 shrink-0 rounded-full bg-cyan-500 ring-4 ring-cyan-100" aria-hidden="true" />
            <span className="truncate">
              Investigation<span className="hidden sm:inline"> preview</span>
            </span>
          </p>
          <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-sm bg-amber-50 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-800 ring-1 ring-inset ring-amber-300">
            <FlaskConical className="size-3.5" aria-hidden="true" />
            Fictional case
          </span>
        </header>

        {/* The post */}
        <div className="px-5 pt-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-navy-800 text-sm font-bold text-white" aria-hidden="true">
              BU
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-navy-900">Brightvale Updates 24/7</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs leading-relaxed text-slate-500">
                <span>@bv_updates247</span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3" aria-hidden="true" />
                  2h ago
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span aria-hidden="true">·</span>
                  <Clue number={2} nowrap>
                    Joined 3 weeks ago
                  </Clue>
                </span>
              </p>
            </div>
          </div>

          <p className="mt-3 text-[15px] leading-relaxed text-slate-800">
            <Clue number={3}>BREAKING:</Clue> Massive flood hits Brightvale Bridge <Clue number={1}>this morning</Clue>!!{' '}
            <Clue number={3}>Share before it gets deleted!!</Clue>
          </p>

          <div className="keep-palette relative mt-3 aspect-[21/9] overflow-hidden rounded-md ring-1 ring-slate-900/10">
            <FloodIllustration className="absolute inset-0 size-full" />
            {/* Slow scan line; not rendered for people who prefer reduced motion. */}
            <span className="pointer-events-none absolute inset-x-0 hidden h-14 bg-gradient-to-b from-transparent via-cyan-300/25 to-transparent motion-safe:block motion-safe:animate-scan" aria-hidden="true">
              <span className="absolute inset-x-0 top-1/2 h-px bg-cyan-200/80" />
            </span>
            <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-sm bg-navy-950/80 px-2 py-1 text-[11px] font-semibold text-cyan-100 backdrop-blur-sm">
              <ScanSearch className="size-3.5" aria-hidden="true" />
              Reverse image search
            </span>
            <span className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-sm bg-white/95 px-2 py-1 text-[11px] font-semibold text-navy-900 shadow-sm">
              <ClueMarker number={1} />
              Earliest match: 2019
            </span>
            <span className="absolute bottom-3 left-3 rounded-sm bg-navy-950/60 px-1.5 py-0.5 text-[10px] font-medium text-white/90">
              Illustration
            </span>
          </div>

          <div className="mt-2.5 flex items-center gap-5 text-xs text-slate-500" aria-hidden="true">
            <span className="inline-flex items-center gap-1.5">
              <Heart className="size-4" /> 8.2K
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MessageCircle className="size-4" /> 940
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Repeat2 className="size-4" /> 3.1K
            </span>
          </div>
        </div>

        {/* Warning signs */}
        <section className="mt-4 border-t border-slate-200/80 bg-paper px-5 py-4 sm:px-6" aria-labelledby="hero-warning-signs">
          <div className="flex items-center justify-between gap-3">
            <p id="hero-warning-signs" className="font-display text-sm font-bold text-navy-900">
              Warning Signs Found
            </p>
            <span className="whitespace-nowrap text-[11px] font-semibold text-slate-500">Illustrative clues</span>
          </div>
          <ol className="mt-2.5 space-y-2">
            {warningSigns.map(({ number, icon: Icon, title, text }) => (
              <li key={title} className="flex items-center gap-2.5 text-[13px] leading-snug">
                <ClueMarker number={number} />
                <Icon className="size-4 shrink-0 text-orange-700" aria-hidden="true" />
                <p className="min-w-0 text-slate-600">
                  <span className="font-semibold text-navy-900">{title}:</span> {text}
                  <span className="sr-only"> (clue {number})</span>
                </p>
              </li>
            ))}
          </ol>
        </section>
      </article>

      <figcaption id="hero-case-caption" className="sr-only">
        A fictional practice case. A post claims a flood hit Brightvale Bridge this morning and urges people to share it.
        Three warning signs are shown: the image first appeared online in 2019, the account was created three weeks ago,
        and the wording pressures readers to share immediately. Status: unverified practice case; these clues are
        illustrative, not verified findings about a real event.
      </figcaption>
    </figure>
  )
}
