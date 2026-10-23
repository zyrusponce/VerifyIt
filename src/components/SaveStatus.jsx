import { Link } from 'react-router-dom'
import { CircleAlert, CircleCheck, CloudOff, HardDrive, LoaderCircle } from 'lucide-react'

/**
 * One line telling the user where their progress went. It only says "saved to your account"
 * after the server confirmed it.
 * state: 'saving' | 'account' | 'browser' | 'pending' | 'failed'
 */
export default function SaveStatus({ state, error, onRetry, light = false, className = '' }) {
  if (!state) return null
  const muted = light ? 'text-navy-100' : 'text-slate-600'
  const content = {
    saving: { icon: LoaderCircle, spin: true, tone: muted, text: 'Saving to your account…' },
    account: { icon: CircleCheck, tone: light ? 'text-emerald-300' : 'text-emerald-700', text: 'Saved to your account.' },
    browser: {
      icon: HardDrive,
      tone: muted,
      text: (
        <>
          Saved in this browser only.{' '}
          <Link to="/login" className={`font-semibold underline underline-offset-2 ${light ? 'text-white' : 'text-navy-800'}`}>
            Sign in
          </Link>{' '}
          to keep it across devices.
        </>
      ),
    },
    pending: {
      icon: CloudOff,
      tone: light ? 'text-amber-200' : 'text-amber-800',
      text: "Not saved to your account yet. It is kept on this device and will be sent when the connection returns.",
    },
    failed: {
      icon: CircleAlert,
      tone: light ? 'text-rose-200' : 'text-rose-700',
      text: `Your account did not accept this: ${error?.message ?? 'please try again.'}`,
    },
  }[state]
  if (!content) return null
  const Icon = content.icon

  return (
    <p role={state === 'failed' ? 'alert' : 'status'} className={`flex items-start gap-2 text-sm ${content.tone} ${className}`}>
      <Icon className={`mt-0.5 size-4 shrink-0 ${content.spin ? 'motion-safe:animate-spin' : ''}`} aria-hidden="true" />
      <span>
        {content.text}
        {/* Only queued saves can be retried; a rejected one would be rejected again. */}
        {onRetry && state === 'pending' && (
          <>
            {' '}
            <button type="button" onClick={onRetry} className="font-semibold underline underline-offset-2">
              Retry now
            </button>
          </>
        )}
      </span>
    </p>
  )
}
