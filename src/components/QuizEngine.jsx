import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Award, ClipboardList, Flag, LayoutGrid, ListOrdered, Play, RotateCcw, TriangleAlert, Trophy } from 'lucide-react'
import Badge, { difficultyTone } from './Badge'
import Button from './Button'
import PageIntro from './PageIntro'
import Card from './Card'
import QuizProgress from './QuizProgress'
import QuizQuestion from './QuizQuestion'
import QuizResults from './QuizResults'
import { ICONS } from './QuizCategoryCard'
import useLocalStorage from '../hooks/useLocalStorage'
import useProgress from '../hooks/useProgress'
import { newClientId } from '../lib/api'
import { categoryTitle, getQuestionCount } from '../data/quizCategories'
import { formatDate, quizSessionKey } from '../utils/progress'
import { QUIZ_SESSION_VERSION, applyOptionOrder, computeResult, drawAttempt, toOriginalIndex } from '../utils/quiz'

/**
 * Runs one category quiz from start to results. The same engine is used for every category:
 * it only needs the category settings and the pool of questions to draw from.
 *
 * Session (saved per category in localStorage so a refresh does not lose progress):
 *   { version, status: 'active' | 'finished', clientAttemptId, questionIds, optionOrders, index,
 *     responses: { [questionId]: { selected, submitted } },
 *     reveals: { [questionId]: { correctAnswer, explanation } }, result, saveState }
 * `selected` is an index into the options as displayed in this attempt. Correct answers are not part
 * of the question data: each one is revealed by the server after the answer is submitted.
 */
