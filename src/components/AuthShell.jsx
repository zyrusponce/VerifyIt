import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import Alert from './Alert'

/** Centered card used by the sign-in, registration, and password pages. */
export default function AuthShell({ eyebrow, title, description, children, footer }) {
  return (
    <section>
      <div className="mx-auto max-w-md px-4 py-14 sm:py-20">
        <div className="rounded-lg border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
          {eyebrow && (
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
              <ShieldCheck className="size-4" aria-hidden="true" />
              {eyebrow}
            </p>
          )}
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{title}</h1>
          {description && <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-6 text-center text-sm text-slate-600">{footer}</div>}
      </div>
    </section>
  )
}

/** Shown when this copy of the site has no Supabase settings: everything still works in guest mode. */
export function AccountsUnavailable() {
  return (
    <Alert tone="info" title="Accounts are not available on this site yet">
      You can keep using every lesson, quiz, and investigation as a guest. Your progress is saved in this browser.{' '}
      <Link to="/" className="font-semibold underline underline-offset-2">
        Back to home
      </Link>
    </Alert>
  )
}
