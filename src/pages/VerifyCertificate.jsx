import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BadgeCheck, CircleX, LoaderCircle, Search, ShieldAlert, ShieldCheck, WifiOff } from 'lucide-react'
import Alert from '../components/Alert'
import Button from '../components/Button'
import Card from '../components/Card'
import PageHeader from '../components/PageHeader'
import TextField from '../components/TextField'
import { api } from '../lib/api'
import { formatDate } from '../utils/progress'

const NUMBER_PATTERN = /^VIT-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/

function LookupForm({ initialValue = '' }) {
  const navigate = useNavigate()
  const [value, setValue] = useState(initialValue)
  const [error, setError] = useState(null)

  function handleSubmit(event) {
    event.preventDefault()
    const number = value.trim().toUpperCase()
    if (!NUMBER_PATTERN.test(number)) {
      setError('Enter the number exactly as printed, for example VIT-1A2B-3C4D-5E6F-7A8B.')
      return
    }
    setError(null)
    navigate(`/verify-certificate/${number}`)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <TextField
        id="certificate-number"
        label="Certificate number"
        className="flex-1"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        error={error}
        autoComplete="off"
        spellCheck={false}
        placeholder="VIT-XXXX-XXXX-XXXX-XXXX"
      />
      <Button type="submit" className="sm:mt-7" icon={Search} iconPosition="left">
        Verify
      </Button>
    </form>
  )
}

function Result({ certificateNumber }) {
  const [state, setState] = useState({ status: 'loading' })

  const load = useCallback(async () => {
    setState({ status: 'loading' })
    try {
      const data = await api.get(`/certificates/verify/${encodeURIComponent(certificateNumber)}`)
      setState({ status: data.valid ? 'valid' : 'revoked', data })
    } catch (error) {
      if (error.status === 404) setState({ status: 'not_found' })
      else if (error.status === 400) setState({ status: 'malformed' })
      else setState({ status: 'error', error })
    }
  }, [certificateNumber])

  useEffect(() => {
    load()
  }, [load])

  if (state.status === 'loading') {
    return (
      <p role="status" className="flex items-center gap-2 text-slate-600">
        <LoaderCircle className="size-5 motion-safe:animate-spin" aria-hidden="true" />
        Checking certificate {certificateNumber}…
      </p>
    )
  }

  if (state.status === 'error') {
    return (
      <Alert tone="error" title="We could not check this certificate right now" action={<Button size="sm" variant="secondary" onClick={load}>Try again</Button>}>
        <span className="inline-flex items-center gap-1.5">
          <WifiOff className="size-4" aria-hidden="true" />
          {state.error?.message ?? 'Please try again.'}
        </span>{' '}
        This does not mean the certificate is invalid.
      </Alert>
    )
  }

  if (state.status === 'valid') {
    const { data } = state
    return (
      <Card padding="lg" className="border-emerald-200">
        <div role="status" className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600">
            <BadgeCheck className="size-7" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Valid certificate</p>
            <h2 className="mt-1 text-2xl font-extrabold">{data.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{data.program}</p>
          </div>
        </div>
        <dl className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-md bg-paper p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recipient</dt>
            <dd className="mt-1 font-semibold text-navy-900">{data.recipientName}</dd>
          </div>
          <div className="rounded-md bg-paper p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Issued</dt>
            <dd className="mt-1 text-navy-900">{formatDate(data.issuedAt)}</dd>
          </div>
          <div className="rounded-md bg-paper p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Certificate number</dt>
            <dd className="mt-1 break-all font-mono text-navy-900">{data.certificateNumber}</dd>
          </div>
        </dl>
        <p className="mt-5 text-sm leading-relaxed text-slate-700">{data.description}</p>
        <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-slate-500">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-cyan-600" aria-hidden="true" />
          Issued by the {data.issuer}. It recognizes completion of VerifyIT activities and is not a government, academic, or professional credential.
        </p>
      </Card>
    )
  }

  const revoked = state.status === 'revoked'
  return (
    <Card padding="lg" className="border-rose-200">
      <div role="alert" className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-600">
          {revoked ? <ShieldAlert className="size-7" aria-hidden="true" /> : <CircleX className="size-7" aria-hidden="true" />}
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-700">Not valid</p>
          <h2 className="mt-1 text-2xl font-extrabold">
            {revoked ? 'This certificate has been revoked' : state.status === 'malformed' ? 'This is not a valid certificate number' : 'No certificate found'}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {revoked
              ? `Certificate ${state.data.certificateNumber} was issued by VerifyIT but is no longer valid${state.data.revokedAt ? ` (revoked ${formatDate(state.data.revokedAt)})` : ''}.`
              : state.status === 'malformed'
                ? 'VerifyIT certificate numbers look like VIT-1A2B-3C4D-5E6F-7A8B. Check the number and try again.'
                : `VerifyIT has no certificate with the number ${certificateNumber}. Check that it was typed exactly as printed.`}
          </p>
        </div>
      </div>
    </Card>
  )
}

/** Public page: /verify-certificate/:certificateNumber (or /verify-certificate to type a number). */
export default function VerifyCertificate() {
  const { certificateNumber } = useParams()
  return (
    <>
      <PageHeader watermark="Verify"
        eyebrow="Certificate verification"
        icon={ShieldCheck}
        title="Verify a VerifyIT certificate"
        description="Check whether a Certificate of Completion was issued by the VerifyIT project. Only the details printed on the certificate are shown."
      />
      <section className="mx-auto max-w-3xl space-y-8 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {certificateNumber && <Result key={certificateNumber} certificateNumber={certificateNumber} />}
        <Card padding="lg">
          <h2 className="text-lg font-bold">{certificateNumber ? 'Check another certificate' : 'Enter a certificate number'}</h2>
          <div className="mt-4">
            <LookupForm />
          </div>
        </Card>
      </section>
    </>
  )
}
