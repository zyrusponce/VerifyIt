import { Check, Lightbulb } from 'lucide-react'

/** A single "Before You Share" checklist row with a real, labeled checkbox. */
export default function ChecklistItem({ id, number, title, explanation, tip, checked, onToggle }) {
  const inputId = `check-${id}`

  return (
    <li
      className={`rounded-md border bg-white transition-colors ${
        checked ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 hover:border-navy-300'
      }`}
    >
      <label htmlFor={inputId} className="flex cursor-pointer gap-4 p-5">
        <input id={inputId} type="checkbox" checked={checked} onChange={onToggle} className="peer sr-only" />
        <span
          className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border-2 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cyan-600 ${
            checked ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white text-transparent'
          }`}
          aria-hidden="true"
        >
          <Check className="size-4" strokeWidth={3} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className="text-xs font-bold tabular-nums text-slate-400">{String(number).padStart(2, '0')}</span>
            <span className={`font-semibold ${checked ? 'text-emerald-900' : 'text-navy-900'}`}>{title}</span>
          </span>
          <span className="mt-1.5 block text-sm leading-relaxed text-slate-600">{explanation}</span>
          {tip && (
            <span className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-navy-700">
              <Lightbulb className="mt-px size-3.5 shrink-0 text-amber-500" aria-hidden="true" />
              {tip}
            </span>
          )}
        </span>
      </label>
    </li>
  )
}
