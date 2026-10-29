'use client'

import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface SpoilerTextLabels {
  /** The hidden text's button. */
  reveal: string
}

export const defaultSpoilerTextLabels: SpoilerTextLabels = {
  reveal: 'Spoiler, press to reveal',
}

type Speck = { x: number; y: number; vx: number; vy: number; life: number }

export interface SpoilerTextProps extends Omit<React.ComponentProps<'span'>, 'children'> {
  /** The words to hide. */
  children: string
  labels?: Partial<SpoilerTextLabels>
}

/**
 * Words hidden under drifting specks, like a spoiler in a chat. A press blows the specks away
 * from where it landed and the words show. A button until then, for the keyboard and screen
 * readers, which hear it as a spoiler and not the words.
 */
function SpoilerText({ children, labels: labelsProp, className, ...props }: SpoilerTextProps) {
  const labels = useLabels('spoiler-text', defaultSpoilerTextLabels, labelsProp)
  const reduced = useReducedMotion()
  const [shown, setShown] = React.useState(false)
  const [gone, setGone] = React.useState(false)
  const box = React.useRef<HTMLSpanElement>(null)
  const canvas = React.useRef<HTMLCanvasElement>(null)
  const specks = React.useRef<Speck[]>([])
  const blast = React.useRef<{ x: number; y: number } | null>(null)

  React.useEffect(() => {
    const c = canvas.current
    const el = box.current
    const ctx = c?.getContext('2d')
    if (!c || !el || !ctx || gone) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const w = el.offsetWidth
    const h = el.offsetHeight
    c.width = w * dpr
    c.height = h * dpr
    ctx.scale(dpr, dpr)
    specks.current = Array.from({ length: Math.round((w * h) / 9) }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      life: 1,
    }))
    const color = getComputedStyle(el).color
    let frame = 0
    const tick = () => {
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = color
      const b = blast.current
      let alive = 0
      for (const s of specks.current) {
        if (b) {
          // Blown away from the press, faster nearer it, fading as they go.
          if (s.life === 1) {
            const dx = s.x - b.x
            const dy = s.y - b.y
            const d = Math.hypot(dx, dy) || 1
            const f = 3 + 40 / (d + 6)
            s.vx = (dx / d) * f
            s.vy = (dy / d) * f - 1
          }
          s.life -= 0.03
        } else if (!reduced) {
          s.vx += (Math.random() - 0.5) * 0.08
          s.vy += (Math.random() - 0.5) * 0.08
          s.vx *= 0.96
          s.vy *= 0.96
          if (s.x < 0 || s.x > w) s.vx *= -1
          if (s.y < 0 || s.y > h) s.vy *= -1
        }
        s.x += s.vx
        s.y += s.vy
        if (s.life <= 0) continue
        alive++
        ctx.globalAlpha = Math.max(0, s.life) * 0.85
        ctx.fillRect(s.x, s.y, 1.2, 1.2)
      }
      if (b && alive === 0) return setGone(true)
      if (!reduced || b) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [gone, reduced])

  const reveal = (x?: number, y?: number) => {
    if (shown) return
    const el = box.current
    blast.current = { x: x ?? (el?.offsetWidth ?? 0) / 2, y: y ?? (el?.offsetHeight ?? 0) / 2 }
    setShown(true)
    if (reduced) setGone(true)
  }

  return (
    <span
      ref={box}
      data-slot="spoiler-text"
      data-shown={shown || undefined}
      className={cn('relative inline-block rounded-sm', !shown && 'bg-current/10', className)}
      {...props}
    >
      <span
        aria-hidden={!shown || undefined}
        className={cn(
          'transition-opacity duration-(--duration-slow,300ms)',
          shown ? 'opacity-100' : 'opacity-0',
        )}
      >
        {children}
      </span>
      {!gone && <canvas ref={canvas} className="pointer-events-none absolute inset-0 size-full" />}
      {/* Over the words until they show: a button, for every way of pressing it. */}
      {!shown && (
        <button
          type="button"
          aria-label={labels.reveal}
          onClick={(event) => {
            const r = box.current?.getBoundingClientRect()
            // A click from the keyboard has no point: the blast comes from the middle.
            if (!r || event.detail === 0) return reveal()
            reveal(event.clientX - r.left, event.clientY - r.top)
          }}
          className="absolute inset-0 cursor-pointer rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
      )}
    </span>
  )
}

export { SpoilerText }
