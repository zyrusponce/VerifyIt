import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import LessonCard from '../components/LessonCard'
import PageHeader from '../components/PageHeader'
import ProgressBar from '../components/ProgressBar'
import useProgress from '../hooks/useProgress'
import { lessons } from '../data/lessons'

const filters = ['All', 'Beginner', 'Intermediate', 'Advanced']

export default function Learn() {
  const [filter, setFilter] = useState('All')
  const { lessonProgress, summary } = useProgress()
  const completed = summary.completedLessonIds.length

  const visibleLessons = filter === 'All' ? lessons : lessons.filter((lesson) => lesson.difficulty === filter)

  return (
    <>
      <PageHeader watermark="Learn"
        eyebrow="Learn"
        icon={BookOpen}
        title="Build your verification skills."
        description="Eight short lessons cover how misinformation works and how to check it. Open any lesson, read at your own pace, and finish with a quick knowledge check."
      >
        <div className="w-full rounded-md border border-slate-200 bg-white p-5 lg:w-72">
          <ProgressBar
            value={completed}
            max={lessons.length}
            label="Your progress"
            showValue
            valueText={`${completed} of ${lessons.length} lessons`}
          />
        </div>
      </PageHeader>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter lessons by difficulty">
          {filters.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              aria-pressed={filter === option}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                filter === option
                  ? 'bg-navy-900 text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-navy-300 hover:text-navy-900'
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleLessons.map((lesson) => (
            <li key={lesson.id}>
              <LessonCard
                lesson={lesson}
                completed={Boolean(lessonProgress[lesson.id]?.completed)}
                score={lessonProgress[lesson.id]?.score}
              />
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
