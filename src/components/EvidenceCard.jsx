import { useEffect, useRef } from 'react'
import { Calendar, CircleCheck, Eye, FileText, Image, Layers, Link2, Newspaper, Search, TriangleAlert, User, Info } from 'lucide-react'

const AREA_ICONS = {
  link: Link2,
  user: User,
  calendar: Calendar,
  file: FileText,
  layers: Layers,
  eye: Eye,
  image: Image,
  newspaper: Newspaper,
}

const signals = {
  warning: {
    label: 'Red flag',
    icon: TriangleAlert,
    box: 'border-orange-200 bg-orange-50/70',
    text: 'text-orange-800',
  },
  supports: {
    label: 'Supports the claim',
    icon: CircleCheck,
    box: 'border-emerald-200 bg-emerald-50/70',
    text: 'text-emerald-800',
  },
  neutral: {
    label: 'Context',
    icon: Info,
    box: 'border-slate-200 bg-slate-50',
    text: 'text-slate-700',
  },
}

/**
 * One area of an investigation. The finding stays hidden until the user
 * chooses to inspect it, so they practice deciding what to check.
 */
export default function EvidenceCard({ id, label, icon, question, finding, signal = 'neutral', inspected, onInspect, highlight = false }) {
  const AreaIcon = AREA_ICONS[icon] ?? Search
  const tone = signals[signal]
  const SignalIcon = tone.icon
  const findingRef = useRef(null)
  const clickedInspect = useRef(false)

  // The inspect button disappears once clicked, so move keyboard focus to the finding.
  useEffect(() => {
    if (inspected && clickedInspect.current) {
      findingRef.current?.focus()
      clickedInspect.current = false
    }
  }, [inspected])

  function handleInspect() {
    clickedInspect.current = true
    onInspect()
  }

  return (
    <article
      className={`flex flex-col rounded-md border bg-white p-5 transition-colors ${
        highlight ? 'border-amber-300 ring-2 ring-amber-200' : inspected ? 'border-slate-200' : 'border-slate-200 hover:border-navy-300'
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-md ${
            inspected ? 'bg-navy-900 text-cyan-300' : 'bg-navy-50 text-navy-700'
          }`}
        >
          <AreaIcon className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-slate-500">{label}</h3>
          <p className="mt-1 text-sm font-semibold leading-snug text-navy-900">{question}</p>
        </div>
      </div>

      <div className="mt-4 flex-1">
        {inspected ? (
          <div
            id={`finding-${id}`}
            ref={findingRef}
            tabIndex={-1}
            className={`rounded-md border p-3.5 motion-safe:animate-fade-up ${tone.box}`}>
            <p className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${tone.text}`}>
              <SignalIcon className="size-3.5" aria-hidden="true" />
              {tone.label}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{finding}</p>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleInspect}
            aria-label={`Inspect evidence: ${label}`}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-navy-200 bg-navy-50/50 px-4 py-3 text-sm font-semibold text-navy-800 transition-colors hover:border-navy-400 hover:bg-navy-50"
          >
            <Search className="size-4" aria-hidden="true" />
            Inspect evidence
          </button>
        )}
      </div>
    </article>
  )
}
