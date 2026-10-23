import { Link } from 'react-router-dom'
import { ArrowRight, CircleCheck, CircleDot, FlaskConical, Gavel, Search, TriangleAlert } from 'lucide-react'
import Badge, { difficultyTone } from '../components/Badge'
import FictionalNotice from '../components/FictionalNotice'
import PageHeader from '../components/PageHeader'
import useProgress from '../hooks/useProgress'
import { investigations } from '../data/investigations'

const howItWorks = [
  { icon: Search, title: 'Inspect the evidence', text: 'Choose which areas to investigate, from the source and date to images and headlines.' },
  { icon: Gavel, title: 'Make your assessment', text: 'Decide whether the claim is supported, misleading, or needs more information.' },
  { icon: CircleCheck, title: 'Review and learn', text: 'Compare your answer with the expected assessment and see any clues you missed.' },
]

function CaseStatus({ record }) {
  if (!record?.completed) {
    return (
      <Badge tone="slate" icon={CircleDot}>
        Not started
      </Badge>
    )
  }
  return record.correct ? (
    <Badge tone="green" icon={CircleCheck}>
      Solved
    </Badge>
  ) : (
    <Badge tone="amber" icon={TriangleAlert}>
      Try again
    </Badge>
  )
}

export default function InvestigationLab() {
  const { caseProgress, summary } = useProgress()

  return (
    <>
      <PageHeader watermark="Investigate"
        eyebrow="Investigation Lab"
        icon={FlaskConical}
        title="Investigate before you believe."
        description="Examine sample posts and headlines like a fact-checker. Inspect the evidence, weigh what you find, and decide whether the claim holds up."
      >
        <div className="rounded-md border border-slate-200 bg-white p-5 lg:w-72">
          <p className="text-sm font-medium text-slate-600">Cases completed</p>
          <p className="mt-1 font-display text-3xl font-extrabold text-navy-900">
            {summary.completedCaseIds.length}
            <span className="text-lg text-slate-400">/{summary.caseCount}</span>
          </p>
        </div>
      </PageHeader>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <ol className="grid gap-4 md:grid-cols-3">
          {howItWorks.map(({ icon: Icon, title, text }, index) => (
            <li key={title} className="flex gap-4 rounded-md border border-slate-200 bg-white p-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-md bg-cyan-50 text-cyan-700">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-sans text-sm font-bold text-navy-900">
                  {index + 1}. {title}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{text}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold">Choose a case</h2>
          <p className="flex items-center gap-2 text-sm text-slate-600">
            <FictionalNotice>All cases are fictional</FictionalNotice>
          </p>
        </div>

        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {investigations.map((item, index) => (
            <li key={item.id}>
              <Link
                to={`/lab/${item.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-md border border-slate-200/80 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-navy-300"
              >
                {item.post.image?.src && (
                  // Decorative thumbnail: the title names the case and the case page describes the image in full.
                  <img
                    src={item.post.image.src}
                    alt=""
                    width="640"
                    height="360"
                    loading="lazy"
                    decoding="async"
                    className="aspect-[16/9] w-full border-b border-slate-200/80 bg-slate-200 object-cover transition duration-300 group-hover:brightness-105"
                  />
                )}
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-display text-sm font-bold text-slate-400">Case {String(index + 1).padStart(2, '0')}</span>
                    <CaseStatus record={caseProgress[item.id]} />
                  </div>
                  <h3 className="mt-4 text-lg font-bold leading-snug">{item.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{item.summary}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Badge tone={difficultyTone[item.difficulty]}>{item.difficulty}</Badge>
                    <Badge tone="slate">{item.topic}</Badge>
                  </div>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-800">
                    {caseProgress[item.id]?.completed ? 'Investigate again' : 'Start investigation'}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
