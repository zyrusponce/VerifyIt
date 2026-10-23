import { useEffect, useRef } from 'react'

/*
  Shared background for the inner pages: a dot pattern and soft glows fixed behind the whole page. Both layers drift
  up more slowly than the content as you scroll (parallax), and because nothing else on these pages paints a
  section background, every page reads as one continuous, seamless surface.

  Each layer repeats vertically, so it is shifted by less than one tile (scroll offset modulo the tile height). That
  looks exactly like an endless drift while the layers stay only slightly taller than the screen, however long the
  page is. All movement stops for visitors who ask for reduced motion.
*/

const DOT_TILE = 22 // px; must match bg-[size:22px_22px]
const GLOW_TILE = 1400 // px; must match bg-[size:100%_1400px]

export default function PageBackdrop() {
  const dotsRef = useRef(null)
  const glowsRef = useRef(null)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = null

    function update() {
      frame = null
      const y = reducedMotion.matches ? 0 : window.scrollY
      if (dotsRef.current) dotsRef.current.style.transform = `translate3d(0, ${(-((y * 0.35) % DOT_TILE)).toFixed(1)}px, 0)`
      if (glowsRef.current) glowsRef.current.style.transform = `translate3d(0, ${(-((y * 0.2) % GLOW_TILE)).toFixed(1)}px, 0)`
    }
    function schedule() {
      if (frame === null) frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', schedule, { passive: true })
    reducedMotion.addEventListener?.('change', schedule)
    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      reducedMotion.removeEventListener?.('change', schedule)
    }
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div
        ref={glowsRef}
        className="absolute inset-x-0 top-0 h-[calc(100%+1400px)] bg-[radial-gradient(ellipse_30rem_22rem_at_0%_30%,color-mix(in_oklab,var(--color-cyan-200)_45%,transparent),transparent_70%),radial-gradient(ellipse_28rem_20rem_at_100%_78%,color-mix(in_oklab,var(--color-navy-200)_50%,transparent),transparent_70%)] bg-[size:100%_1400px] bg-repeat-y"
        style={{ willChange: 'transform' }}
      />
      <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_85%)]">
        <div
          ref={dotsRef}
          className="absolute inset-x-0 top-0 h-[calc(100%+22px)] bg-[radial-gradient(rgba(11,31,77,0.14)_1px,transparent_1px)] bg-[size:22px_22px] dark:bg-[radial-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)]"
          style={{ willChange: 'transform' }}
        />
      </div>
    </div>
  )
}
