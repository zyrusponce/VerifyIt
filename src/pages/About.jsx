import {
  BookMarked,
  CircleCheck,
  ExternalLink,
  GraduationCap,
  Heart,
  Info,
  Lightbulb,
  Newspaper,
  Target,
  Users,
} from 'lucide-react'
import Card from '../components/Card'
import PageHeader from '../components/PageHeader'
import SectionHeading from '../components/SectionHeading'
import { projectInfo, team } from '../data/team'
import { references } from '../data/references'

const objectives = [
  'Explain the difference between misinformation, disinformation, and malinformation.',
  'Teach practical habits for evaluating sources, headlines, images, and AI-generated content.',
  'Give learners hands-on practice investigating realistic (fictional) online posts.',
  'Encourage responsible sharing and respectful correction of misinformation.',
  'Connect digital literacy to the wider relationship between technology and society.',
]

// The primary audience comes first and is highlighted; the others also benefit from the same habits.
const primaryAudience = {
  icon: Newspaper,
  title: 'People with limited media literacy',
  text: 'Anyone who has not yet learned how to judge the sources, headlines, images, and videos they see online. Each habit is explained in plain language, one step at a time.',
}

const audiences = [
  { icon: GraduationCap, title: 'Students', text: 'Senior high school and college students who get much of their news through social media.' },
  { icon: Users, title: 'Families and communities', text: 'Parents, relatives, and neighbors who share information through group chats and community pages.' },
  { icon: Heart, title: 'Everyday internet users', text: 'Anyone who wants simple, practical habits for checking what they see online.' },
]

const citizenship = [
  'Pause before sharing, especially when content makes you feel strong emotions.',
  'Correct misinformation kindly and with reliable evidence.',
  'Respect privacy. Do not share personal information that could harm others.',
  'Correct your own mistakes publicly when you share something false.',
  'Support reliable sources of information in your community.',
]

