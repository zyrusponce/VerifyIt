import {
  ArrowRight,
  Award,
  BookOpen,
  Bot,
  ChartColumn,
  FlaskConical,
  Hand,
  Image,
  Layers,
  ListChecks,
  Route,
  Search,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react'
import Button from '../components/Button'
import Card from '../components/Card'
import DepthBackdrop from '../components/DepthBackdrop'
import EmptyState from '../components/EmptyState'
import FictionalNotice from '../components/FictionalNotice'
import HeroVisual from '../components/HeroVisual'
import Parallax from '../components/Parallax'
import LessonCard from '../components/LessonCard'
import SectionHeading from '../components/SectionHeading'
import SocialPost from '../components/SocialPost'
import StatCard from '../components/StatCard'
import useProgress from '../hooks/useProgress'
import { lessons } from '../data/lessons'
import { investigations, investigationAreas } from '../data/investigations'
import { allQuestions } from '../data/quizCategories'

const reasons = [
  {
    icon: Zap,
    title: 'Sharing is faster than checking',
    text: 'A post can reach thousands of people in minutes. Corrections usually travel more slowly and reach fewer people.',
  },
  {
    icon: Image,
    title: 'Real images, false stories',
    text: 'Much misinformation uses genuine photos and videos with misleading captions, dates, or locations.',
  },
  {
    icon: Bot,
    title: 'AI makes fakes easier',
    text: 'Generative AI tools can create convincing images, voices, and videos, so appearance alone is no longer proof.',
  },
  {
    icon: Users,
    title: 'Everyone is part of the solution',
    text: 'Every share is a choice. Small habits, like pausing and checking sources, protect the people who trust you.',
  },
]

const steps = [
  {
    icon: Hand,
    title: 'Stop',
    text: 'Notice your reaction. Strong emotions and urgency are signals to pause before you share.',
  },
  {
    icon: Search,
    title: 'Investigate the source',
    text: 'Find out who is behind the claim and whether they are credible on this topic.',
  },
  {
    icon: Layers,
    title: 'Find better coverage',
    text: 'Check whether independent, reliable sources report the same thing.',
  },
  {
    icon: Route,
    title: 'Trace to the original',
    text: 'Follow quotes, images, and data back to where they first appeared and check the context.',
  },
]

// Every section below the hero shares one depth system: a <DepthBackdrop> drifts behind the content, headings
// lag slightly behind the page, and cards sit raised in front with the same shadow.
const headingDepth = { speed: 0.1, minWidth: 1024, max: 32 }
const raised =
  'shadow-[0_2px_4px_rgba(11,31,77,0.04),0_20px_44px_-24px_rgba(11,31,77,0.3)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.25),0_20px_44px_-24px_rgba(0,0,0,0.8)]'
const raisedChildren =
  '*:shadow-[0_2px_4px_rgba(11,31,77,0.04),0_20px_44px_-24px_rgba(11,31,77,0.3)] dark:*:shadow-[0_2px_4px_rgba(0,0,0,0.25),0_20px_44px_-24px_rgba(0,0,0,0.8)]'

export default function Home() {
  const { lessonProgress, summary, mode } = useProgress()
  const featuredCase = investigations[0]

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background depth layers: the grid and the glow each drift at their own speed. The fixed mask
            fades them out before the section's bottom edge, so they never stop at a hard line. */}
        <div className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black_60%,transparent)]" aria-hidden="true">
          <Parallax speed={0.5} origin="top" max={600} className="absolute inset-0" innerClassName="absolute inset-0">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(11,31,77,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(11,31,77,0.07)_1px,transparent_1px)] bg-[size:48px_48px] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_top,black_40%,transparent_75%)]" />
          </Parallax>
          <Parallax speed={0.3} origin="top" max={600} className="absolute inset-0" innerClassName="absolute inset-0">
            <div className="absolute top-1/3 -left-40 size-[28rem] rounded-full bg-navy-200/40 blur-3xl" />
          </Parallax>
        </div>
        {/* On large screens the text is top-aligned with the investigation card: centering it against the
            much taller card pushed the headline far down the page. */}
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pb-12 pt-8 sm:px-6 sm:pb-14 sm:pt-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-16 lg:px-8 lg:pb-14 lg:pt-10">
          <Parallax speed={0.22} origin="top" minWidth={1024} max={96} fade={1.6} className="lg:pt-6">
            <div className="motion-safe:animate-fade-up">
              <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
                <span className="size-1.5 rounded-full bg-cyan-500" aria-hidden="true" />
                Think before you share
              </p>
              <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                Not Everything Online Is <span className="text-cyan-600">What It Seems.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
                Learn to recognize misinformation, investigate online claims, and make smarter decisions before sharing
                information.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button to="/learn" size="lg" icon={ArrowRight}>
                  Start Learning
                </Button>
                <Button to="/lab" size="lg" variant="secondary" icon={FlaskConical} iconPosition="left">
                  Explore Investigation Lab
                </Button>
              </div>
              <dl className="mt-8 grid max-w-lg grid-cols-3 gap-4 border-t border-slate-200 pt-5">
                <div>
                  <dt className="text-xs text-slate-500">Lessons</dt>
                  <dd className="font-display text-2xl font-extrabold text-navy-900">{lessons.length}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Investigation cases</dt>
                  <dd className="font-display text-2xl font-extrabold text-navy-900">{investigations.length}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Quiz questions</dt>
                  <dd className="font-display text-2xl font-extrabold text-navy-900">{allQuestions.length}</dd>
                </div>
              </dl>
            </div>
          </Parallax>
          <Parallax speed={-0.12} origin="top" minWidth={1024} max={110} className="lg:pl-4">
            <HeroVisual />
          </Parallax>
        </div>
      </section>

      {/* Why VerifyIT Matters */}
      <section className="relative overflow-hidden">
        <DepthBackdrop word="Pause" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <Parallax {...headingDepth}>
            <SectionHeading
              eyebrow="Why VerifyIT matters"
              title="Misinformation is designed to be believed."
              description="It rarely looks like an obvious lie. It borrows real photos, trusted logos, and familiar voices. Recognizing it takes practice, not just suspicion."
            />
          </Parallax>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
            {reasons.map(({ icon: Icon, title, text }) => (
              <Card key={title} interactive className={`h-full ${raised}`}>
                <span className="grid size-11 place-items-center rounded-md bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Explore Learning Modules */}
      <section className="relative overflow-hidden">
        <DepthBackdrop word="Learn" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <Parallax {...headingDepth} innerClassName="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <SectionHeading
              eyebrow="Explore learning modules"
              title="Eight short lessons, one practical skill set."
              description="Each lesson takes about five minutes and ends with a quick knowledge check."
            />
            <Button to="/learn" variant="secondary" icon={ArrowRight} className="self-start md:self-auto">
              View all lessons
            </Button>
          </Parallax>
          <div className={`mt-12 grid gap-5 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4 ${raisedChildren}`}>
            {lessons.slice(0, 4).map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                completed={Boolean(lessonProgress[lesson.id]?.completed)}
                score={lessonProgress[lesson.id]?.score}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How Verification Works */}
      <section className="relative overflow-hidden">
        <DepthBackdrop word="Sift" />
        <div className="relative mx-auto max-w-7xl px-4 pt-24 pb-12 sm:px-6 lg:px-8 lg:pt-32 lg:pb-16">
          <Parallax {...headingDepth}>
            <SectionHeading
              eyebrow="How verification works"
              title="Four moves to check almost anything."
              description="You do not need special software to verify most claims. These four habits, inspired by the SIFT method developed by Mike Caulfield, take only a few minutes."
            />
          </Parallax>
          <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
            {steps.map(({ icon: Icon, title, text }, index) => (
              <li key={title} className={`relative rounded-md border border-slate-200/80 bg-white p-6 ${raised}`}>
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-md bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="font-display text-3xl font-extrabold text-slate-200" aria-hidden="true">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10">
            <Button to="/toolkit" variant="secondary" icon={ListChecks} iconPosition="left">
              Open the Before You Share checklist
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Investigation Case */}
      <section className="relative overflow-hidden">
        <DepthBackdrop word="Verify" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pt-12 pb-24 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20 lg:px-8 lg:pt-16 lg:pb-32">
          <div className="order-2 lg:order-1">
            <div className={`mx-auto max-w-md rounded-md ${raised}`}>
              <SocialPost post={featuredCase.post} />
            </div>
          </div>
          <Parallax {...headingDepth} className="order-1 lg:order-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">Featured investigation case</p>
              <FictionalNotice />
            </div>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{featuredCase.title}</h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">{featuredCase.summary}</p>
            <p className="mt-6 text-sm font-semibold text-navy-900">You will investigate:</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {investigationAreas.map((area) => (
                <li key={area.id} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                  {area.label}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button to={`/lab/${featuredCase.id}`} icon={ArrowRight}>
                Start this investigation
              </Button>
              <Button to="/lab" variant="secondary">
                See all cases
              </Button>
            </div>
          </Parallax>
        </div>
      </section>

      {/* Learning Progress Preview */}
      <section className="relative overflow-hidden">
        <DepthBackdrop word="Progress" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <Parallax {...headingDepth} innerClassName="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <SectionHeading
              eyebrow="Your learning progress"
              title={summary.hasAnyProgress ? 'Pick up where you left off.' : 'Track your progress as you learn.'}
              description={
                mode === 'account'
                  ? 'Your progress is saved to your account, so it follows you to any device.'
                  : 'No account needed. Guest progress is saved in this browser; sign in to keep it across devices.'
              }
            />
            {summary.hasAnyProgress && (
              <Button to="/results" variant="secondary" icon={ChartColumn} iconPosition="left" className="self-start md:self-auto">
                View full progress
              </Button>
            )}
          </Parallax>

          <div className="mt-12 lg:mt-16">
            {summary.hasAnyProgress ? (
              <div className={`grid gap-5 sm:grid-cols-2 lg:grid-cols-4 ${raisedChildren}`}>
                <StatCard
                  icon={BookOpen}
                  label="Lessons completed"
                  value={`${summary.completedLessonIds.length}/${summary.lessonCount}`}
                  progress={{ value: summary.completedLessonIds.length, max: summary.lessonCount, label: 'Lessons completed' }}
                />
                <StatCard
                  icon={FlaskConical}
                  label="Cases investigated"
                  value={`${summary.completedCaseIds.length}/${summary.caseCount}`}
                  progress={{ value: summary.completedCaseIds.length, max: summary.caseCount, label: 'Cases investigated' }}
                  tone="navy"
                />
                <StatCard
                  icon={Award}
                  label="Best quiz score"
                  value={summary.bestQuiz ? `${summary.bestQuiz.percent}%` : '—'}
                  detail={summary.bestQuiz ? `${summary.quizAttempts} attempt${summary.quizAttempts === 1 ? '' : 's'}` : 'Quiz not taken yet'}
                />
                <Card className="flex flex-col">
                  <p className="text-sm font-medium text-slate-600">Suggested next</p>
                  {summary.suggestedLesson ? (
                    <>
                      <p className="mt-3 font-display text-lg font-bold leading-snug text-navy-900">
                        {summary.suggestedLesson.title}
                      </p>
                      <Button to={`/learn/${summary.suggestedLesson.id}`} size="sm" className="mt-auto self-start" icon={ArrowRight}>
                        Continue
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="mt-3 font-display text-lg font-bold leading-snug text-navy-900">All lessons complete</p>
                      <Button to="/quiz" size="sm" className="mt-auto self-start" icon={ArrowRight}>
                        Take the quiz
                      </Button>
                    </>
                  )}
                </Card>
              </div>
            ) : (
              <EmptyState
                icon={Sparkles}
                title="You have not started yet"
                description="Complete a lesson, investigate a case, or take the quiz. Your scores and completed activities will appear here."
              >
                <Button to="/learn/what-is-misinformation" icon={ArrowRight}>
                  Start the first lesson
                </Button>
                <Button to="/quiz" variant="secondary">
                  Take the quiz
                </Button>
              </EmptyState>
            )}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="relative overflow-hidden">
        <DepthBackdrop word="Share" />
        {/* No panel: the call to action sits directly on the page background, like the other sections. */}
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <Parallax {...headingDepth} className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Pause. Investigate. Then share.</h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">
              Put your skills to the test with a quiz in each topic, from AI-generated images to fact-checking, or keep the Before You Share
              checklist handy for the next time something seems too shocking to be true.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button to="/quiz" size="lg" icon={ArrowRight}>
                Take the quiz
              </Button>
              <Button to="/toolkit" variant="secondary" size="lg">
                Open the toolkit
              </Button>
            </div>
          </Parallax>
        </div>
      </section>
    </>
  )
}
