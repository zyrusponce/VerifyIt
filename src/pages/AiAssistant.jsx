import { Link } from 'react-router-dom'
import { ShieldCheck, Sparkles } from 'lucide-react'
import AiAssistantWorkspace from '../components/AiAssistantWorkspace'
import PageHeader from '../components/PageHeader'

export default function AiAssistant() {
  return (
    <>
      <PageHeader
        watermark="Analyze"
        eyebrow="AI Investigation Assistant"
        icon={Sparkles}
        title="Investigate with an AI assistant."
        description="Paste a suspicious article, headline, or social media post. The assistant summarizes it, separates claims from opinions, points out possible warning signs, and gives you a checklist for verifying it yourself."
      >
        <div className="rounded-md border border-slate-200 bg-white p-5 lg:w-72">
          <p className="flex items-center gap-2 text-sm font-bold text-navy-900">
            <ShieldCheck className="size-4 text-cyan-600" aria-hidden="true" />
            An initial verdict, not a final ruling
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            The assistant gives a first guess based on published fact-checks and news reports it finds. It can be wrong, so you decide after checking reliable sources with the{' '}
            <Link to="/toolkit" className="font-semibold text-navy-800 underline underline-offset-2">
              Verification Toolkit
            </Link>
            .
          </p>
        </div>
      </PageHeader>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <AiAssistantWorkspace layout="page" />
      </section>
    </>
  )
}
