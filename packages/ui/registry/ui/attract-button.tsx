'use client'

import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

/** Pixels the field reaches out around the button. */
const MARGIN = 48
/** Pixels between filings. */
const GAP = 12
const LENGTH = 7

/**
 * The direction of a bar magnet's field at a point, the magnet lying along x at the origin:
 * the dipole field, (3(m·r̂)r̂ − m) / r³, as an angle.
 */
export function fieldAngle(x: number, y: number): number {
  const r = Math.hypot(x, y) || 1
  const ux = x / r
  const uy = y / r
  return Math.atan2(3 * ux * uy, 3 * ux * ux - 1)
}

export interface AttractButtonProps extends React.ComponentProps<'button'> {}

/**
 * A call to action in a field of iron filings: each one lines up with the magnetic field around
 * the button, and they lean toward the pointer as it comes near, settling back when it leaves.
 */
function AttractButton({ className, children, ...props }: AttractButtonProps) {
  const reduced = useReducedMotion()
  const wrap = React.useRef<HTMLSpanElement>(null)
  const canvas = React.useRef<HTMLCanvasElement>(null)
  const pointer = React.useRef<{ x: number; y: number } | null>(null)

  React.useEffect(() => {
    const el = canvas.current
    const box = wrap.current
    if (!el || !box) return
    const ctx = el.getContext('2d')
    if (!ctx) return
    let frame = 0
    // How much each filing leans toward the pointer, easing in and out.
    let pull = 0
    const draw = () => {
      const w = box.offsetWidth + MARGIN * 2
      const h = box.offsetHeight + MARGIN * 2
      const dpr = window.devicePixelRatio || 1
      if (el.width !== w * dpr) {
        el.width = w * dpr
        el.height = h * dpr
        el.style.width = `${w}px`
        el.style.height = `${h}px`
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      ctx.strokeStyle = getComputedStyle(el).color
      ctx.lineCap = 'round'
      pull += ((pointer.current ? 1 : 0) - pull) * 0.12
      const cx = w / 2
      const cy = h / 2
      for (let y = GAP / 2; y < h; y += GAP) {
        for (let x = GAP / 2; x < w; x += GAP) {
          // Not over the button itself.
          if (
            Math.abs(x - cx) < box.offsetWidth / 2 + 4 &&
            Math.abs(y - cy) < box.offsetHeight / 2 + 4
          )
            continue
          let angle = fieldAngle(
            (x - cx) / (box.offsetWidth / 2),
            (y - cy) / (box.offsetHeight / 2),
          )
          const p = pointer.current
          if (p && pull > 0.01) {
            const toward = Math.atan2(p.y - y, p.x - x)
            const near = Math.max(0, 1 - Math.hypot(p.x - x, p.y - y) / 140) * pull
            angle += Math.atan2(Math.sin(toward - angle), Math.cos(toward - angle)) * near
          }
          const edge = Math.min(x, y, w - x, h - y) / MARGIN
          ctx.globalAlpha = Math.min(1, edge) * 0.55
          ctx.lineWidth = 1.2
          ctx.beginPath()
          ctx.moveTo(x - (Math.cos(angle) * LENGTH) / 2, y - (Math.sin(angle) * LENGTH) / 2)
          ctx.lineTo(x + (Math.cos(angle) * LENGTH) / 2, y + (Math.sin(angle) * LENGTH) / 2)
          ctx.stroke()
        }
      }
      if (!reduced && (pointer.current || pull > 0.01)) frame = requestAnimationFrame(draw)
    }
    draw()
    const wake = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(draw)
    }
    const area = box.parentElement
    const move = (event: PointerEvent) => {
      const r = el.getBoundingClientRect()
      pointer.current = { x: event.clientX - r.left, y: event.clientY - r.top }
      if (!reduced) wake()
    }
    const leave = () => {
      pointer.current = null
      if (!reduced) wake()
    }
    area?.addEventListener('pointermove', move)
    area?.addEventListener('pointerleave', leave)
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(wake)
    observer?.observe(box)
    return () => {
      cancelAnimationFrame(frame)
      area?.removeEventListener('pointermove', move)
      area?.removeEventListener('pointerleave', leave)
      observer?.disconnect()
    }
  }, [reduced])

  return (
    <span data-slot="attract-button" className="relative inline-flex p-12">
      <canvas ref={canvas} className="pointer-events-none absolute inset-0 text-foreground" />
      <span ref={wrap} className="relative inline-flex">
        <button
          type="button"
          className={cn(
            'inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 font-semibold text-primary-foreground text-sm shadow-md outline-none transition-[scale] hover:scale-[1.03] focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[0.98] motion-reduce:transition-none [&_svg]:size-4',
            className,
          )}
          {...props}
        >
          {children}
        </button>
      </span>
    </span>
  )
}

export { AttractButton }
