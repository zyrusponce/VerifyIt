import { FlaskConical } from 'lucide-react'

/** Clearly labels invented scenarios so they are never mistaken for real events. */
export default function FictionalNotice({ className = '', children = 'Fictional training example' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-200 ${className}`}
    >
      <FlaskConical className="size-3.5" aria-hidden="true" />
      {children}
    </span>
  )
}
