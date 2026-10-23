import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import Alert from '../components/Alert'
import AuthShell, { AccountsUnavailable } from '../components/AuthShell'
import Button from '../components/Button'
import TextField from '../components/TextField'
import useAuth from '../hooks/useAuth'
import { safeNextPath, validateEmail } from '../utils/forms'

export default function Login() {
  const { status, isConfigured, signIn, notice, clearNotice } = useAuth()
  const [searchParams] = useSearchParams()
  const next = safeNextPath(searchParams.get('next'))
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (status === 'signedIn') navigate(next, { replace: true })
  }, [status, next, navigate])

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = { email: validateEmail(email), password: password ? null : 'Enter your password.' }
    setErrors(nextErrors)
    setFormError(null)
    if (nextErrors.email || nextErrors.password) return
    setSubmitting(true)
    const result = await signIn({ email: email.trim(), password })
    setSubmitting(false)
    if (!result.ok) setFormError(result.error)
  }

  return (
    <AuthShell
      eyebrow="Account"
      title="Sign in"
      description="Save your progress to your account, see it on any device, and claim your certificate."
      footer={
        isConfigured && (
          <>
            New to VerifyIT?{' '}
            <Link to={`/register${next !== '/account' ? `?next=${encodeURIComponent(next)}` : ''}`} className="font-semibold text-navy-800 underline underline-offset-2">
              Create an account
            </Link>
          </>
        )
      }
    >
      {!isConfigured ? (
        <AccountsUnavailable />
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {notice && (
            <Alert tone="warning" action={<Button size="sm" variant="ghost" onClick={clearNotice}>Dismiss</Button>}>
              {notice}
            </Alert>
          )}
          {formError && <Alert tone="error">{formError}</Alert>}
          <TextField
            id="login-email"
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={errors.email}
            disabled={submitting}
            required
          />
          <TextField
            id="login-password"
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={errors.password}
            disabled={submitting}
            required
          />
          <div className="flex items-center justify-between gap-3">
            <Link to="/forgot-password" className="text-sm font-semibold text-navy-700 underline-offset-2 hover:underline">
              Forgot your password?
            </Link>
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={submitting || status === 'loading'} icon={LogIn} iconPosition="left">
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
          <p className="text-xs leading-relaxed text-slate-500">
            You can also keep learning without an account. Guest progress stays in this browser.
          </p>
        </form>
      )}
    </AuthShell>
  )
}
