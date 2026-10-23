import { useState } from 'react'
import { CircleCheck, CircleX, ClipboardCheck, RotateCcw } from 'lucide-react'
import Button from './Button'
import SaveStatus from './SaveStatus'

// The completion message only claims success once the save was confirmed.
const COMPLETION_TEXT = {
  saving: 'Saving your completion…',
  account: 'Lesson marked as complete.',
  browser: 'Lesson marked as complete in this browser.',
  pending: 'Lesson completion is not saved to your account yet.',
  failed: 'Your account did not accept this completion.',
}

/** Short multiple-choice check at the end of each lesson. */
export default function KnowledgeCheck({ questions, onComplete, previousResult, saveStatus, onRetrySave }) {
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const allAnswered = questions.every((question) => answers[question.id] !== undefined)
  const correctCount = questions.filter((question) => answers[question.id] === question.answer).length

  function handleSubmit(event) {
    event.preventDefault()
    if (!allAnswered) return
    setSubmitted(true)
    onComplete(correctCount, questions.length)
  }

  function handleRetry() {
    setAnswers({})
    setSubmitted(false)
  }

  return (
    <section aria-labelledby="knowledge-check-title" className="rounded-lg border border-navy-100 bg-navy-50/60 p-5 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
            <ClipboardCheck className="size-4" aria-hidden="true" />
            Knowledge check
          </p>
          <h2 id="knowledge-check-title" className="mt-2 text-2xl font-extrabold">
            Test your understanding
          </h2>
        </div>
        {previousResult && !submitted && (
          <p className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
            Last result: {previousResult.correct}/{previousResult.total}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {questions.map((question, qIndex) => {
          const chosen = answers[question.id]
          const isCorrect = chosen === question.answer
          return (
            <fieldset key={question.id} className="rounded-md border border-slate-200 bg-white p-5">
              <legend className="sr-only">Question {qIndex + 1}</legend>
              <p className="font-semibold text-navy-900">
                <span className="mr-2 text-slate-400">{qIndex + 1}.</span>
                {question.question}
              </p>
              <div className="mt-4 grid gap-2">
                {question.options.map((option, index) => {
                  const id = `${question.id}-${index}`
                  const isSelected = chosen === index
                  let style = 'border-slate-200 hover:border-navy-300 hover:bg-slate-50'
                  if (submitted && index === question.answer) style = 'border-emerald-300 bg-emerald-50 text-emerald-900'
                  else if (submitted && isSelected) style = 'border-rose-300 bg-rose-50 text-rose-900'
                  else if (submitted) style = 'border-slate-200 text-slate-500'
                  else if (isSelected) style = 'border-navy-900 bg-navy-50 ring-1 ring-navy-900'
                  return (
                    <div key={id}>
                      <input
                        id={id}
                        type="radio"
                        name={question.id}
                        checked={isSelected}
                        onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: index }))}
                        disabled={submitted}
                        className="peer sr-only"
                      />
                      <label
                        htmlFor={id}
                        className={`flex cursor-pointer items-center gap-3 rounded-md border px-4 py-3 text-sm transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cyan-600 peer-disabled:cursor-default ${style}`}
                      >
                        <span
                          className={`size-4 shrink-0 rounded-full ${isSelected ? 'border-[5px] border-navy-900' : 'border-2 border-slate-300'}`}
                          aria-hidden="true"
                        />
                        {option}
                      </label>
                    </div>
                  )
                })}
              </div>
              {submitted && (
                <p
                  className={`mt-4 flex gap-2 rounded-md p-3 text-sm leading-relaxed ${
                    isCorrect ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900'
                  }`}
                >
                  {isCorrect ? (
                    <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  ) : (
                    <CircleX className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  )}
                  <span>
                    <strong>{isCorrect ? 'Correct. ' : 'Not quite. '}</strong>
                    {question.explanation}
                  </span>
                </p>
              )}
            </fieldset>
          )
        })}

        {submitted ? (
          <div role="status" className="keep-palette flex flex-col gap-4 rounded-md bg-navy-900 p-5 text-white sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p>
                <span className="font-display text-2xl font-extrabold">
                  {correctCount}/{questions.length}
                </span>{' '}
                <span className="text-navy-100">
                  {correctCount === questions.length ? 'Excellent! ' : ''}
                  {COMPLETION_TEXT[saveStatus?.state] ?? 'Lesson marked as complete.'}
                  {correctCount < questions.length && ' Review the explanations and try again anytime.'}
                </span>
              </p>
              {saveStatus?.state && saveStatus.state !== 'saving' && saveStatus.state !== 'account' && (
                <SaveStatus state={saveStatus.state} error={saveStatus.error} onRetry={onRetrySave} light className="mt-2" />
              )}
            </div>
            <Button variant="outlineLight" onClick={handleRetry} icon={RotateCcw} iconPosition="left">
              Try again
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button type="submit" disabled={!allAnswered} size="lg">
              Check my answers
            </Button>
            {!allAnswered && <p className="text-sm text-slate-500">Answer every question to check your results.</p>}
          </div>
        )}
      </form>
    </section>
  )
}
