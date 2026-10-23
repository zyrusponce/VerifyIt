import ProgressBar from './ProgressBar'

/** Small number tile with an optional progress bar underneath. */
export default function StatCard({ icon: Icon, label, value, detail, progress, tone = 'cyan' }) {
  return (
    <div className="rounded-md border border-slate-200/80 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        {Icon && (
          <span className="grid size-9 place-items-center rounded-md bg-navy-50 text-navy-700">
            <Icon className="size-4" aria-hidden="true" />
          </span>
        )}
      </div>
      <p className="mt-3 font-display text-3xl font-extrabold tracking-tight text-navy-900 tabular-nums">{value}</p>
      {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
      {progress && (
        <ProgressBar value={progress.value} max={progress.max} label={progress.label} tone={tone} size="sm" hideLabel className="mt-4" />
      )}
    </div>
  )
}