export default function QuizEngine({ category, questions, autoStart = false, onAutoStarted }) {
  const { quizRecords, recordQuizAttempt, checkQuizAnswer, userId, mode, outbox } = useProgress()
  const [storedSession, setSession] = useLocalStorage(quizSessionKey(category.id, userId), null)
  // Sessions saved before answers were checked on the server cannot be resumed.
  const session = storedSession?.version === QUIZ_SESSION_VERSION ? storedSession : null
  const record = quizRecords?.[category.id]

  const questionById = useMemo(() => Object.fromEntries(questions.map((q) => [q.id, q])), [questions])
  // Ignore a saved session if the question data has changed since it was saved.
  const sessionQuestions = useMemo(() => {
    const list = (session?.questionIds ?? []).map((id) => questionById[id])
    if (list.length === 0 || !list.every(Boolean)) return null
    return list.map((question) => {
      const reveal = session?.reveals?.[question.id]
      const known = reveal
        ? { ...question, answer: reveal.correctAnswer, explanation: reveal.explanation, credits: reveal.credits ?? [] }
        : question
      return applyOptionOrder(known, session?.optionOrders?.[question.id])
    })
  }, [session?.questionIds, session?.optionOrders, session?.reveals, questionById])

  const [view, setView] = useState(() => (session?.status === 'active' && sessionQuestions ? 'active' : 'intro'))
  const [isNewBest, setIsNewBest] = useState(false)
  const [checking, setChecking] = useState(false)
  const [checkError, setCheckError] = useState(null)
  const [finishing, setFinishing] = useState(false)
  const questionRef = useRef(null)
  const lastIndex = useRef(null)
  const autoStartHandled = useRef(false)

  function startQuiz() {
    setSession({
      version: QUIZ_SESSION_VERSION,
      status: 'active',
      clientAttemptId: newClientId(),
      ...drawAttempt(category),
      index: 0,
      responses: {},
      reveals: {},
      result: null,
      saveState: null,
    })
    setView('active')
    window.scrollTo(0, 0)
  }

  // Cards on the category page link here with autoStart, so "Start Quiz" goes straight to question 1.
  // An attempt that is already in progress is resumed instead of restarted.
  useEffect(() => {
    if (!autoStart || autoStartHandled.current) return
    autoStartHandled.current = true
    if (!(session?.status === 'active' && sessionQuestions)) startQuiz()
    onAutoStarted?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart])

  const index = Math.min(session?.index ?? 0, (sessionQuestions?.length ?? 1) - 1)

  // Move focus to the new question so keyboard and screen reader users know it changed.
  useEffect(() => {
    if (view !== 'active') return
    if (lastIndex.current !== null && lastIndex.current !== index) questionRef.current?.focus()
    lastIndex.current = index
    setCheckError(null)
  }, [index, view])

  if (view === 'results' && session?.result && sessionQuestions) {
    // A queued attempt that the outbox has since delivered counts as saved.
    const stillQueued = outbox.pending.some((op) => op.type === 'quiz' && op.body?.clientAttemptId === session.clientAttemptId)
    const saveState = session.saveState === 'pending' && !stillQueued ? 'account' : session.saveState
    return (
      <QuizResults
        category={category}
        result={session.result}
        questions={sessionQuestions}
        responses={session.responses ?? {}}
        record={record}
        isNewBest={isNewBest}
        onRetry={startQuiz}
        saveState={saveState}
        saveError={session.saveError}
        onRetrySave={outbox.retry}
      />
    )
  }

  if (view !== 'active' || !sessionQuestions || session?.status !== 'active') {
    return (
      <QuizIntro
        category={category}
        record={record}
        canReview={session?.status === 'finished' && Boolean(session.result) && Boolean(sessionQuestions)}
        savedTo={mode}
        onStart={startQuiz}
        onReview={() => {
          setIsNewBest(false)
          setView('results')
        }}
      />
    )
  }

  const responses = session.responses ?? {}
  const question = sessionQuestions[index]
  const response = responses[question.id] ?? {}
  const total = sessionQuestions.length
  const answeredCount = sessionQuestions.filter((q) => responses[q.id]?.submitted).length
  const isLast = index === total - 1

  function updateResponse(changes) {
    setSession((prev) => ({
      ...prev,
      responses: { ...prev.responses, [question.id]: { ...prev.responses?.[question.id], ...changes } },
    }))
  }

  function goTo(nextIndex) {
    setSession((prev) => ({ ...prev, index: nextIndex }))
  }

  /** Sends the chosen option (in original order) to the server, which reveals the correct answer. */
  async function submitAnswer() {
    if (checking) return
    const original = toOriginalIndex(session.optionOrders?.[question.id], response.selected, question.options.length)
    setChecking(true)
    setCheckError(null)
    try {
      const reveal = await checkQuizAnswer(category.id, question.id, original)
      setSession((prev) => ({
        ...prev,
        reveals: {
          ...prev.reveals,
          [question.id]: { correctAnswer: reveal.correctAnswer, explanation: reveal.explanation, credits: reveal.credits ?? [] },
        },
        responses: { ...prev.responses, [question.id]: { ...prev.responses?.[question.id], submitted: true } },
      }))
    } catch (error) {
      setCheckError(error)
    } finally {
      setChecking(false)
    }
  }

  async function finishQuiz() {
    if (finishing) return
    setFinishing(true)
    const localResult = computeResult(category.id, sessionQuestions, responses)
    const answers = sessionQuestions.map((q) => {
      const answer = responses[q.id]
      return {
        questionId: q.id,
        selectedAnswer: toOriginalIndex(session.optionOrders?.[q.id], answer.selected, q.options.length),
      }
    })
    const previousBest = record?.best?.percent
    const outcome = await recordQuizAttempt(category.id, {
      clientAttemptId: session.clientAttemptId ?? newClientId(),
      answers,
      localResult,
    })
    setIsNewBest(previousBest === undefined || outcome.result.percent >= previousBest)
    setSession((prev) => ({
      ...prev,
      status: 'finished',
      result: outcome.result,
      saveState: outcome.state,
      saveError: outcome.error?.message ?? null,
    }))
    setFinishing(false)
    setView('results')
    window.scrollTo(0, 0)
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Link
        to="/quiz"
        className="inline-flex items-center gap-1.5 rounded text-sm font-semibold text-slate-500 transition-colors hover:text-navy-900"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to Categories
      </Link>

      <header className="mt-4 rounded-md border border-slate-200/80 bg-paper p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-bold sm:text-xl">{category.title}</h1>
          <Badge tone={difficultyTone[category.difficulty]}>{category.difficulty}</Badge>
          <Badge tone="slate" icon={ListOrdered}>
            {total} questions
          </Badge>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{category.description}</p>
      </header>

      <div className="mt-6">
        <QuizProgress questions={sessionQuestions} responses={responses} index={index} />
      </div>

      <div ref={questionRef} tabIndex={-1} className="mt-8 focus:outline-none" aria-label={`Question ${index + 1} of ${total}`}>
        <QuizQuestion
          key={question.id}
          question={question}
          number={index + 1}
          categoryLabel={category.isMixed ? categoryTitle[question.categoryId] : null}
          selected={response.selected ?? null}
          onSelect={(value) => updateResponse({ selected: value })}
          submitted={Boolean(response.submitted)}
          onSubmit={submitAnswer}
          checking={checking}
          checkError={checkError}
        />
      </div>

      <nav className="mt-8 flex items-center justify-between gap-3 border-t border-slate-200 pt-6" aria-label="Quiz navigation">
        <Button variant="secondary" onClick={() => goTo(index - 1)} disabled={index === 0} icon={ArrowLeft} iconPosition="left">
          Previous
        </Button>
        {isLast ? (
          <Button onClick={finishQuiz} disabled={answeredCount < total || finishing} icon={Flag}>
            {finishing ? 'Saving…' : 'Finish Quiz'}
          </Button>
        ) : (
          <Button onClick={() => goTo(index + 1)} disabled={!response.submitted} icon={ArrowRight}>
            Next
          </Button>
        )}
      </nav>
      {isLast && answeredCount < total && response.submitted && (
        <p className="mt-3 text-right text-sm text-slate-500">
          Answer every question to finish. {total - answeredCount} still unanswered; use Previous to go back.
        </p>
      )}
    </section>
  )
}

