import { useState } from 'react'
import { Link } from 'react-router-dom'
import { KeyRound, LoaderCircle } from 'lucide-react'
import Alert from '../components/Alert'
import AuthShell, { AccountsUnavailable } from '../components/AuthShell'
import Button from '../components/Button'
import TextField from '../components/TextField'
import useAuth from '../hooks/useAuth'
import { validateNewPassword } from '../utils/forms'

/** Landing page of the password reset email. Supabase signs the user in from the link first. */
export default function ResetPassword() {
  const { status, isConfigured, isRecovery, updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = { password: validateNewPassword(password), confirm: confirm === password ? null : 'The passwords do not match.' }
    setErrors(nextErrors)
    setFormError(null)
    if (nextErrors.password || nextErrors.confirm) return
    setSubmitting(true)
    const result = await updatePassword(password)
    setSubmitting(false)
    if (!result.ok) setFormError(result.error)
    else setDone(true)
  }

  let content
  if (!isConfigured) content = <AccountsUnavailable />
  else if (status === 'loading') {
    content = (
      <p role="status" className="flex items-center gap-2 text-sm text-slate-600">
        <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden="true" />
        Checking your reset link…
      </p>
    )
  } else if (done) {
    content = (
      <>
        <Alert tone="success" title="Password updated">
          Your new password is ready to use.
        </Alert>
        <Button to="/account" className="mt-6 w-full">
          Go to my account
        </Button>
      </>
    )
  } else if (status !== 'signedIn') {
    content = (
      <Alert tone="warning" title="This link is invalid or has expired">
        Reset links work once and only for a limited time.{' '}
        <Link to="/forgot-password" className="font-semibold underline underline-offset-2">
          Request a new link
        </Link>
        .
      </Alert>
    )
  } else {
    content = (
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {!isRecovery && (
          <p className="text-sm text-slate-600">You are signed in. Choose a new password for your account.</p>
        )}
        {formError && <Alert tone="error">{formError}</Alert>}
        <TextField
          id="reset-password"
          label="New password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters, with letters and numbers."
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
          disabled={submitting}
          required
        />
        <TextField
          id="reset-confirm"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          error={errors.confirm}
          disabled={submitting}
          required
        />
        <Button type="submit" size="lg" className="w-full" disabled={submitting} icon={KeyRound} iconPosition="left">
          {submitting ? 'Saving…' : 'Save new password'}
        </Button>
      </form>
    )
  }

  return (
    <AuthShell eyebrow="Account" title="Choose a new password">
      {content}
    </AuthShell>
  )
}
