import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Award,
  BookOpen,
  ChartColumn,
  CircleCheck,
  CircleDot,
  CloudCheck,
  FlaskConical,
  HardDrive,
  History,
  LoaderCircle,
  Target,
  Trash2,
  TrendingUp,
  Trophy,
} from 'lucide-react'
import Alert from '../components/Alert'
import Button from '../components/Button'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import ProgressBar from '../components/ProgressBar'
import StatCard from '../components/StatCard'
import useAuth from '../hooks/useAuth'
import useProgress from '../hooks/useProgress'
import { lessons } from '../data/lessons'
import { investigations, assessmentOptions } from '../data/investigations'
import { formatDate } from '../utils/progress'

const verdictLabel = Object.fromEntries(assessmentOptions.map((option) => [option.id, option.label]))

function StorageNote({ mode }) {
  const { user, isConfigured } = useAuth()
  if (mode === 'account') {
    return (
      <p className="flex items-start gap-2 text-sm leading-relaxed text-slate-600">
        <CloudCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
        <span>
          Your progress is saved to your account{user?.email ? ` (${user.email})` : ''}, so it follows you to any device. Scores and
          investigation results are checked by the VerifyIT server.
        </span>
      </p>
    )
  }
  return (
    <p className="flex items-start gap-2 text-sm leading-relaxed text-slate-600">
      <HardDrive className="mt-0.5 size-4 shrink-0 text-navy-600" aria-hidden="true" />
      <span>
        No account or registration is required. Guest progress is stored only in this browser&apos;s local storage and does not sync
        across devices; clearing your browser data or switching devices will start you fresh.
        {isConfigured && (
          <>
            {' '}
            <Link to="/login?next=/results" className="font-semibold text-navy-800 underline underline-offset-2">
              Sign in
            </Link>{' '}
            to save it to your account.
          </>
        )}
      </span>
    </p>
  )
}

