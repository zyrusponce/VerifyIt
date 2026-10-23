import Parallax from './Parallax'

/*
  Top of an inner page. It has no background of its own (the page background shows through, so there is no seam
  below it), an oversized watermark word that drifts behind it, and content that lags slightly and fades as you
  scroll, like the home page hero.

  The section itself does not clip, so the drifting content is never cut off at its bottom edge; only the watermark
  layer clips and fades out. Keep at least `max` (56px) of combined spacing below the content so it never reaches
  what follows.
*/
export default function PageIntro({ as: Tag = 'section', word, children, ...rest }) {
  return (
    <Tag className="relative" {...rest}>
      {word && (
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_bottom,black_45%,transparent)]"
          aria-hidden="true"
        >
          <Parallax speed={0.45} origin="top" max={300} className="absolute inset-0" innerClassName="absolute inset-0">
            <span className="absolute top-6 -right-4 font-display text-[6rem] leading-none font-extrabold tracking-tighter whitespace-nowrap text-navy-900/[0.06] uppercase select-none sm:text-[9rem] lg:text-[11rem]">
              {word}
            </span>
          </Parallax>
        </div>
      )}
      <Parallax speed={0.15} origin="top" max={56} fade={1.4} className="relative">
        {children}
      </Parallax>
    </Tag>
  )
}
