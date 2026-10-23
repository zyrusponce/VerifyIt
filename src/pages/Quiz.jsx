import { Award, ChartColumn, CircleCheck, ListChecks, Target, Trophy } from 'lucide-react'
import Button from '../components/Button'
import PageIntro from '../components/PageIntro'
import ProgressBar from '../components/ProgressBar'
import QuizCategoryGrid from '../components/QuizCategoryGrid'
import StatCard from '../components/StatCard'
import useProgress from '../hooks/useProgress'
import { allQuestions, quizCategories, topicCategories } from '../data/quizCategories'
import { formatDate } from '../utils/progress'

/** /quiz — choose a category quiz. */
export default function Quiz() {
  const { quizRecords, summary, userId, mode } = useProgress()
  const { quiz } = summary

  return (
    <>
      <PageIntro word="Quiz">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
                <Target className="size-4" aria-hidden="true" />
                Quiz
              </p>
              <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">Choose Your Challenge</h1>
              <p className="mt-4 text-lg leading-relaxed text-slate-600">
                Test your digital literacy skills, one topic at a time.
              </p>
            </div>
            <dl className="flex gap-6 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Topic quizzes</dt>
                <dd className="font-display text-2xl font-extrabold text-navy-900">{topicCategories.length}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Questions</dt>
                <dd className="font-display text-2xl font-extrabold text-navy-900">{allQuestions.length}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Completed</dt>
                <dd className="font-display text-2xl font-extrabold text-navy-900">
                  {quiz.completedCount}/{quiz.categoryCount}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </PageIntro>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <QuizCategoryGrid categories={quizCategories} records={quizRecords ?? {}} ownerId={userId} />
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Your overall progress</h2>
              <p className="mt-1 text-sm text-slate-600">
                Scores are saved separately for each category {mode === 'account' ? 'in your account' : 'in this browser'}.
              </p>
            </div>
            <Button to="/results" variant="secondary" icon={ChartColumn} iconPosition="left" className="self-start">
              Full progress dashboard
            </Button>
          </div>

          {quiz.completedCount === 0 ? (
            <p className="mt-6 rounded-md border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">
              Finish any category quiz to see your progress across topics here.
            </p>
          ) : (
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <div className="grid gap-5 sm:grid-cols-2 lg:col-span-1 lg:grid-cols-1">
                <StatCard
                  icon={CircleCheck}
                  label="Categories completed"
                  value={`${quiz.completedCount}/${quiz.categoryCount}`}
                  detail={`${quiz.masteredCount} mastered (80% or higher)`}
                  progress={{ value: quiz.completedCount, max: quiz.categoryCount, label: 'Categories completed' }}
                />
                <StatCard
                  icon={Award}
                  label="Average best score"
                  value={`${quiz.averageBest}%`}
                  detail={`${quiz.totalAttempts} attempt${quiz.totalAttempts === 1 ? '' : 's'} in total`}
                />
                {quiz.latest && (
                  <StatCard
                    icon={ListChecks}
                    label="Latest attempt"
                    value={`${quiz.latest.percent}%`}
                    detail={`${quiz.latest.categoryTitle} · ${formatDate(quiz.latest.date)}`}
                  />
                )}
              </div>

              <div className="rounded-md border border-slate-200/80 bg-white p-6 sm:p-8 lg:col-span-2">
                <h3 className="flex items-center gap-2 text-lg font-bold">
                  <Trophy className="size-5 text-cyan-600" aria-hidden="true" />
                  Best score by category
                </h3>
                <ul className="mt-6 space-y-5">
                  {quizCategories.map((category) => {
                    const best = quizRecords?.[category.id]?.best
                    return (
                      <li key={category.id}>
                        <ProgressBar
                          value={best?.percent ?? 0}
                          max={100}
                          label={category.title}
                          showValue
                          valueText={best ? `${best.percent}% (${best.score}/${best.total})` : 'Not attempted'}
                          tone={!best ? 'navy' : best.percent >= 75 ? 'green' : best.percent >= 50 ? 'cyan' : 'amber'}
                        />
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
