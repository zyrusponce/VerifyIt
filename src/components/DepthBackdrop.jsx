import Parallax from './Parallax'

/*
  Shared background depth for page sections, so every section has the same, balanced amount of depth:
  a dot pattern, a matching pair of glows (one on each side) and an optional oversized watermark word, each layer
  drifting at its own scroll speed behind the content. A fixed mask fades the layers out near the section's top and
  bottom edges, so they never stop at a hard line and neighboring sections blend into each other. Render it as the
  first child of a `relative overflow-hidden` section and give the section's content wrapper `relative` so it stays
  in front.
*/

const tones = {
  light: {
    dots: 'bg-[radial-gradient(rgba(11,31,77,0.16)_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)]',
    left: 'bg-cyan-200/40',
    right: 'bg-navy-200/40',
    word: 'text-navy-900/[0.06]',
  },
  dark: {
    dots: 'bg-[radial-gradient(rgba(255,255,255,0.11)_1px,transparent_1px)]',
    left: 'bg-cyan-400/15',
    right: 'bg-navy-400/25',
    word: 'text-white/[0.05]',
  },
}

export default function DepthBackdrop({ tone = 'light', word }) {
  const colors = tones[tone] ?? tones.light

  return (
    <div
      className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]"
      aria-hidden="true"
    >
      <Parallax speed={0.35} max={240} className="absolute inset-0" innerClassName="absolute -inset-y-60 inset-x-0">
        <div
          className={`absolute inset-0 ${colors.dots} bg-[size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]`}
        />
      </Parallax>
      {/* Both glows share one layer, so they stay level with each other while they drift. */}
      <Parallax speed={0.4} max={240} className="absolute inset-0" innerClassName="absolute inset-0">
        <div className={`absolute top-1/2 -left-40 size-[30rem] -translate-y-1/2 rounded-full ${colors.left} blur-3xl`} />
        <div className={`absolute top-1/2 -right-40 size-[30rem] -translate-y-1/2 rounded-full ${colors.right} blur-3xl`} />
      </Parallax>
      {word && (
        <Parallax speed={0.5} max={280} className="absolute inset-0" innerClassName="absolute inset-0">
          <span
            className={`absolute top-[12%] -right-4 font-display text-[7rem] leading-none font-extrabold tracking-tighter whitespace-nowrap uppercase select-none sm:text-[10rem] lg:text-[13rem] ${colors.word}`}
          >
            {word}
          </span>
        </Parallax>
      )}
    </div>
  )
}