/** Extra statistics that only the server can provide: certificate status and saved history. */
function AccountInsights({ dashboard }) {
  const { quizzes, investigations: cases, certificate } = dashboard
  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-col rounded-md border border-slate-200/80 bg-white p-6 sm:p-8">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
            <Award className="size-4" aria-hidden="true" />
            Certificate
          </p>
          {certificate.existingCertificate ? (
            <>
              <h2 className="mt-3 text-xl font-bold">Certificate issued</h2>
              <p className="mt-1 text-sm text-slate-600">
                {certificate.existingCertificate.certificateNumber} · {formatDate(certificate.existingCertificate.issuedAt)}
              </p>
            </>
          ) : (
            <>
              <h2 className="mt-3 text-xl font-bold">{certificate.eligible ? 'Eligible to claim' : 'Not yet eligible'}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {certificate.completedLessons}/{certificate.requiredLessons} lessons · {certificate.completedCases}/{certificate.requiredCases} cases
              </p>
            </>
          )}
          <Button to="/certificate" variant="secondary" className="mt-5 self-start" icon={ArrowRight}>
            {certificate.existingCertificate ? 'View certificate' : 'Certificate details'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card padding="lg">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <History className="size-5 text-cyan-600" aria-hidden="true" />
            Recent quiz attempts
          </h2>
          {quizzes.latestAttempts.length ? (
            <ul className="mt-4 divide-y divide-slate-100">
              {quizzes.latestAttempts.map((attempt) => (
                <li key={attempt.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="min-w-0">
                    <span className="block font-medium text-slate-700">{attempt.categoryTitle}</span>
                    <span className="text-xs text-slate-500">{formatDate(attempt.completedAt)}</span>
                  </span>
                  <span className="shrink-0 font-semibold text-navy-900">
                    {attempt.score}/{attempt.totalQuestions} ({attempt.percent}%)
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-600">No quiz attempts saved yet.</p>
          )}
          <p className="mt-3 text-xs text-slate-500">{quizzes.totalAttempts} attempt{quizzes.totalAttempts === 1 ? '' : 's'} saved in total.</p>
        </Card>
        <Card padding="lg">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <History className="size-5 text-cyan-600" aria-hidden="true" />
            Investigation history
          </h2>
          {cases.history.length ? (
            <ul className="mt-4 divide-y divide-slate-100">
              {cases.history.map((attempt) => (
                <li key={attempt.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="min-w-0">
                    <span className="block font-medium text-slate-700">{attempt.caseTitle}</span>
                    <span className="text-xs text-slate-500">
                      {verdictLabel[attempt.selectedVerdict] ?? attempt.selectedVerdict} · {formatDate(attempt.submittedAt)}
                    </span>
                  </span>
                  <span className={`shrink-0 text-xs font-semibold ${attempt.isCorrect ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {attempt.isCorrect ? 'Matched' : 'Differed'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-600">No investigations submitted yet.</p>
          )}
        </Card>
      </div>
    </div>
  )
}

export default function Results() {
  const { lessonProgress, caseProgress, summary, mode, accountStatus, accountError, refresh, dashboard, guest } = useProgress()
  const [confirmReset, setConfirmReset] = useState(false)

  if (mode === 'account' && accountStatus !== 'ready') {
    return (
      <>
        <PageHeader watermark="Progress"
          eyebrow="My Progress"
          icon={ChartColumn}
          title="Your learning progress"
          description="See your quiz scores, completed lessons and investigations, and where to focus next."
        />
        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          {accountStatus === 'error' ? (
            <Alert tone="error" title="Your saved progress could not be loaded" action={<Button size="sm" variant="secondary" onClick={refresh}>Try again</Button>}>
              {accountError?.message}
            </Alert>
          ) : (
            <p role="status" className="flex items-center justify-center gap-2 text-slate-600">
              <LoaderCircle className="size-5 motion-safe:animate-spin" aria-hidden="true" />
              Loading your saved progress…
            </p>
          )}
        </section>
      </>
    )
  }

  return (
    <>
      <PageHeader watermark="Progress"
        eyebrow="My Progress"
        icon={ChartColumn}
        title="Your learning progress"
        description="See your quiz scores, completed lessons and investigations, and where to focus next."
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        {!summary.hasAnyProgress ? (
          <div className="space-y-6">
            <EmptyState
              icon={TrendingUp}
              title="No progress yet"
              description="Your dashboard fills in as you learn. Complete a lesson's knowledge check, solve an investigation case, or finish the quiz to see your results here."
            >
              <Button to="/learn" icon={BookOpen} iconPosition="left">
                Start a lesson
              </Button>
              <Button to="/lab" variant="secondary" icon={FlaskConical} iconPosition="left">
                Try an investigation
              </Button>
              <Button to="/quiz" variant="secondary" icon={Award} iconPosition="left">
                Take the quiz
              </Button>
            </EmptyState>
            <div className="mx-auto max-w-2xl">
              <StorageNote mode={mode} />
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={Award}
                label="Latest quiz score"
                value={summary.latestQuiz ? `${summary.latestQuiz.percent}%` : '—'}
                detail={
                  summary.latestQuiz
                    ? `${summary.latestQuiz.categoryTitle} · ${summary.latestQuiz.score}/${summary.latestQuiz.total} on ${formatDate(summary.latestQuiz.date)}`
                    : 'Quiz not taken yet'
                }
              />
              <StatCard
                icon={Trophy}
                label="Best quiz score"
                value={summary.bestQuiz ? `${summary.bestQuiz.percent}%` : '—'}
                detail={summary.quizAttempts ? `${summary.quizAttempts} attempt${summary.quizAttempts === 1 ? '' : 's'}` : 'No attempts yet'}
              />
              <StatCard
                icon={BookOpen}
                label="Lessons completed"
                value={`${summary.completedLessonIds.length}/${summary.lessonCount}`}
                progress={{ value: summary.completedLessonIds.length, max: summary.lessonCount, label: 'Lessons completed' }}
              />
              <StatCard
                icon={FlaskConical}
                label="Cases completed"
                value={`${summary.completedCaseIds.length}/${summary.caseCount}`}
                progress={{ value: summary.completedCaseIds.length, max: summary.caseCount, label: 'Cases completed' }}
                tone="navy"
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card padding="lg" className="lg:col-span-2">
                <h2 className="text-xl font-bold">Quiz category performance</h2>
                {summary.latestQuiz ? (
                  <>
                    <p className="mt-1 text-sm text-slate-600">Your best score in each topic quiz.</p>
                    <ul className="mt-6 grid gap-5 sm:grid-cols-2">
                      {summary.categoryStats.map((category) => (
                        <li key={category.id}>
                          <ProgressBar
                            value={category.correct}
                            max={category.total || 1}
                            label={category.label}
                            showValue
                            valueText={category.percent === null ? "Not attempted" : `${category.percent}%`}
                            tone={category.percent >= 75 ? 'green' : category.percent >= 50 ? 'cyan' : 'amber'}
                          />
                        </li>
                      ))}
                    </ul>
                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-md bg-emerald-50 p-5">
                        <h3 className="font-sans text-sm font-bold text-emerald-900">Category strengths</h3>
                        {summary.strengths.length ? (
                          <ul className="mt-2 space-y-1 text-sm text-emerald-900">
                            {summary.strengths.map((c) => (
                              <li key={c.id}>{c.label}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-sm text-emerald-900">Score 75% or higher in a category to see it here.</p>
                        )}
                      </div>
                      <div className="rounded-md bg-amber-50 p-5">
                        <h3 className="font-sans text-sm font-bold text-amber-900">Areas for improvement</h3>
                        {summary.improvements.length ? (
                          <ul className="mt-2 space-y-1 text-sm text-amber-900">
                            {summary.improvements.map((c) => (
                              <li key={c.id}>{c.label}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-sm text-amber-900">None right now. Great work!</p>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="mt-4 rounded-md border border-dashed border-slate-300 bg-paper p-6 text-center">
                    <p className="text-sm text-slate-600">Finish a category quiz to see your strengths and areas for improvement.</p>
                    <Button to="/quiz" size="sm" className="mt-4" icon={ArrowRight}>
                      Take the quiz
                    </Button>
                  </div>
                )}
              </Card>

              <div className="keep-palette flex flex-col rounded-md bg-navy-900 p-6 text-white sm:p-8">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                  <Target className="size-4" aria-hidden="true" />
                  Suggested next lesson
                </p>
                {summary.suggestedLesson ? (
                  <>
                    <h2 className="mt-4 text-2xl font-bold text-white">{summary.suggestedLesson.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-navy-100">{summary.suggestedLesson.description}</p>
                    <Button to={`/learn/${summary.suggestedLesson.id}`} variant="accent" className="mt-6 self-start" icon={ArrowRight}>
                      Start lesson
                    </Button>
                  </>
                ) : (
                  <>
                    <h2 className="mt-4 text-2xl font-bold text-white">All lessons complete</h2>
                    <p className="mt-2 text-sm leading-relaxed text-navy-100">
                      You have finished every lesson. Keep practicing with the Investigation Lab and the quiz.
                    </p>
                    <Button to="/lab" variant="accent" className="mt-6 self-start" icon={ArrowRight}>
                      Open the Lab
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card padding="lg">
                <h2 className="text-xl font-bold">Lessons</h2>
                <ul className="mt-4 divide-y divide-slate-100">
                  {lessons.map((lesson) => {
                    const record = lessonProgress[lesson.id]
                    return (
                      <li key={lesson.id}>
                        <Link to={`/learn/${lesson.id}`} className="flex items-center gap-3 rounded-md py-3 hover:text-navy-900">
                          {record?.completed ? (
                            <CircleCheck className="size-5 shrink-0 text-emerald-600" aria-label="Completed" role="img" />
                          ) : (
                            <CircleDot className="size-5 shrink-0 text-slate-300" aria-label="Not completed" role="img" />
                          )}
                          <span className="flex-1 text-sm font-medium text-slate-700">{lesson.title}</span>
                          {record?.completed && Number.isFinite(record.score) && (
                            <span className="text-xs font-semibold text-slate-500">{record.score}%</span>
                          )}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </Card>

              <Card padding="lg">
                <h2 className="text-xl font-bold">Investigation cases</h2>
                <ul className="mt-4 divide-y divide-slate-100">
                  {investigations.map((item) => {
                    const record = caseProgress[item.id]
                    return (
                      <li key={item.id}>
                        <Link to={`/lab/${item.id}`} className="flex items-center gap-3 rounded-md py-3 hover:text-navy-900">
                          {record?.completed ? (
                            <CircleCheck
                              className={`size-5 shrink-0 ${record.correct ? 'text-emerald-600' : 'text-amber-500'}`}
                              aria-label={record.correct ? 'Solved' : 'Completed, assessment differed'}
                              role="img"
                            />
                          ) : (
                            <CircleDot className="size-5 shrink-0 text-slate-300" aria-label="Not started" role="img" />
                          )}
                          <span className="flex-1 text-sm font-medium text-slate-700">{item.title}</span>
                          {record?.completed && (
                            <span className={`text-xs font-semibold ${record.correct ? 'text-emerald-700' : 'text-amber-700'}`}>
                              {record.correct ? 'Solved' : 'Try again'}
                            </span>
                          )}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </Card>
            </div>

            {mode === 'account' && dashboard && <AccountInsights dashboard={dashboard} />}

            <Card padding="lg" className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <StorageNote mode={mode} />
                {mode === 'account' && guest.hasData && (
                  <p className="mt-2 text-sm text-slate-600">
                    This browser also holds guest progress. Manage it on your{' '}
                    <Link to="/account" className="font-semibold text-navy-800 underline underline-offset-2">
                      account page
                    </Link>
                    .
                  </p>
                )}
              </div>
              {mode === 'account' ? null : confirmReset ? (
                <div className="flex flex-col gap-2 sm:flex-row" role="group" aria-label="Confirm reset">
                  <Button
                    variant="danger"
                    onClick={() => {
                      guest.reset()
                      setConfirmReset(false)
                    }}
                    icon={Trash2}
                    iconPosition="left"
                  >
                    Yes, reset everything
                  </Button>
                  <Button variant="secondary" onClick={() => setConfirmReset(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button variant="secondary" onClick={() => setConfirmReset(true)} icon={Trash2} iconPosition="left" className="shrink-0">
                  Reset all progress
                </Button>
              )}
            </Card>
          </div>
        )}
      </section>
    </>
  )
}
