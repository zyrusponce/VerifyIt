import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react'

const tones = {
  info: { box: 'border-navy-100 bg-navy-50 text-navy-900', icon: Info, iconColor: 'text-navy-600' },
  success: { box: 'border-emerald-200 bg-emerald-50 text-emerald-900', icon: CircleCheck, iconColor: 'text-emerald-600' },
  warning: { box: 'border-amber-200 bg-amber-50 text-amber-900', icon: TriangleAlert, iconColor: 'text-amber-600' },
  error: { box: 'border-rose-200 bg-rose-50 text-rose-900', icon: CircleAlert, iconColor: 'text-rose-600' },
}

/** Inline message box. Errors are announced immediately (role="alert"), other tones politely. */
export default function Alert({ tone = 'info', title, children, action, className = '' }) {
  const { box, icon: Icon, iconColor } = tones[tone]
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex gap-3 rounded-md border p-4 text-sm leading-relaxed ${box} ${className}`}>
      <Icon className={`mt-0.5 size-4 shrink-0 ${iconColor}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? 'mt-1' : ''}>{children}</div>}
        {action && <div className="mt-3 flex flex-wrap gap-2">{action}</div>}
      </div>
    </div>
  )
}
