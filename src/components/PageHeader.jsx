import PageIntro from './PageIntro'

/** Top banner for inner pages (Learn, Quiz, Toolkit, and so on). `watermark` is the large word drifting behind it. */
export default function PageHeader({ eyebrow, title, description, icon: Icon, watermark, children }) {
  return (
    <PageIntro word={watermark}>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            {eyebrow && (
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
                {Icon && <Icon className="size-4" aria-hidden="true" />}
                {eyebrow}
              </p>
            )}
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
            {description && <p className="mt-4 text-lg leading-relaxed text-slate-600">{description}</p>}
          </div>
          {children}
        </div>
      </div>
    </PageIntro>
  )
}
