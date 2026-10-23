const tones = {
  navy: 'bg-navy-50 text-navy-700 ring-navy-100',
  cyan: 'bg-cyan-50 text-cyan-800 ring-cyan-100',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  orange: 'bg-orange-50 text-orange-800 ring-orange-200',
  green: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  red: 'bg-rose-50 text-rose-800 ring-rose-200',
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
}

export default function Badge({ tone = 'navy', icon: Icon, className = '', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${tones[tone]} ${className}`}
    >
      {Icon && <Icon className="size-3.5 shrink-0" aria-hidden="true" />}
      {children}
    </span>
  )
}

export const difficultyTone = {
  Beginner: 'green',
  Intermediate: 'cyan',
  Advanced: 'orange',
}
