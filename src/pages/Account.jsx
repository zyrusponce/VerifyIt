import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Award, ChartColumn, CloudUpload, HardDrive, LoaderCircle, LogOut, RefreshCw, Save, Trash2, UserRound } from 'lucide-react'
import Alert from '../components/Alert'
import AuthShell, { AccountsUnavailable } from '../components/AuthShell'
import Button from '../components/Button'
import Card from '../components/Card'
import PageHeader from '../components/PageHeader'
import TextField from '../components/TextField'
import useAuth from '../hooks/useAuth'
import useProgress from '../hooks/useProgress'
import { normalizeName, validateDisplayName } from '../utils/forms'

function ProfileCard() {
  const { user, profile, profileStatus, profileError, reloadProfile, updateDisplayName } = useAuth()
  const [name, setName] = useState('')
  const [error, setError] = useState(null)
  const [save, setSave] = useState({ state: 'idle', message: null })

  useEffect(() => {
    setName(profile?.displayName ?? '')
  }, [profile?.displayName])

  async function handleSubmit(event) {
    event.preventDefault()
    const nameError = validateDisplayName(name, { required: true })
    setError(nameError)
    if (nameError) return
    setSave({ state: 'saving', message: null })
    const result = await updateDisplayName(normalizeName(name))
    setSave(result.ok ? { state: 'saved', message: 'Your name was saved.' } : { state: 'error', message: result.error })
  }

  return (
    <Card padding="lg" className="lg:self-start">
      <h2 className="flex items-center gap-2 text-xl font-bold">
        <UserRound className="size-5 text-cyan-600" aria-hidden="true" />
        Profile
      </h2>
      <dl className="mt-5">
        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</dt>
        <dd className="mt-1 break-all text-sm font-medium text-navy-900">{user?.email}</dd>
      </dl>
      {profileStatus === 'loading' && (
        <p role="status" className="mt-5 flex items-center gap-2 text-sm text-slate-600">
          <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden="true" />
          Loading your profile…
        </p>
      )}
      {profileStatus === 'error' && (
        <Alert tone="error" className="mt-5" action={<Button size="sm" variant="secondary" onClick={reloadProfile}>Try again</Button>}>
          {profileError?.message ?? 'Your profile could not be loaded.'}
        </Alert>
      )}
      {profileStatus === 'ready' && (
        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
          <TextField
            id="account-name"
            label="Display name"
            hint="Used on your certificate."
            autoComplete="name"
            value={name}
            maxLength={80}
            onChange={(event) => {
              setName(event.target.value)
              setSave({ state: 'idle', message: null })
            }}
            error={error}
            disabled={save.state === 'saving'}
          />
          {save.state === 'saved' && <Alert tone="success">{save.message}</Alert>}
          {save.state === 'error' && <Alert tone="error">{save.message}</Alert>}
          <Button type="submit" disabled={save.state === 'saving' || normalizeName(name) === (profile?.displayName ?? '')} icon={Save} iconPosition="left">
            {save.state === 'saving' ? 'Saving…' : 'Save name'}
          </Button>
        </form>
      )}
    </Card>
  )
}

