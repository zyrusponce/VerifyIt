/** Friendly placeholder shown when there is no data yet. */
export default function EmptyState({ icon: Icon, title, description, children }) {
  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-paper px-6 py-12 text-center">
      {Icon && (
        <span className="mx-auto grid size-12 place-items-center rounded-md bg-white text-navy-700 ring-1 ring-slate-200">
          <Icon className="size-6" aria-hidden="true" />
        </span>
      )}
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      {description && <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">{description}</p>}
      {children && <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  )
}
