import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Award,
  BookOpen,
  CircleCheck,
  CloudUpload,
  Download,
  ExternalLink,
  FlaskConical,
  LoaderCircle,
  LogIn,
  ShieldCheck,
  UserPlus,
} from 'lucide-react'
import Alert from '../components/Alert'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import CertificatePreview from '../components/CertificatePreview'
import PageHeader from '../components/PageHeader'
import ProgressBar from '../components/ProgressBar'
import TextField from '../components/TextField'
import useAuth from '../hooks/useAuth'
import useProgress from '../hooks/useProgress'
import { api, apiRequest } from '../lib/api'
import { formatDate } from '../utils/progress'
import { normalizeName, validateDisplayName } from '../utils/forms'

function RequirementBars({ completedLessons, requiredLessons, completedCases, requiredCases }) {
  return (
    <div className="space-y-5">
      <ProgressBar
        value={completedLessons}
        max={requiredLessons || 1}
        label="Learning modules completed"
        showValue
        valueText={`${completedLessons} of ${requiredLessons}`}
        tone={completedLessons === requiredLessons ? 'green' : 'cyan'}
      />
      <ProgressBar
        value={completedCases}
        max={requiredCases || 1}
        label="Investigation Lab cases submitted"
        showValue
        valueText={`${completedCases} of ${requiredCases}`}
        tone={completedCases === requiredCases ? 'green' : 'navy'}
      />
    </div>
  )
}

function Requirements() {
  return (
    <Card padding="lg">
      <h2 className="text-xl font-bold">How to earn it</h2>
      <ol className="mt-4 space-y-3 text-sm leading-relaxed text-slate-700">
        <li className="flex gap-3">
          <BookOpen className="mt-0.5 size-4 shrink-0 text-cyan-600" aria-hidden="true" />
          Complete every learning module by finishing its knowledge check.
        </li>
        <li className="flex gap-3">
          <FlaskConical className="mt-0.5 size-4 shrink-0 text-cyan-600" aria-hidden="true" />
          Submit an assessment for every Investigation Lab case. Your assessment does not have to match the expected one.
        </li>
        <li className="flex gap-3">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-cyan-600" aria-hidden="true" />
          Sign in, so your progress is confirmed by the VerifyIT server. Quiz scores are not required.
        </li>
      </ol>
      <p className="mt-5 text-xs leading-relaxed text-slate-500">
        This certificate is issued by the VerifyIT educational project. It is not a government, academic, or professional credential.
      </p>
    </Card>
  )
}

function GuestView() {
  const { isConfigured } = useAuth()
  const { summary } = useProgress()
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <CertificatePreview locked />
      <div className="space-y-6">
        <Card padding="lg">
          <h2 className="text-xl font-bold">Your progress in this browser</h2>
          <div className="mt-5">
            <RequirementBars
              completedLessons={summary.completedLessonIds.length}
              requiredLessons={summary.lessonCount}
              completedCases={summary.completedCaseIds.length}
              requiredCases={summary.caseCount}
            />
          </div>
          {isConfigured ? (
            <>
              <p className="mt-5 text-sm leading-relaxed text-slate-600">
                Guest progress is stored only in this browser, so it cannot prove completion by itself. Sign in or create an account to claim a
                verified certificate. Your guest progress is kept, and you can save it to your account once you sign in.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button to="/login?next=/certificate" icon={LogIn} iconPosition="left">
                  Sign in
                </Button>
                <Button to="/register?next=/certificate" variant="secondary" icon={UserPlus} iconPosition="left">
                  Create an account
                </Button>
              </div>
            </>
          ) : (
            <Alert tone="info" className="mt-5">
              Certificates need an account, and accounts are not available on this site yet. Your guest progress is still saved in this browser.
            </Alert>
          )}
        </Card>
        <Requirements />
      </div>
    </div>
  )
}

