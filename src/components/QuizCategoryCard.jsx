import { CircleCheck, CircleDashed, Clapperboard, Crop, FileSearch, Hourglass, ListOrdered, Megaphone, Play, RotateCcw, ScanEye, ShieldCheck, Shuffle, Trophy } from 'lucide-react'
import Badge, { difficultyTone } from './Badge'
import Button from './Button'
import { getQuestionCount } from '../data/quizCategories'
import { categoryStatus } from '../utils/progress'

// Maps the `icon` names used in src/data/quizCategories.js to Lucide icons.
export const ICONS = {
  scan: ScanEye,
  megaphone: Megaphone,
  shield: ShieldCheck,
  crop: Crop,
  clapperboard: Clapperboard,
  'file-search': FileSearch,
  shuffle: Shuffle,
}

const STATUS = {
  'not-started': { label: 'Not started', tone: 'slate', icon: CircleDashed },
  'in-progress': { label: 'In progress', tone: 'cyan', icon: Hourglass },
  completed: { label: 'Completed', tone: 'navy', icon: CircleCheck },
  mastered: { label: 'Mastered', tone: 'green', icon: Trophy },
}

/** Card for one quiz category on the "Choose Your Challenge" page. */
export default function QuizCategoryCard({ category, record, inProgress = false, featured = false, footnote }) {
  const Icon = ICONS[category.icon] ?? ScanEye
  const status = STATUS[categoryStatus(record, inProgress)]
  const count = getQuestionCount(category)
  const best = record?.best

  const startLabel = inProgress ? 'Resume Quiz' : 'Start Quiz'
  const startIcon = inProgress ? RotateCcw : Play

  if (featured) {
    return (
      <article className="keep-palette group relative overflow-hidden rounded-md bg-navy-900 p-6 text-white ring-1 ring-white/10 transition duration-200 hover:-translate-y-0.5 hover:bg-navy-800 sm:p-8">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_10%,rgba(34,211,238,0.22),transparent_45%)]"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-md bg-white/10 text-cyan-300 ring-1 ring-white/15 transition-colors group-hover:bg-cyan-400 group-hover:text-navy-950">
              <Icon className="size-6" aria-hidden="true" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-bold text-white sm:text-2xl">{category.title}</h3>
                <Badge tone={difficultyTone[category.difficulty]}>{category.difficulty}</Badge>
                <Badge tone={status.tone} icon={status.icon}>
                  {status.label}
                </Badge>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-navy-100 sm:text-base">{category.description}</p>
              <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-navy-200">
                <span className="inline-flex items-center gap-1.5">
                  <ListOrdered className="size-4" aria-hidden="true" />
                  {count} questions
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Trophy className="size-4" aria-hidden="true" />
                  {best ? `Best score: ${best.percent}% (${best.score}/${best.total})` : 'No score yet'}
                </span>
              </p>
              {footnote && <p className="mt-2 text-xs text-cyan-200">{footnote}</p>}
            </div>
          </div>
          <Button
            to={`/quiz/${category.id}`}
            state={{ autoStart: true }}
            variant="accent"
            size="lg"
            icon={startIcon}
            iconPosition="left"
            className="shrink-0 self-start md:self-center"
            aria-label={`${startLabel}: ${category.title}`}
          >
            {startLabel}
          </Button>
        </div>
      </article>
    )
  }

  return (
    <article className="group flex h-full flex-col rounded-md border border-slate-200/80 bg-white p-6 transition duration-200 hover:-translate-y-0.5 hover:border-navy-300">
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-11 place-items-center rounded-md bg-navy-50 text-navy-700 transition-colors duration-200 group-hover:bg-navy-900 group-hover:text-cyan-300">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <Badge tone={status.tone} icon={status.icon}>
          {status.label}
        </Badge>
      </div>

      <h3 className="mt-5 text-lg font-bold leading-snug">{category.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{category.description}</p>

      <dl className="mt-5 grid grid-cols-3 gap-2 rounded-md bg-paper p-3 text-center">
        <div>
          <dt className="text-[11px] font-medium text-slate-500">Questions</dt>
          <dd className="font-display text-base font-bold text-navy-900">{count}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium text-slate-500">Difficulty</dt>
          <dd className="mt-0.5">
            <Badge tone={difficultyTone[category.difficulty]} className="px-2 py-0.5">
              {category.difficulty}
            </Badge>
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium text-slate-500">Best score</dt>
          <dd className="font-display text-base font-bold text-navy-900">{best ? `${best.percent}%` : '—'}</dd>
        </div>
      </dl>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          {record?.attempts ? `${record.attempts} attempt${record.attempts === 1 ? '' : 's'}` : 'Not attempted yet'}
        </p>
        <Button
          to={`/quiz/${category.id}`}
          state={{ autoStart: true }}
          size="sm"
          icon={startIcon}
          iconPosition="left"
          aria-label={`${startLabel}: ${category.title}`}
        >
          {startLabel}
        </Button>
      </div>
    </article>
  )
}
