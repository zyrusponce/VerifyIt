const tones = {
  navy: 'bg-navy-800',
  cyan: 'bg-cyan-500',
  amber: 'bg-amber-500',
  green: 'bg-emerald-500',
}

const heights = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-3',
}

/**
 * Accessible progress bar.
 * <ProgressBar value={3} max={9} label="Checklist progress" showValue />
 */
export default function ProgressBar({
  value,
  max = 100,
  label,
  hideLabel = false,
  showValue = false,
  valueText,
  tone = 'cyan',
  size = 'md',
  className = '',
}) {
  const percent = max > 0 ? Math.min(100, Math.max(0, Math.round((value / max) * 100))) : 0

  return (
    <div className={className}>
      {!hideLabel && (label || showValue) && (
        <div className="mb-2 flex items-center justify-between gap-3 text-sm">
          {label && <span className="font-medium text-navy-900">{label}</span>}
          {showValue && <span className="tabular-nums text-slate-500">{valueText ?? `${percent}%`}</span>}
        </div>
      )}
      <div
        className={`w-full overflow-hidden rounded-full bg-slate-100 ${heights[size]}`}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={valueText ?? `${percent}%`}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ease-out ${tones[tone]}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