function DeviceDataCard() {
  const { guest, outbox } = useProgress()
  const [confirmClear, setConfirmClear] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const { pending, importState } = guest

  return (
    <Card padding="lg">
      <h2 className="flex items-center gap-2 text-xl font-bold">
        <HardDrive className="size-5 text-cyan-600" aria-hidden="true" />
        Progress on this device
      </h2>

      <div className="mt-5 space-y-4 text-sm text-slate-600">
        {pending.total > 0 ? (
          <Alert
            tone="info"
            title="Guest progress not in your account yet"
            action={
              <Button size="sm" onClick={guest.importToAccount} disabled={importState.state === 'importing'} icon={CloudUpload} iconPosition="left">
                {importState.state === 'importing' ? 'Saving…' : 'Save to my account'}
              </Button>
            }
          >
            {pending.lessons.length} lesson(s), {pending.cases.length} investigation case(s), {pending.quizzes.length} quiz attempt(s)
            {pending.toolkit.length ? ', and checklist items' : ''}. The server re-checks everything before saving it.
          </Alert>
        ) : (
          <p>All guest progress from this browser is in your account.</p>
        )}
        {importState.state === 'error' && <Alert tone="error">{importState.error?.message} Nothing was lost; try again when you are online.</Alert>}
        {importState.state === 'done' && <Alert tone="success">Guest progress saved to your account.</Alert>}
        {pending.legacyQuizScores > 0 && (
          <p>
            {pending.legacyQuizScores} older guest quiz score(s) were saved before answers were kept, so the server cannot re-score them. They stay in
            this browser&apos;s guest progress.
          </p>
        )}

        {outbox.pending.length > 0 && (
          <Alert
            tone="warning"
            title={`${outbox.pending.length} change(s) waiting to be sent`}
            action={
              <Button
                size="sm"
                variant="secondary"
                disabled={retrying}
                icon={RefreshCw}
                iconPosition="left"
                onClick={async () => {
                  setRetrying(true)
                  try {
                    await outbox.retry()
                  } finally {
                    setRetrying(false)
                  }
                }}
              >
                {retrying ? 'Retrying…' : 'Retry now'}
              </Button>
            }
          >
            They are kept on this device until your account confirms them.
          </Alert>
        )}

        {guest.hasData && (
          <div className="border-t border-slate-100 pt-4">
            <p>Guest progress stays in this browser until you clear it. Clear it on shared computers once it is saved to your account.</p>
            {confirmClear ? (
              <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Confirm clearing guest data">
                <Button
                  size="sm"
                  variant="danger"
                  icon={Trash2}
                  iconPosition="left"
                  onClick={() => {
                    guest.reset()
                    setConfirmClear(false)
                  }}
                >
                  Yes, clear guest data
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setConfirmClear(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="secondary" className="mt-3" icon={Trash2} iconPosition="left" onClick={() => setConfirmClear(true)}>
                Clear guest data from this browser
              </Button>
            )}
            {confirmClear && pending.total > 0 && (
              <p className="mt-2 text-xs font-medium text-amber-800">Some guest progress is not saved to your account yet and will be lost.</p>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

export default function Account() {
  const { status, isConfigured, signOut } = useAuth()
  const { summary, outbox } = useProgress()
  const [signOutState, setSignOutState] = useState({ state: 'idle', error: null })

  if (!isConfigured) {
    return (
      <AuthShell eyebrow="Account" title="Your account">
        <AccountsUnavailable />
      </AuthShell>
    )
  }
  if (status === 'loading') {
    return (
      <p role="status" className="mx-auto flex max-w-md items-center justify-center gap-2 px-4 py-24 text-slate-600">
        <LoaderCircle className="size-5 motion-safe:animate-spin" aria-hidden="true" />
        Loading your account…
      </p>
    )
  }
  if (status !== 'signedIn') return <Navigate to="/login?next=/account" replace />

  async function handleSignOut() {
    setSignOutState({ state: 'working', error: null })
    const result = await signOut()
    if (!result.ok) setSignOutState({ state: 'error', error: result.error })
  }

  return (
    <>
      <PageHeader watermark="Account" eyebrow="Account" icon={UserRound} title="Your account" description="Manage your name, saved progress, and certificate." />
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:px-8">
        <ProfileCard />
        <div className="space-y-6">
          <Card padding="lg">
            <h2 className="text-xl font-bold">Saved to your account</h2>
            <dl className="mt-5 grid grid-cols-2 gap-4">
              <div className="rounded-md bg-paper p-4">
                <dt className="text-xs font-medium text-slate-500">Lessons completed</dt>
                <dd className="mt-1 font-display text-2xl font-bold text-navy-900">
                  {summary.completedLessonIds.length}/{summary.lessonCount}
                </dd>
              </div>
              <div className="rounded-md bg-paper p-4">
                <dt className="text-xs font-medium text-slate-500">Cases completed</dt>
                <dd className="mt-1 font-display text-2xl font-bold text-navy-900">
                  {summary.completedCaseIds.length}/{summary.caseCount}
                </dd>
              </div>
            </dl>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button to="/results" variant="secondary" icon={ChartColumn} iconPosition="left">
                My progress
              </Button>
              <Button to="/certificate" variant="secondary" icon={Award} iconPosition="left">
                Certificate
              </Button>
            </div>
          </Card>
          <DeviceDataCard />
          <Card padding="lg">
            <h2 className="text-xl font-bold">Sign out</h2>
            {outbox.pending.length > 0 && (
              <p className="mt-2 text-sm text-amber-800">
                {outbox.pending.length} unsent change(s) stay on this device and are sent the next time you sign in here.
              </p>
            )}
            {signOutState.state === 'error' && (
              <Alert tone="error" className="mt-3">
                {signOutState.error}
              </Alert>
            )}
            <Button variant="secondary" className="mt-4" onClick={handleSignOut} disabled={signOutState.state === 'working'} icon={LogOut} iconPosition="left">
              {signOutState.state === 'working' ? 'Signing out…' : 'Sign out'}
            </Button>
          </Card>
        </div>
      </section>
    </>
  )
}
