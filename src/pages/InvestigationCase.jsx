import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CircleCheck, CircleHelp, ClipboardCheck, RotateCcw, Search, TriangleAlert } from 'lucide-react'
import Alert from '../components/Alert'
import Badge, { difficultyTone } from '../components/Badge'
import Button from '../components/Button'
import PageIntro from '../components/PageIntro'
import EvidenceCard from '../components/EvidenceCard'
import FictionalNotice from '../components/FictionalNotice'
import ProgressBar from '../components/ProgressBar'
import SaveStatus from '../components/SaveStatus'
import SocialPost from '../components/SocialPost'
import useProgress from '../hooks/useProgress'
import { newClientId } from '../lib/api'
import { assessmentOptions, getInvestigationById, investigationAreas, investigations } from '../data/investigations'

const areaById = Object.fromEntries(investigationAreas.map((area) => [area.id, area]))
const assessmentById = Object.fromEntries(assessmentOptions.map((option) => [option.id, option]))

export default function InvestigationCase() {
  const { caseId } = useParams()
  const investigation = getInvestigationById(caseId)

  if (!investigation) {
    return (
      <section className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-3xl font-extrabold">Case not found</h1>
        <p className="mt-3 text-slate-600">This investigation case does not exist.</p>
        <Button to="/lab" icon={ArrowLeft} iconPosition="left" className="mt-8">
          Back to the Investigation Lab
        </Button>
      </section>
    )
  }

  // The key resets all investigation state when switching to a different case.
  return <CaseView key={investigation.id} investigation={investigation} />
}

