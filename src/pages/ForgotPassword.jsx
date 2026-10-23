import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import Alert from '../components/Alert'
import AuthShell, { AccountsUnavailable } from '../components/AuthShell'
import Button from '../components/Button'
import TextField from '../components/TextField'
import useAuth from '../hooks/useAuth'
import { validateEmail } from '../utils/forms'

export default function ForgotPassword() {
  const { isConfigured, requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const emailError = validateEmail(email)
    setError(emailError)
    setFormError(null)
    if (emailError) return
    setSubmitting(true)
    const result = await requestPasswordReset(email.trim())
    setSubmitting(false)
    if (!result.ok) setFormError(result.error)
    else setSent(true)
  }

  return (
    <AuthShell
      eyebrow="Account"
      title="Reset your password"
      description="Enter the email you signed up with and we will send you a link to choose a new password."
      footer={
        <Link to="/login" className="font-semibold text-navy-800 underline underline-offset-2">
          Back to sign in
        </Link>
      }
    >
      {!isConfigured ? (
        <AccountsUnavailable />
      ) : sent ? (
        // The same message is shown whether or not an account exists, so emails cannot be probed.
        <Alert tone="success" title="Check your email">
          If an account exists for <strong>{email.trim()}</strong>, a password reset link is on its way. The link expires after a while, so use it soon.
        </Alert>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {formError && <Alert tone="error">{formError}</Alert>}
          <TextField
            id="forgot-email"
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={error}
            disabled={submitting}
            required
          />
          <Button type="submit" size="lg" className="w-full" disabled={submitting} icon={Mail} iconPosition="left">
            {submitting ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
