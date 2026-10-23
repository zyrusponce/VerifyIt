import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CircleCheck, Clock, Key, Lightbulb } from 'lucide-react'
import Badge, { difficultyTone } from '../components/Badge'
import Button from '../components/Button'
import PageIntro from '../components/PageIntro'
import FictionalNotice from '../components/FictionalNotice'
import KnowledgeCheck from '../components/KnowledgeCheck'
import { ICONS } from '../components/LessonCard'
import useProgress from '../hooks/useProgress'
import { getLessonById, lessons } from '../data/lessons'

export default function LessonDetail() {
  const { lessonId } = useParams()
  const lesson = getLessonById(lessonId)
  const { lessonProgress, completeLesson, mode, outbox } = useProgress()
  // Where the latest knowledge check result was saved (browser, account, pending, failed).
  const [saveStatus, setSaveStatus] = useState(null)

  useEffect(() => {
    setSaveStatus(null)
  }, [lessonId])

  if (!lesson) {
    return (
      <section className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-3xl font-extrabold">Lesson not found</h1>
        <p className="mt-3 text-slate-600">This lesson does not exist or may have been renamed.</p>
        <Button to="/learn" icon={ArrowLeft} iconPosition="left" className="mt-8">
          Back to all lessons
        </Button>
      </section>
    )
  }

  const index = lessons.findIndex((item) => item.id === lesson.id)
  const previous = lessons[index - 1]
  const next = lessons[index + 1]
  const saved = lessonProgress[lesson.id]
  const Icon = ICONS[lesson.icon]

  async function handleComplete(correct, total) {
    if (mode === 'account') setSaveStatus({ state: 'saving' })
    setSaveStatus(await completeLesson(lesson.id, { correct, total }))
  }

  async function handleRetrySave() {
    setSaveStatus({ state: 'saving' })
    const result = await outbox.retry()
    setSaveStatus(result && result.remaining === 0 && result.failed === 0 ? { state: 'account' } : { state: 'pending', error: result?.error })
  }

  return (
    <article>
      <PageIntro as="header" word="Lesson">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <Link
            to="/learn"
            className="inline-flex items-center gap-1.5 rounded text-sm font-semibold text-navy-700 hover:text-navy-900"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            All lessons
          </Link>
          <div className="mt-8 flex items-center gap-3">
            <span className="keep-palette grid size-12 place-items-center rounded-md bg-navy-900 text-cyan-300">
              {Icon && <Icon className="size-6" aria-hidden="true" />}
            </span>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
              Lesson {lesson.number} of {lessons.length}
            </p>
          </div>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl">{lesson.title}</h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">{lesson.description}</p>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Badge tone={difficultyTone[lesson.difficulty]}>{lesson.difficulty}</Badge>
            <Badge tone="slate" icon={Clock}>
              {lesson.readingTime} min read
            </Badge>
            {saved?.completed && (
              <Badge tone="green" icon={CircleCheck}>
                Completed
              </Badge>
            )}
          </div>
        </div>
      </PageIntro>

      <div className="mx-auto max-w-4xl space-y-12 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="space-y-10">
          {lesson.content.map((section) => (
            <section key={section.heading}>
              <h2 className="text-2xl font-bold tracking-tight">{section.heading}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph.slice(0, 40)} className="mt-4 text-[17px] leading-relaxed text-slate-700">
                  {paragraph}
                </p>
              ))}
              {section.points && (
                <ul className="mt-5 space-y-3">
                  {section.points.map((point) => (
                    <li key={point} className="flex gap-3 text-[17px] leading-relaxed text-slate-700">
                      <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-cyan-500" aria-hidden="true" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <section aria-labelledby="example-title" className="rounded-lg border border-amber-200 bg-amber-50/50 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-800">
              <Lightbulb className="size-4" aria-hidden="true" />
              Practical example
            </p>
            <FictionalNotice />
          </div>
          <h2 id="example-title" className="mt-3 text-2xl font-bold">
            {lesson.example.title}
          </h2>
          <p className="mt-3 rounded-md bg-white p-4 leading-relaxed text-slate-700 ring-1 ring-amber-200">
            {lesson.example.scenario}
          </p>
          <h3 className="mt-6 font-sans text-sm font-bold text-navy-900">How to analyze it</h3>
          <ol className="mt-3 space-y-3">
            {lesson.example.analysis.map((point, i) => (
              <li key={point} className="flex gap-3 leading-relaxed text-slate-700">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-amber-200 text-xs font-bold text-amber-900">
                  {i + 1}
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="takeaways-title" className="keep-palette rounded-lg bg-navy-900 p-6 text-white sm:p-8">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
            <Key className="size-4" aria-hidden="true" />
            Key takeaways
          </p>
          <h2 id="takeaways-title" className="sr-only">
            Key takeaways
          </h2>
          <ul className="mt-5 space-y-4">
            {lesson.takeaways.map((takeaway) => (
              <li key={takeaway} className="flex gap-3 leading-relaxed text-navy-50">
                <CircleCheck className="mt-0.5 size-5 shrink-0 text-cyan-300" aria-hidden="true" />
                <span>{takeaway}</span>
              </li>
            ))}
          </ul>
        </section>

        <KnowledgeCheck
          key={lesson.id}
          questions={lesson.knowledgeCheck}
          onComplete={handleComplete}
          previousResult={saved?.completed && Number.isInteger(saved.total) ? saved : null}
          saveStatus={saveStatus}
          onRetrySave={handleRetrySave}
        />

        <nav aria-label="Lesson navigation" className="grid gap-3 border-t border-slate-200 pt-8 sm:grid-cols-2">
          {previous ? (
            <Link
              to={`/learn/${previous.id}`}
              className="group rounded-md border border-slate-200 p-5 transition-colors hover:border-navy-300 hover:bg-paper"
            >
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <ArrowLeft className="size-3.5" aria-hidden="true" /> Previous lesson
              </span>
              <span className="mt-1 block font-semibold text-navy-900">{previous.title}</span>
            </Link>
          ) : (
            <Link
              to="/learn"
              className="rounded-md border border-slate-200 p-5 transition-colors hover:border-navy-300 hover:bg-paper"
            >
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <ArrowLeft className="size-3.5" aria-hidden="true" /> Back
              </span>
              <span className="mt-1 block font-semibold text-navy-900">All lessons</span>
            </Link>
          )}
          {next ? (
            <Link
              to={`/learn/${next.id}`}
              className="rounded-md border border-slate-200 p-5 text-right transition-colors hover:border-navy-300 hover:bg-paper"
            >
              <span className="flex items-center justify-end gap-1.5 text-xs font-semibold text-slate-500">
                Next lesson <ArrowRight className="size-3.5" aria-hidden="true" />
              </span>
              <span className="mt-1 block font-semibold text-navy-900">{next.title}</span>
            </Link>
          ) : (
            <Link
              to="/lab"
              className="rounded-md border border-slate-200 p-5 text-right transition-colors hover:border-navy-300 hover:bg-paper"
            >
              <span className="flex items-center justify-end gap-1.5 text-xs font-semibold text-slate-500">
                Put it into practice <ArrowRight className="size-3.5" aria-hidden="true" />
              </span>
              <span className="mt-1 block font-semibold text-navy-900">Investigation Lab</span>
            </Link>
          )}
        </nav>
      </div>
    </article>
  )
}