/** Shown when someone opens a category quiz directly, before they start. */
function QuizIntro({ category, record, canReview, onStart, onReview, savedTo }) {
  const Icon = ICONS[category.icon] ?? ClipboardList
  const count = getQuestionCount(category)

  return (
    <>
      <PageIntro word="Quiz">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <Link
            to="/quiz"
            className="inline-flex items-center gap-1.5 rounded text-sm font-semibold text-slate-500 transition-colors hover:text-navy-900"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to Categories
          </Link>
          <div className="mt-6 flex items-start gap-4">
            <span className="keep-palette grid size-14 shrink-0 place-items-center rounded-md bg-navy-900 text-cyan-300">
              <Icon className="size-7" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">Category quiz</p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{category.title}</h1>
            </div>
          </div>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">{category.description}</p>
        </div>
      </PageIntro>

      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Card padding="lg">
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-md bg-paper p-4">
              <dt className="text-xs font-medium text-slate-500">Questions</dt>
              <dd className="mt-1 font-display text-2xl font-bold text-navy-900">{count}</dd>
            </div>
            <div className="rounded-md bg-paper p-4">
              <dt className="text-xs font-medium text-slate-500">Difficulty</dt>
              <dd className="mt-2">
                <Badge tone={difficultyTone[category.difficulty]}>{category.difficulty}</Badge>
              </dd>
            </div>
            <div className="rounded-md bg-paper p-4">
              <dt className="text-xs font-medium text-slate-500">Best score</dt>
              <dd className="mt-1 font-display text-2xl font-bold text-navy-900">{record?.best ? `${record.best.percent}%` : '—'}</dd>
            </div>
            <div className="rounded-md bg-paper p-4">
              <dt className="text-xs font-medium text-slate-500">Attempts</dt>
              <dd className="mt-1 font-display text-2xl font-bold text-navy-900">{record?.attempts ?? 0}</dd>
            </div>
          </dl>

          {category.topics && (
            <>
              <h2 className="mt-8 text-lg font-bold">What this quiz covers</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {category.topics.map((topic) => (
                  <span key={topic} className="rounded-full border border-slate-200 bg-paper px-3 py-1 text-xs font-medium text-slate-600">
                    {topic}
                  </span>
                ))}
              </div>
            </>
          )}

          {category.notice && (
            <p className="mt-6 flex gap-3 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden="true" />
              <span>{category.notice}</span>
            </p>
          )}

          {record?.latest && (
            <p className="mt-6 flex items-center gap-2 rounded-md bg-navy-50 p-4 text-sm text-navy-800">
              <Trophy className="size-4 shrink-0 text-navy-600" aria-hidden="true" />
              <span>
                Latest score: <strong>{record.latest.percent}%</strong> ({record.latest.score}/{record.latest.total}) on{' '}
                {formatDate(record.latest.date)}
              </span>
            </p>
          )}

          <p className="mt-6 text-sm text-slate-600">
            One question at a time, with instant feedback and an explanation after each answer.{' '}
            {savedTo === 'account' ? 'Your scores are saved to your account.' : 'Progress is saved in this browser.'}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button size="lg" onClick={onStart} icon={record?.attempts ? RotateCcw : Play} iconPosition="left">
              {record?.attempts ? 'Start a new attempt' : 'Start Quiz'}
            </Button>
            {canReview && (
              <Button size="lg" variant="secondary" onClick={onReview} icon={Award} iconPosition="left">
                Review last results
              </Button>
            )}
            <Button size="lg" variant="secondary" to="/quiz" icon={LayoutGrid} iconPosition="left">
              Back to Categories
            </Button>
          </div>
        </Card>
      </section>
    </>
  )
}