function IssuedView({ certificate }) {
  const [download, setDownload] = useState({ state: 'idle', error: null })

  async function handleDownload() {
    setDownload({ state: 'loading', error: null })
    try {
      const { blob, filename } = await apiRequest(`/certificates/${certificate.id}/pdf`, { auth: true, responseType: 'blob', timeoutMs: 30000 })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 2000)
      setDownload({ state: 'idle', error: null })
    } catch (error) {
      setDownload({ state: 'error', error })
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <CertificatePreview recipientName={certificate.recipientName} issuedAt={certificate.issuedAt} certificateNumber={certificate.certificateNumber} />
      <Card padding="lg">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-bold">Your certificate</h2>
          <Badge tone={certificate.status === 'active' ? 'green' : 'red'} icon={certificate.status === 'active' ? CircleCheck : undefined}>
            {certificate.status === 'active' ? 'Valid' : 'Revoked'}
          </Badge>
        </div>
        <dl className="mt-5 space-y-4 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recipient</dt>
            <dd className="mt-1 font-semibold text-navy-900">{certificate.recipientName}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Issued</dt>
            <dd className="mt-1 text-navy-900">{formatDate(certificate.issuedAt)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Certificate number</dt>
            <dd className="mt-1 font-mono text-navy-900">{certificate.certificateNumber}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Verification link</dt>
            <dd className="mt-1 break-all text-navy-800">{certificate.verificationUrl}</dd>
          </div>
        </dl>
        {download.state === 'error' && (
          <Alert tone="error" className="mt-5">
            {download.error?.message ?? 'The PDF could not be downloaded.'}
          </Alert>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          {certificate.status === 'active' && (
            <Button onClick={handleDownload} disabled={download.state === 'loading'} icon={download.state === 'loading' ? LoaderCircle : Download} iconPosition="left">
              {download.state === 'loading' ? 'Preparing PDF…' : 'Download PDF'}
            </Button>
          )}
          <Button to={`/verify-certificate/${encodeURIComponent(certificate.certificateNumber)}`} variant="secondary" icon={ExternalLink} iconPosition="left">
            Verify Certificate
          </Button>
        </div>
      </Card>
    </div>
  )
}

function ClaimView({ eligibility, onIssued, onEligibilityChanged }) {
  const { profile, profileStatus, updateDisplayName } = useAuth()
  const [name, setName] = useState(profile?.displayName ?? '')
  const [nameError, setNameError] = useState(null)
  const [claim, setClaim] = useState({ state: 'idle', error: null })

  useEffect(() => {
    if (profile?.displayName) setName((current) => current || profile.displayName)
  }, [profile?.displayName])

  async function handleClaim(event) {
    event.preventDefault()
    const error = validateDisplayName(name, { required: true })
    setNameError(error)
    if (error) return
    const recipientName = normalizeName(name)
    setClaim({ state: 'working', error: null })
    if (!profile?.displayName) {
      const saved = await updateDisplayName(recipientName)
      if (!saved.ok) {
        setClaim({ state: 'error', error: { message: saved.error } })
        return
      }
    }
    try {
      onIssued(await api.post('/certificates/issue', { recipientName }, { auth: true }))
    } catch (issueError) {
      setClaim({ state: 'error', error: issueError })
      if (issueError.code === 'NOT_ELIGIBLE') onEligibilityChanged()
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <CertificatePreview recipientName={normalizeName(name) || undefined} />
      <Card padding="lg">
        <Badge tone="green" icon={CircleCheck}>
          Eligible for Certificate
        </Badge>
        <h2 className="mt-3 text-xl font-bold">Claim your certificate</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          You completed all {eligibility.requiredLessons} learning modules and all {eligibility.requiredCases} Investigation Lab cases.
        </p>
        <form onSubmit={handleClaim} noValidate className="mt-5 space-y-4">
          <TextField
            id="certificate-name"
            label="Name on the certificate"
            hint={profile?.displayName ? 'Printed exactly as shown. It cannot be changed after the certificate is issued.' : 'Your profile has no name yet. This will also become your display name.'}
            autoComplete="name"
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
            error={nameError}
            disabled={claim.state === 'working' || profileStatus === 'loading'}
          />
          {claim.state === 'error' && <Alert tone="error">{claim.error?.message ?? 'The certificate could not be issued. Please try again.'}</Alert>}
          <Button type="submit" size="lg" className="w-full" disabled={claim.state === 'working'} icon={claim.state === 'working' ? LoaderCircle : Award} iconPosition="left">
            {claim.state === 'working' ? 'Issuing…' : 'Claim Certificate'}
          </Button>
        </form>
      </Card>
    </div>
  )
}

function LockedView({ eligibility }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <CertificatePreview locked />
      <div className="space-y-6">
        <Card padding="lg">
          <h2 className="text-xl font-bold">Almost there</h2>
          <div className="mt-5">
            <RequirementBars {...eligibility} />
          </div>
          {eligibility.remainingRequirements.length > 0 && (
            <>
              <h3 className="mt-6 font-sans text-sm font-bold text-navy-900">Still to do</h3>
              <ul className="mt-3 divide-y divide-slate-100">
                {eligibility.remainingRequirements.map((item) => (
                  <li key={`${item.type}-${item.id}`}>
                    <Link to={item.path} className="flex items-center gap-3 py-3 text-sm font-medium text-slate-700 hover:text-navy-900">
                      {item.type === 'lesson' ? (
                        <BookOpen className="size-4 shrink-0 text-cyan-600" aria-hidden="true" />
                      ) : (
                        <FlaskConical className="size-4 shrink-0 text-navy-600" aria-hidden="true" />
                      )}
                      <span className="flex-1">
                        <span className="sr-only">{item.type === 'lesson' ? 'Lesson: ' : 'Investigation case: '}</span>
                        {item.title}
                      </span>
                      <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
        <Requirements />
      </div>
    </div>
  )
}

function AccountView() {
  const { userId, guest, refresh } = useProgress()
  const [state, setState] = useState({ status: 'loading', data: null, error: null })

  const load = useCallback(async () => {
    setState((current) => ({ ...current, status: 'loading', error: null }))
    try {
      setState({ status: 'ready', data: await api.get('/certificates/eligibility', { auth: true }), error: null })
    } catch (error) {
      setState({ status: 'error', data: null, error })
    }
  }, [])

  useEffect(() => {
    load()
  }, [load, userId])

  // Reload after guest progress is saved, since it can change eligibility.
  useEffect(() => {
    if (guest.importState.state === 'done') load()
  }, [guest.importState.state, load])

  return (
    <div className="space-y-8">
      {guest.pending.total > 0 && (
        <Alert
          tone="info"
          title="You have guest progress that is not in your account yet"
          action={
            <Button size="sm" onClick={guest.importToAccount} disabled={guest.importState.state === 'importing'} icon={CloudUpload} iconPosition="left">
              {guest.importState.state === 'importing' ? 'Saving…' : 'Save it to my account'}
            </Button>
          }
        >
          Activities you completed as a guest count toward the certificate once the server confirms them.
        </Alert>
      )}
      {state.status === 'loading' && (
        <p role="status" className="flex items-center gap-2 text-slate-600">
          <LoaderCircle className="size-5 motion-safe:animate-spin" aria-hidden="true" />
          Checking your certificate status…
        </p>
      )}
      {state.status === 'error' && (
        <Alert tone="error" action={<Button size="sm" variant="secondary" onClick={load}>Try again</Button>}>
          {state.error?.message ?? 'Your certificate status could not be loaded.'}
        </Alert>
      )}
      {state.status === 'ready' && state.data.existingCertificate && <IssuedView certificate={state.data.existingCertificate} />}
      {state.status === 'ready' && !state.data.existingCertificate && state.data.eligible && (
        <ClaimView
          eligibility={state.data}
          onIssued={(certificate) => {
            setState((current) => ({ ...current, data: { ...current.data, existingCertificate: certificate } }))
            refresh()
          }}
          onEligibilityChanged={load}
        />
      )}
      {state.status === 'ready' && !state.data.existingCertificate && !state.data.eligible && <LockedView eligibility={state.data} />}
    </div>
  )
}

export default function Certificate() {
  const { status } = useAuth()
  return (
    <>
      <PageHeader watermark="Certify"
        eyebrow="Certificate"
        icon={Award}
        title="Certificate of Completion"
        description="Media Literacy and Online Misinformation Awareness. Finish every lesson and investigation case to earn a verifiable certificate from the VerifyIT project."
      />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {status === 'loading' ? (
          <p role="status" className="flex items-center gap-2 text-slate-600">
            <LoaderCircle className="size-5 motion-safe:animate-spin" aria-hidden="true" />
            Loading…
          </p>
        ) : status === 'signedIn' ? (
          <AccountView />
        ) : (
          <GuestView />
        )}
      </section>
    </>
  )
}
