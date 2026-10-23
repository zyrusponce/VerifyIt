import { ArrowLeft, SearchX } from 'lucide-react'
import Button from '../components/Button'

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:py-32">
      <span className="grid size-14 place-items-center rounded-md bg-navy-50 text-navy-700">
        <SearchX className="size-7" aria-hidden="true" />
      </span>
      <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">Error 404</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight">We could not verify this page.</h1>
      <p className="mt-4 text-slate-600">The link may be broken or the page may have moved. Let&apos;s get you back on track.</p>
      <Button to="/" icon={ArrowLeft} iconPosition="left" className="mt-8">
        Back to home
      </Button>
    </section>
  )
}
