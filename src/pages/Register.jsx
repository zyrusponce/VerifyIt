import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { MailCheck, UserPlus } from 'lucide-react'
import Alert from '../components/Alert'
import AuthShell, { AccountsUnavailable } from '../components/AuthShell'
import Button from '../components/Button'
import TextField from '../components/TextField'
import useAuth from '../hooks/useAuth'
import { normalizeName, safeNextPath, validateDisplayName, validateEmail, validateNewPassword } from '../utils/forms'

export default function Register() {
  const { status, isConfigured, signUp } = useAuth()
  const [searchParams] = useSearchParams()
  const next = safeNextPath(searchParams.get('next'))
  const navigate = useNavigate()
  const [form, setForm] = useState({ displayName: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmationSentTo, setConfirmationSentTo] = useState(null)

  useEffect(() => {
    if (status === 'signedIn') navigate(next, { replace: true })
  }, [status, next, navigate])

  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = {
      displayName: validateDisplayName(form.displayName),
      email: validateEmail(form.email),
      password: validateNewPassword(form.password),
      confirm: form.confirm === form.password ? null : 'The passwords do not match.',
    }
    setErrors(nextErrors)
    setFormError(null)
    if (Object.values(nextErrors).some(Boolean)) return
    setSubmitting(true)
    const result = await signUp({ email: form.email.trim(), password: form.password, displayName: normalizeName(form.displayName) || undefined })
    setSubmitting(false)
    if (!result.ok) {
      setFormError(result.error)
      return
    }
    if (result.needsConfirmation) setConfirmationSentTo(form.email.trim())
  }

  if (confirmationSentTo) {
    return (
      <AuthShell eyebrow="Account" title="Check your email">
        <Alert tone="success" title="Confirm your account">
          We sent a confirmation link to <strong>{confirmationSentTo}</strong>. Open it to finish creating your account, then sign in.
        </Alert>
        <p className="mt-5 flex items-start gap-2 text-sm leading-relaxed text-slate-600">
          <MailCheck className="mt-0.5 size-4 shrink-0 text-cyan-600" aria-hidden="true" />
          Your guest progress stays in this browser. After you sign in, you can save it to your account.
        </p>
        <Button to="/login" className="mt-6 w-full">
          Go to sign in
        </Button>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      eyebrow="Account"
      title="Create your account"
      description="Keep your progress across devices and claim a verified certificate when you finish."
      footer={
        isConfigured && (
          <>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-navy-800 underline underline-offset-2">
              Sign in
            </Link>
          </>
        )
      }
    >
      {!isConfigured ? (
        <AccountsUnavailable />
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {formError && <Alert tone="error">{formError}</Alert>}
          <TextField
            id="register-name"
            label="Name (optional)"
            hint="Printed on your certificate. You can change it later."
            autoComplete="name"
            value={form.displayName}
            onChange={update('displayName')}
            error={errors.displayName}
            disabled={submitting}
            maxLength={80}
          />
          <TextField
            id="register-email"
            label="Email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={update('email')}
            error={errors.email}
            disabled={submitting}
            required
          />
          <TextField
            id="register-password"
            label="Password"
            type="password"
            autoComplete="new-password"
            hint="At least 8 characters, with letters and numbers."
            value={form.password}
            onChange={update('password')}
            error={errors.password}
            disabled={submitting}
            required
          />
          <TextField
            id="register-confirm"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            value={form.confirm}
            onChange={update('confirm')}
            error={errors.confirm}
            disabled={submitting}
            required
          />
          <Button type="submit" size="lg" className="w-full" disabled={submitting} icon={UserPlus} iconPosition="left">
            {submitting ? 'Creating account…' : 'Create account'}
          </Button>
          <p className="text-xs leading-relaxed text-slate-500">
            Passwords are handled by Supabase Auth and are never stored by VerifyIT.
          </p>
        </form>
      )}
    </AuthShell>
  )
}
