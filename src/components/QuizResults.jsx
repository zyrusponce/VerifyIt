import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  ChartColumn,
  CircleCheck,
  CircleX,
  ExternalLink,
  LayoutGrid,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import Badge from './Badge'
import Button from './Button'
import Card from './Card'
import ProgressBar from './ProgressBar'
import SaveStatus from './SaveStatus'
import { lessons } from '../data/lessons'
import { categoryTitle, topicCategories } from '../data/quizCategories'
import { scoreMessage } from '../utils/quiz'

/** Lessons that match this category, or the weakest topics of a Mixed Challenge attempt. */
function suggestedLessons(category, result) {
  let lessonIds = category.relatedLessonIds
  if (category.isMixed) {
    lessonIds = topicCategories
      .map((topic) => ({ topic, stat: result.byCategory?.[topic.id] }))
      .filter(({ stat }) => stat && stat.correct < stat.total)
      .sort((a, b) => a.stat.correct / a.stat.total - b.stat.correct / b.stat.total)
      .flatMap(({ topic }) => topic.relatedLessonIds)
  }
  return [...new Set(lessonIds)]
    .map((id) => lessons.find((lesson) => lesson.id === id))
    .filter(Boolean)
    .slice(0, 3)
}

/** Final screen for one category quiz attempt. */
export default function QuizResults({ category, result, questions, responses, record, isNewBest, onRetry, saveState, saveError, onRetrySave }) {
  const incorrect = result.total - result.score
  const best = record?.best
  const lessonsToTry = suggestedLessons(category, result)

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="keep-palette relative overflow-hidden rounded-lg bg-navy-900 p-6 text-white sm:p-10">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(34,211,238,0.2),transparent_45%)]"
          aria-hidden="true"
        />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Quiz complete · {category.title}</p>
          <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
                {result.score}
                <span className="text-2xl text-navy-300 sm:text-3xl">/{result.total}</span>
              </h1>
              <p className="mt-3 max-w-md text-lg text-navy-100">{scoreMessage(result.percent)}</p>
              <SaveStatus state={saveState} error={saveError ? { message: saveError } : null} onRetry={onRetrySave} light className="mt-3 max-w-md" />
              {isNewBest && record?.attempts > 1 && (
                <Badge tone="cyan" icon={Sparkles} className="mt-3">
                  New best score for this category
                </Badge>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:flex sm:gap-6">
              <div>
                <dt className="text-xs text-navy-300">Score</dt>
                <dd className="font-display text-2xl font-bold">{result.percent}%</dd>
              </div>
              <div>
                <dt className="text-xs text-navy-300">Correct</dt>
                <dd className="font-display text-2xl font-bold text-emerald-300">{result.score}</dd>
              </div>
              <div>
                <dt className="text-xs text-navy-300">Incorrect</dt>
                <dd className="font-display text-2xl font-bold text-rose-300">{incorrect}</dd>
              </div>
              {best && (
                <div>
                  <dt className="text-xs text-navy-300">Best score</dt>
                  <dd className="font-display text-2xl font-bold">{best.percent}%</dd>
                </div>
              )}
            </dl>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button variant="accent" onClick={onRetry} icon={RotateCcw} iconPosition="left">
              Retry This Category
            </Button>
            <Button variant="outlineLight" to="/quiz" icon={LayoutGrid} iconPosition="left">
              Explore Another Category
            </Button>
            <Button variant="outlineLight" to="/results" icon={ChartColumn} iconPosition="left">
              View my progress
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-8">
        {category.isMixed ? (
          <Card padding="lg">
            <h2 className="text-xl font-bold">Performance by topic</h2>
            <ul className="mt-6 space-y-5">
              {topicCategories.map((topic) => {
                const stat = result.byCategory?.[topic.id]
                if (!stat) return null
                const percent = Math.round((stat.correct / stat.total) * 100)
                return (
                  <li key={topic.id}>
                    <ProgressBar
                      value={stat.correct}
                      max={stat.total}
                      label={topic.title}
                      showValue
                      valueText={`${stat.correct}/${stat.total}`}
                      tone={percent >= 75 ? 'green' : percent >= 50 ? 'cyan' : 'amber'}
                    />
                  </li>
                )
              })}
            </ul>
          </Card>
        ) : (
          <Card padding="lg">
            <h2 className="text-xl font-bold">This attempt</h2>
            <ProgressBar
              value={result.score}
              max={result.total}
              label={`${result.score} of ${result.total} correct`}
              showValue
              valueText={`${result.percent}%`}
              tone={result.percent >= 75 ? 'green' : result.percent >= 50 ? 'cyan' : 'amber'}
              className="mt-6"
            />
            <p className="mt-5 text-sm leading-relaxed text-slate-600">
              {record?.attempts ?? 1} attempt{(record?.attempts ?? 1) === 1 ? '' : 's'} so far.
              {best && ` Your best score in this category is ${best.score}/${best.total} (${best.percent}%).`}
            </p>
            {category.topics && (
              <div className="mt-5 flex flex-wrap gap-2">
                {category.topics.map((topic) => (
                  <span key={topic} className="rounded-full border border-slate-200 bg-paper px-3 py-1 text-xs font-medium text-slate-600">
                    {topic}
                  </span>
                ))}
              </div>
            )}
          </Card>
        )}

      </div>

      <Card padding="lg" className="mt-6">
        <h2 className="text-xl font-bold">Suggested learning resources</h2>
        <p className="mt-1 text-sm text-slate-600">Keep building your skills in {category.isMixed ? 'the topics you missed' : 'this topic'}.</p>
        <div className="mt-5 grid gap-6 md:grid-cols-2">
          {lessonsToTry.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 font-sans text-sm font-bold text-navy-900">
                <BookOpen className="size-4 text-cyan-600" aria-hidden="true" />
                VerifyIT lessons
              </h3>
              <ul className="mt-3 space-y-2">
                {lessonsToTry.map((lesson) => (
                  <li key={lesson.id}>
                    <Link
                      to={`/learn/${lesson.id}`}
                      className="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-3.5 text-sm font-semibold text-navy-900 transition-colors hover:border-navy-300 hover:bg-paper"
                    >
                      {lesson.title}
                      <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {category.resources?.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 font-sans text-sm font-bold text-navy-900">
                <ExternalLink className="size-4 text-cyan-600" aria-hidden="true" />
                External resources
              </h3>
              <ul className="mt-3 space-y-2">
                {category.resources.map((resource) => (
                  <li key={resource.url}>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-3.5 text-sm font-semibold text-navy-900 transition-colors hover:border-navy-300 hover:bg-paper"
                    >
                      {resource.label}
                      <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>

      <Card padding="lg" className="mt-6">
        <h2 className="text-xl font-bold">Review your answers</h2>
        <p className="mt-1 text-sm text-slate-600">Each question with the correct answer and an explanation.</p>
        <ol className="mt-5 divide-y divide-slate-100">
          {questions.map((q, i) => {
            const r = responses[q.id]
            const correct = r?.selected === q.answer
            return (
              <li key={q.id} className="flex gap-3 py-5">
                {correct ? (
                  <CircleCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-label="Correct" role="img" />
                ) : (
                  <CircleX className="mt-0.5 size-5 shrink-0 text-rose-600" aria-label="Incorrect" role="img" />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-500">
                    Question {i + 1}
                    {category.isMixed && ` · ${categoryTitle[q.categoryId]}`}
                  </p>
                  <p className="mt-0.5 font-semibold text-navy-900">{q.prompt}</p>
                  <p className="mt-1.5 text-sm text-slate-600">
                    Your answer:{' '}
                    <span className={correct ? 'font-medium text-emerald-800' : 'font-medium text-rose-800'}>
                      {r?.selected !== undefined && r?.selected !== null ? q.options[r.selected] : 'No answer'}
                    </span>
                    {!correct && (
                      <>
                        {' · '}Correct: <span className="font-medium text-emerald-800">{q.options[q.answer]}</span>
                      </>
                    )}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">{q.explanation}</p>
                  {q.credits?.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {q.credits.map((credit) => (
                        <li key={credit.url}>
                          <a
                            href={credit.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-navy-700 underline decoration-navy-200 underline-offset-4 hover:text-navy-900"
                          >
                            {credit.label}
                            <span className="sr-only"> (opens in a new tab)</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </Card>
    </section>
  )
}

