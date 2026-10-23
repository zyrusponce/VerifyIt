/** Eyebrow label + title + optional description, used at the top of page sections. */
export default function SectionHeading({ eyebrow, title, description, align = 'left', as: Tag = 'h2', className = '' }) {
  const alignment = align === 'center' ? 'mx-auto text-center' : ''

  return (
    <div className={`max-w-2xl ${alignment} ${className}`}>
      {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">{eyebrow}</p>}
      <Tag className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</Tag>
      {description && <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">{description}</p>}
    </div>
  )
}