function initials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export default function About() {
  const PrimaryIcon = primaryAudience.icon

  return (
    <>
      <PageHeader watermark="About"
        eyebrow="About the project"
        icon={Info}
        title="VerifyIT: A Digital Literacy Campaign Against Online Misinformation"
        description="An STS class project that helps people recognize misinformation, investigate online claims, and share responsibly."
      />

      <div className="mx-auto max-w-5xl space-y-20 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        {/* Background and problem */}
        <section className="grid gap-10 md:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Project background" title="Why we built VerifyIT" />
            <div className="mt-5 space-y-4 leading-relaxed text-slate-700">
              <p>
                Science, Technology, and Society (STS) asks how technology shapes the way people live, think, and relate
                to one another. Social media and generative AI have changed how information is created and shared:
                anyone can publish instantly, and convincing content can be produced in seconds.
              </p>
              <p>
                VerifyIT is our response. Instead of only warning people about &ldquo;fake news,&rdquo; it teaches
                practical verification habits through short lessons, interactive investigations, and a self-check quiz.
              </p>
            </div>
          </div>
          <div>
            <SectionHeading eyebrow="Problem statement" title="The challenge" />
            <div className="mt-5 space-y-4 leading-relaxed text-slate-700">
              <p>
                False and misleading content spreads easily online, often faster than corrections. It can look
                professional, use real photos out of context, or imitate trusted people and organizations. Many users
                are never taught how to check what they see before they share it.
              </p>
              <p>
                This project asks: <strong className="text-navy-900">How can an accessible, interactive campaign help
                people build the habit of verifying information before sharing it?</strong>
              </p>
            </div>
          </div>
        </section>

        {/* Objectives */}
        <section>
          <SectionHeading eyebrow="Objectives" title="What VerifyIT aims to do" />
          <ol className="mt-8 grid gap-4 sm:grid-cols-2">
            {objectives.map((objective, index) => (
              <li key={objective} className="flex gap-4 rounded-md border border-slate-200 bg-white p-5">
                <span className="keep-palette grid size-8 shrink-0 place-items-center rounded-md bg-navy-900 text-sm font-bold text-cyan-300">
                  {index + 1}
                </span>
                <span className="leading-relaxed text-slate-700">{objective}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Target audience */}
        <section>
          <SectionHeading
            eyebrow="Target audience"
            title="Who VerifyIT is for"
            description="VerifyIT is built first for people who are still learning to judge what they see online. The same habits help everyone else, too."
          />
          <div className="mt-8 flex flex-col gap-4 rounded-md border border-cyan-300 bg-white p-5 sm:flex-row sm:items-start sm:gap-5 sm:p-6">
            <span className="grid size-12 shrink-0 place-items-center rounded-md bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
              <PrimaryIcon className="size-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">Primary audience</p>
              <h3 className="mt-1 text-xl font-bold">{primaryAudience.title}</h3>
              <p className="mt-2 leading-relaxed text-slate-600">{primaryAudience.text}</p>
            </div>
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {audiences.map(({ icon: Icon, title, text }) => (
              <Card key={title}>
                <span className="grid size-11 place-items-center rounded-md bg-cyan-50 text-cyan-700">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Educational impact and citizenship */}
        <section className="grid gap-6 md:grid-cols-2">
          <Card padding="lg">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
              <Lightbulb className="size-4" aria-hidden="true" />
              Educational impact
            </p>
            <h2 className="mt-3 text-2xl font-bold">Learning by doing</h2>
            <p className="mt-3 leading-relaxed text-slate-700">
              VerifyIT is designed around active practice. Learners inspect evidence, make decisions, and get immediate
              explanations. Seeing the explanation after every answer shows that feeling sure is not the same as being right,
              which encourages humility and careful checking.
            </p>
          </Card>
          <Card padding="lg">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
              <Target className="size-4" aria-hidden="true" />
              Responsible digital citizenship
            </p>
            <h2 className="mt-3 text-2xl font-bold">Habits worth sharing</h2>
            <ul className="mt-4 space-y-3">
              {citizenship.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-slate-700">
                  <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </section>

        {/* Team */}
        <section id="team" className="scroll-mt-24">
          <SectionHeading eyebrow="Team members" title="The people behind VerifyIT" />
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((member) => (
              <li key={member.name}>
                <Card className="h-full text-center">
                  {member.photo ? (
                    <img src={member.photo} alt={member.name} className="mx-auto size-20 rounded-full object-cover" />
                  ) : (
                    <span className="mx-auto grid size-20 place-items-center rounded-full bg-navy-100 font-display text-xl font-bold text-navy-800" aria-hidden="true">
                      {initials(member.name)}
                    </span>
                  )}
                  <h3 className="mt-4 text-lg font-bold">{member.name}</h3>
                  <p className="text-sm font-medium text-cyan-700">{member.role}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{member.contribution}</p>
                </Card>
              </li>
            ))}
          </ul>
          <dl className="mt-8 flex flex-wrap gap-x-12 gap-y-3 rounded-md border border-slate-200 bg-paper p-5 text-sm">
            {projectInfo.map((info) => (
              <div key={info.label}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{info.label}</dt>
                <dd className="mt-0.5 font-medium text-navy-900">{info.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* References */}
        <section id="references" className="scroll-mt-24">
          <SectionHeading
            eyebrow="References and learning resources"
            title="Sources and further reading"
            description="Concepts on this site are drawn from the resources below. Practice scenarios are fictional and do not describe real events."
          />
          <div className="mt-8 space-y-10">
            {references.map((group) => (
              <div key={group.category}>
                <h3 className="flex items-center gap-2 font-sans text-sm font-bold uppercase tracking-wider text-slate-500">
                  <BookMarked className="size-4" aria-hidden="true" />
                  {group.category}
                </h3>
                <ul className="mt-4 space-y-3">
                  {group.items.map((ref) => (
                    <li key={ref.title} className="rounded-md border border-slate-200 bg-white p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          {ref.url ? (
                            <a
                              href={ref.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-start gap-1.5 rounded font-semibold text-navy-900 underline decoration-navy-200 underline-offset-4 hover:decoration-navy-600"
                            >
                              <span>{ref.title}</span>
                              <ExternalLink className="mt-1 size-3.5 shrink-0" aria-hidden="true" />
                              <span className="sr-only">(opens in a new tab)</span>
                            </a>
                          ) : (
                            <p className="font-semibold text-navy-900">{ref.title}</p>
                          )}
                          <p className="mt-1 text-sm text-slate-600">
                            {ref.author}
                            {ref.year ? ` (${ref.year})` : ''}
                          </p>
                        </div>
                        {ref.verified && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
                            <CircleCheck className="size-3.5" aria-hidden="true" /> Verified
                          </span>
                        )}
                      </div>
                      {ref.note && <p className="mt-3 text-sm leading-relaxed text-slate-600">{ref.note}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
