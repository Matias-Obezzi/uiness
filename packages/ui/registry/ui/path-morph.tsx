'use client'

import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

export type Point = [number, number]

const NS = 'http://www.w3.org/2000/svg'
let scratch: SVGSVGElement | null = null

/** A hidden SVG the paths are measured in. Geometry only works on attached elements. */
function scratchPath(): SVGPathElement | null {
  if (typeof document === 'undefined') return null
  if (!scratch) {
    scratch = document.createElementNS(NS, 'svg')
    scratch.setAttribute('aria-hidden', 'true')
    scratch.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none'
    document.body.appendChild(scratch)
  }
  const path = document.createElementNS(NS, 'path')
  scratch.appendChild(path)
  return path
}

/** Sample a path into evenly spaced points. Empty where SVG geometry is not available. */
export function samplePath(d: string, samples = 96): Point[] {
  const path = scratchPath()
  if (!path || typeof path.getTotalLength !== 'function') return []
  path.setAttribute('d', d)
  const length = path.getTotalLength()
  const points: Point[] = []
  for (let i = 0; i < samples; i++) {
    const p = path.getPointAtLength((length * i) / samples)
    points.push([p.x, p.y])
  }
  path.remove()
  return points
}

const dist2 = (a: Point, b: Point) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2

/**
 * Rotate and, if needed, reverse `b` so its points line up with `a` as closely as
 * possible. Without this the shape twists on its way over.
 */
export function alignPoints(a: Point[], b: Point[]): Point[] {
  const n = Math.min(a.length, b.length)
  if (n === 0) return b
  let best = b
  let bestScore = Number.POSITIVE_INFINITY
  for (const candidate of [b, [...b].reverse()]) {
    for (let offset = 0; offset < n; offset++) {
      let score = 0
      for (let i = 0; i < n; i++) {
        const q = candidate[(i + offset) % n]
        const p = a[i]
        if (!q || !p) continue
        score += dist2(p, q)
        if (score >= bestScore) break
      }
      if (score < bestScore) {
        bestScore = score
        best = candidate.slice(offset).concat(candidate.slice(0, offset))
      }
    }
  }
  return best
}

/** Points part way between two aligned lists. */
export function morphPoints(a: Point[], b: Point[], t: number): Point[] {
  const n = Math.min(a.length, b.length)
  const out: Point[] = []
  for (let i = 0; i < n; i++) {
    const p = a[i]
    const q = b[i]
    if (!p || !q) continue
    out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t])
  }
  return out
}

/** Turn points back into a path, with a smooth curve through them by default. */
export function toPath(points: Point[], { smooth = true, closed = true } = {}): string {
  if (points.length === 0) return ''
  const f = (n: number) => n.toFixed(2)
  const first = points[0]
  if (!first) return ''
  if (!smooth || points.length < 3) {
    return `M${f(first[0])} ${f(first[1])}${points
      .slice(1)
      .map((p) => `L${f(p[0])} ${f(p[1])}`)
      .join('')}${closed ? 'Z' : ''}`
  }
  const n = points.length
  const at = (i: number) => {
    const p = closed ? points[((i % n) + n) % n] : points[Math.max(0, Math.min(n - 1, i))]
    return p ?? first
  }
  let d = `M${f(first[0])} ${f(first[1])}`
  const last = closed ? n : n - 1
  for (let i = 0; i < last; i++) {
    const p0 = at(i - 1)
    const p1 = at(i)
    const p2 = at(i + 1)
    const p3 = at(i + 2)
    // Catmull-Rom to cubic Bézier.
    const c1: Point = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2: Point = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`
  }
  return closed ? `${d}Z` : d
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

export interface PathMorphProps extends Omit<React.ComponentProps<'svg'>, 'children'> {
  /** Path data strings, all in the same coordinate space. */
  paths: string[]
  /** Which path shows. Controlled; leave it out and use `interval` to cycle. */
  index?: number
  onIndexChange?: (index: number) => void
  /** Milliseconds each shape stays before moving to the next. 0 turns cycling off. Default 2000. */
  interval?: number
  /** Milliseconds a morph takes. Default 700. */
  duration?: number
  /** Points each path is sampled into. More is smoother and heavier. Default 96. */
  samples?: number
  easing?: (t: number) => number
  /** Curve through the points, or straight lines between them. Default true. */
  smooth?: boolean
  /** Whether the shapes are closed outlines. Default true. */
  closed?: boolean
  /** Props for the inner `<path>`: fill, stroke, className. */
  pathProps?: React.ComponentProps<'path'>
}

/**
 * Morphs between SVG paths. Any paths work: they are sampled into the same number of
 * points and interpolated, so a star can become a blob can become a heart.
 */
function PathMorph({
  paths,
  index: indexProp,
  onIndexChange,
  interval = 2000,
  duration = 700,
  samples = 96,
  easing = easeInOut,
  smooth = true,
  closed = true,
  pathProps,
  className,
  viewBox = '0 0 100 100',
  ...props
}: PathMorphProps) {
  const reduced = useReducedMotion()
  const [uncontrolled, setUncontrolled] = React.useState(0)
  const index = indexProp ?? uncontrolled
  const pathRef = React.useRef<SVGPathElement>(null)
  const shown = React.useRef(index)
  const cache = React.useRef(new Map<string, Point[]>())
  const sampled = React.useCallback(
    (d: string) => {
      let pts = cache.current.get(d)
      if (!pts) {
        pts = samplePath(d, samples)
        cache.current.set(d, pts)
      }
      return pts
    },
    [samples],
  )

  // Cycle when uncontrolled.
  React.useEffect(() => {
    if (indexProp !== undefined || interval <= 0 || paths.length < 2) return
    const timer = setInterval(() => {
      setUncontrolled((i) => {
        const next = (i + 1) % paths.length
        onIndexChange?.(next)
        return next
      })
    }, interval)
    return () => clearInterval(timer)
  }, [indexProp, interval, paths.length, onIndexChange])

  // Animate from the shape on screen to the new one.
  React.useEffect(() => {
    const el = pathRef.current
    const target = paths[index]
    if (!el || target === undefined) return
    const from = paths[shown.current]
    shown.current = index
    const a = from === undefined ? [] : sampled(from)
    const b = alignPoints(a, sampled(target))
    if (reduced || a.length === 0 || b.length === 0 || from === target) {
      el.setAttribute('d', target)
      return
    }
    let frame = 0
    let start = 0
    const tick = (now: number) => {
      if (!start) start = now
      const t = Math.min((now - start) / duration, 1)
      if (t >= 1) {
        el.setAttribute('d', target)
        return
      }
      el.setAttribute('d', toPath(morphPoints(a, b, easing(t)), { smooth, closed }))
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [index, paths, sampled, duration, easing, smooth, closed, reduced])

  return (
    <svg
      data-slot="path-morph"
      viewBox={viewBox}
      className={cn('size-32', className)}
      aria-hidden
      {...props}
    >
      <path ref={pathRef} d={paths[index] ?? ''} fill="currentColor" {...pathProps} />
    </svg>
  )
}

export { PathMorph }
