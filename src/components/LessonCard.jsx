import { Link } from 'react-router-dom'
import { ArrowRight, Bot, CircleCheck, Clock, Globe, Image, Info, Newspaper, Scale, Search, Share2 } from 'lucide-react'
import Badge, { difficultyTone } from './Badge'

// Maps the `icon` names used in src/data/lessons.js to Lucide icons.
export const ICONS = {
  info: Info,
  scale: Scale,
  globe: Globe,
  newspaper: Newspaper,
  image: Image,
  bot: Bot,
  search: Search,
  share: Share2,
}

export default function LessonCard({ lesson, completed = false, score }) {
  const Icon = ICONS[lesson.icon] ?? Info

  return (
    <Link
      to={`/learn/${lesson.id}`}
      className="group flex h-full flex-col rounded-md border border-slate-200/80 bg-white p-6 transition duration-200 hover:-translate-y-0.5 hover:border-navy-300"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-11 place-items-center rounded-md bg-navy-50 text-navy-700 transition-colors group-hover:bg-navy-900 group-hover:text-cyan-300">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        {completed ? (
          <Badge tone="green" icon={CircleCheck}>
            Completed{typeof score === 'number' ? ` · ${score}%` : ''}
          </Badge>
        ) : (
          <span className="font-display text-sm font-bold text-slate-300">
            {String(lesson.number).padStart(2, '0')}
          </span>
        )}
      </div>

      <h3 className="mt-5 text-lg font-bold leading-snug">{lesson.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{lesson.description}</p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Badge tone={difficultyTone[lesson.difficulty]}>{lesson.difficulty}</Badge>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
          <Clock className="size-3.5" aria-hidden="true" />
          {lesson.readingTime} min read
        </span>
      </div>

      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-800">
        {completed ? 'Review lesson' : 'Start lesson'}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
    </Link>
  )
}