function CaseView({ investigation }) {
  const navigate = useNavigate()
  const { caseProgress, submitCase } = useProgress()
  const [inspected, setInspected] = useState({})
  const [assessment, setAssessment] = useState(null)
  const [reasoning, setReasoning] = useState('')
  const [submitted, setSubmitted] = useState(false)
  // The expected verdict and explanation come from the server, only after a submission.
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const resultsRef = useRef(null)
  // Reused if the same submission is retried after a network error, so it is never stored twice.
  const clientAttemptId = useRef(null)

  const caseIndex = investigations.findIndex((item) => item.id === investigation.id)
  const inspectedCount = investigation.evidence.filter((item) => inspected[item.area]).length
  const totalAreas = investigation.evidence.length
  const isCorrect = submitted && result?.isCorrect === true
  const missedClues = investigation.evidence.filter((item) => item.key && !inspected[item.area])

  useEffect(() => {
    if (submitted) {
      resultsRef.current?.scrollIntoView({ block: 'start' })
      resultsRef.current?.focus({ preventScroll: true })
    }
  }, [submitted])

  async function handleSubmit(event) {
    event.preventDefault()
    if (!assessment || submitting) return
    clientAttemptId.current ??= newClientId()
    setSubmitting(true)
    setSubmitError(null)
    try {
      const outcome = await submitCase(investigation.id, {
        verdict: assessment,
        inspectedCount,
        clientAttemptId: clientAttemptId.current,
      })
      setResult(outcome)
      setSubmitted(true)
    } catch (error) {
      setSubmitError(error)
    } finally {
      setSubmitting(false)
    }
  }

  function handleRetry() {
    setInspected({})
    setAssessment(null)
    setReasoning('')
    setSubmitted(false)
    setResult(null)
    setSubmitError(null)
    clientAttemptId.current = null
    window.scrollTo(0, 0)
  }

  function handleNextCase() {
    // Prefer the next case the user has not completed yet; otherwise go to the next one in order.
    const ordered = [...investigations.slice(caseIndex + 1), ...investigations.slice(0, caseIndex)]
    const next = ordered.find((item) => !caseProgress[item.id]?.completed) ?? ordered[0]
    navigate(`/lab/${next.id}`)
  }

  return (
    <>
      <PageIntro as="header" word="Case">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <Link to="/lab" className="inline-flex items-center gap-1.5 rounded text-sm font-semibold text-navy-700 hover:text-navy-900">
            <ArrowLeft className="size-4" aria-hidden="true" />
            All cases
          </Link>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
              Case {caseIndex + 1} of {investigations.length}
            </span>
            <FictionalNotice />
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{investigation.title}</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-600">{investigation.summary}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Badge tone={difficultyTone[investigation.difficulty]}>{investigation.difficulty}</Badge>
            <Badge tone="slate">{investigation.topic}</Badge>
          </div>
        </div>
      </PageIntro>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:px-8">
        {/* Left column: the post and the guiding questions */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start" aria-label="Case materials">
          <SocialPost post={investigation.post} />

          <div className="rounded-md border border-slate-200 bg-white p-5">
            <h2 className="font-sans text-sm font-bold text-navy-900">Background context</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{investigation.context}</p>
          </div>

          <div className="rounded-md border border-cyan-100 bg-cyan-50/50 p-5">
            <h2 className="flex items-center gap-2 font-sans text-sm font-bold text-navy-900">
              <CircleHelp className="size-4 text-cyan-700" aria-hidden="true" />
              Guiding questions
            </h2>
            <ul className="mt-3 space-y-2">
              {investigation.guidingQuestions.map((question) => (
                <li key={question} className="flex gap-2 text-sm leading-relaxed text-slate-700">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-cyan-600" aria-hidden="true" />
                  {question}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Right column: evidence, assessment, results */}
        <div className="min-w-0 space-y-8">
          <section aria-labelledby="evidence-title">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id="evidence-title" className="flex items-center gap-2 text-2xl font-bold">
                  <Search className="size-5 text-cyan-600" aria-hidden="true" />
                  Evidence board
                </h2>
                <p className="mt-1 text-sm text-slate-600">Inspect each area to reveal what an investigator would find.</p>
              </div>
              <ProgressBar
                value={inspectedCount}
                max={totalAreas}
                label="Areas inspected"
                showValue
                valueText={`${inspectedCount} of ${totalAreas}`}
                className="w-full sm:w-56"
                tone="navy"
              />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {investigation.evidence.map((item) => {
                const area = areaById[item.area]
                return (
                  <EvidenceCard
                    key={item.area}
                    id={`${investigation.id}-${item.area}`}
                    label={area.label}
                    icon={area.icon}
                    question={item.question}
                    finding={item.finding}
                    signal={item.signal}
                    inspected={Boolean(inspected[item.area])}
                    onInspect={() => setInspected((prev) => ({ ...prev, [item.area]: true }))}
                    highlight={submitted && item.key && !inspected[item.area]}
                  />
                )
              })}
            </div>

            {!submitted && inspectedCount < totalAreas && (
              <button
                type="button"
                onClick={() => setInspected(Object.fromEntries(investigation.evidence.map((item) => [item.area, true])))}
                className="mt-4 rounded text-sm font-semibold text-navy-700 underline decoration-navy-200 underline-offset-4 hover:text-navy-900"
              >
                Reveal all evidence
              </button>
            )}
          </section>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-5 sm:p-8">
              <fieldset>
                <legend className="flex items-center gap-2 font-display text-2xl font-bold text-navy-900">
                  <ClipboardCheck className="size-5 text-cyan-600" aria-hidden="true" />
                  Your assessment
                </legend>
                <p className="mt-1 text-sm text-slate-600">Based on the evidence you inspected, how would you rate this claim?</p>
                <div className="mt-5 grid gap-3">
                  {assessmentOptions.map((option) => {
                    const id = `assessment-${option.id}`
                    const selected = assessment === option.id
                    return (
                      <div key={option.id}>
                        <input
                          id={id}
                          type="radio"
                          name="assessment"
                          value={option.id}
                          checked={selected}
                          onChange={() => setAssessment(option.id)}
                          disabled={submitting}
                          className="peer sr-only"
                        />
                        <label
                          htmlFor={id}
                          className={`flex cursor-pointer gap-3 rounded-md border p-4 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cyan-600 ${
                            selected ? 'border-navy-900 bg-navy-50 ring-1 ring-navy-900' : 'border-slate-200 hover:border-navy-300 hover:bg-slate-50'
                          }`}
                        >
                          <span
                            className={`mt-0.5 size-5 shrink-0 rounded-full ${selected ? 'border-[6px] border-navy-900' : 'border-2 border-slate-300'}`}
                            aria-hidden="true"
                          />
                          <span>
                            <span className="block font-semibold text-navy-900">{option.label}</span>
                            <span className="mt-0.5 block text-sm text-slate-600">{option.description}</span>
                          </span>
                        </label>
                      </div>
                    )
                  })}
                </div>
              </fieldset>

              <div className="mt-6">
                <label htmlFor="reasoning" className="text-sm font-semibold text-navy-900">
                  Your reasoning <span className="font-normal text-slate-500">(optional)</span>
                </label>
                <textarea
                  id="reasoning"
                  rows={3}
                  value={reasoning}
                  onChange={(event) => setReasoning(event.target.value)}
                  placeholder="Which clues influenced your decision?"
                  className="mt-2 w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-600/20"
                />
              </div>

              {submitError && (
                <Alert tone="error" className="mt-6" title="Your investigation was not submitted">
                  {submitError.message} Your answers are still here, so you can submit again.
                </Alert>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button type="submit" size="lg" disabled={!assessment || submitting}>
                  {submitting ? 'Submitting…' : submitError ? 'Try again' : 'Submit Investigation'}
                </Button>
                <p className="text-sm text-slate-500">
                  {!assessment
                    ? 'Choose an assessment to submit.'
                    : inspectedCount < totalAreas
                      ? `You have inspected ${inspectedCount} of ${totalAreas} areas.`
                      : 'You inspected every area. Nice work.'}
                </p>
              </div>
            </form>
          ) : (
            <section
              ref={resultsRef}
              tabIndex={-1}
              aria-labelledby="results-title"
              className="scroll-mt-24 space-y-6 rounded-lg border border-slate-200 bg-white p-5 motion-safe:animate-fade-up sm:p-8"
            >
              <div className={`rounded-md p-5 ${isCorrect ? 'bg-emerald-50 ring-1 ring-emerald-200' : 'bg-amber-50 ring-1 ring-amber-200'}`}>
                <p
                  id="results-title"
                  className={`flex items-center gap-2 font-display text-xl font-bold ${isCorrect ? 'text-emerald-800' : 'text-amber-900'}`}
                >
                  {isCorrect ? <CircleCheck className="size-6" aria-hidden="true" /> : <TriangleAlert className="size-6" aria-hidden="true" />}
                  {isCorrect ? 'Your assessment matches the evidence.' : 'Your assessment differs from the expected one.'}
                </p>
                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md bg-white/80 p-3 ring-1 ring-slate-200">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your assessment</dt>
                    <dd className="mt-1 font-semibold text-navy-900">{assessmentById[assessment].label}</dd>
                  </div>
                  <div className="rounded-md bg-white/80 p-3 ring-1 ring-slate-200">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Expected assessment</dt>
                    <dd className="mt-1 font-semibold text-navy-900">{assessmentById[result.expectedVerdict]?.label ?? result.expectedVerdict}</dd>
                  </div>
                </dl>
                {reasoning.trim() && (
                  <p className="mt-3 text-sm text-slate-600">
                    <span className="font-semibold text-navy-900">Your reasoning:</span> {reasoning}
                  </p>
                )}
                <SaveStatus state={result.saved} className="mt-3" />
              </div>

              <div>
                <h2 className="text-xl font-bold">What the evidence shows</h2>
                <p className="mt-2 leading-relaxed text-slate-700">{result.explanation}</p>
              </div>

              <div>
                <h2 className="text-xl font-bold">Clues you may have missed</h2>
                {missedClues.length > 0 ? (
                  <ul className="mt-3 space-y-3">
                    {missedClues.map((clue) => (
                      <li key={clue.area} className="rounded-md border border-amber-200 bg-amber-50/60 p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-amber-800">{areaById[clue.area].label}</p>
                        <p className="mt-1 text-sm leading-relaxed text-slate-700">{clue.finding}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 flex items-center gap-2 text-sm text-emerald-800">
                    <CircleCheck className="size-4" aria-hidden="true" />
                    You inspected every key clue in this case.
                  </p>
                )}
                <p className="mt-3 text-sm text-slate-500">
                  You inspected {inspectedCount} of {totalAreas} evidence areas.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold">Recommended verification steps</h2>
                <ol className="mt-3 space-y-2">
                  {investigation.steps.map((step, index) => (
                    <li key={step} className="flex gap-3 text-sm leading-relaxed text-slate-700">
                      <span className="keep-palette grid size-6 shrink-0 place-items-center rounded-full bg-navy-900 text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <span className="pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row">
                <Button onClick={handleRetry} variant="secondary" icon={RotateCcw} iconPosition="left">
                  Retry
                </Button>
                <Button onClick={handleNextCase} icon={ArrowRight}>
                  Investigate Another Case
                </Button>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  )
}
