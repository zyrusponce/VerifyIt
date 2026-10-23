import { useEffect, useRef } from 'react'

/*
  Lightweight scroll parallax.

  Every <Parallax> layer registers with one shared, requestAnimationFrame-throttled scroll handler.
  The outer element (the "anchor") is measured and never moved; only the inner element is translated,
  so a layer never measures its own movement. Only GPU-friendly transforms are used, and all motion is
  switched off when the visitor asks for reduced motion.

  speed  > 0: the layer lags behind the page (feels further away, like a background).
  speed  < 0: the layer moves ahead of the page (feels closer).
  origin 'top':    offset follows the page scroll, so there is none when the page loads (use on the first screen).
  origin 'center': no offset when the anchor is centered in the viewport (use further down the page).
  fade: fades the layer out as it moves away from its resting place (fully transparent after `fade` viewport heights).
*/

const layers = new Set()
let frame = null
let listening = false
const reducedMotion = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null

function update() {
  frame = null
  const viewport = window.innerHeight
  const reduce = reducedMotion?.matches
  // Read every position first, then write every transform, so the browser lays out the page only once.
  const moves = []
  for (const layer of layers) {
    const enabled = !reduce && (!layer.minWidth || window.innerWidth >= layer.minWidth)
    if (!enabled) {
      moves.push([layer, 0, 1])
      continue
    }
    const rect = layer.anchor.getBoundingClientRect()
    if (rect.bottom < -viewport || rect.top > viewport * 2) continue
    // 'top' layers sit exactly in place when the page loads (scroll position 0).
    const distance = layer.origin === 'top' ? window.scrollY : viewport / 2 - (rect.top + rect.height / 2)
    const offset = Math.max(-layer.max, Math.min(layer.max, distance * layer.speed))
    const opacity = layer.fade ? Math.max(0, 1 - Math.abs(distance) / (viewport * layer.fade)) : 1
    moves.push([layer, offset, opacity])
  }
  for (const [layer, offset, opacity] of moves) {
    layer.target.style.transform = offset ? `translate3d(0, ${offset.toFixed(1)}px, 0)` : ''
    layer.target.style.opacity = opacity < 1 ? opacity.toFixed(3) : ''
  }
}

function schedule() {
  if (frame === null) frame = window.requestAnimationFrame(update)
}

function startListening() {
  if (listening) return
  listening = true
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule)
  reducedMotion?.addEventListener?.('change', schedule)
}

function stopListening() {
  if (!listening || layers.size > 0) return
  listening = false
  window.removeEventListener('scroll', schedule)
  window.removeEventListener('resize', schedule)
  reducedMotion?.removeEventListener?.('change', schedule)
}

/**
 * <Parallax speed={0.3} origin="top" className="absolute inset-0" innerClassName="absolute -inset-y-24 inset-x-0">…</Parallax>
 * `minWidth` limits the effect to wider screens (for example when stacked mobile layouts could overlap).
 * `max` caps the offset in pixels.
 */
export default function Parallax({
  speed = 0.2,
  origin = 'center',
  minWidth = 0,
  max = 160,
  fade = 0,
  className = '',
  innerClassName = '',
  children,
  ...rest
}) {
  const anchorRef = useRef(null)
  const targetRef = useRef(null)

  useEffect(() => {
    const layer = { anchor: anchorRef.current, target: targetRef.current, speed, origin, minWidth, max, fade }
    if (!layer.anchor || !layer.target) return undefined
    layers.add(layer)
    startListening()
    schedule()
    return () => {
      layers.delete(layer)
      layer.target.style.transform = ''
      layer.target.style.opacity = ''
      stopListening()
    }
  }, [speed, origin, minWidth, max, fade])

  return (
    <div ref={anchorRef} className={className} {...rest}>
      <div ref={targetRef} className={innerClassName} style={{ willChange: 'transform' }}>
        {children}
      </div>
    </div>
  )
}
