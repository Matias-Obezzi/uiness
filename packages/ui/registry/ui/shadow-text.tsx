'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/** Steps in the long shadow: more is smoother. */
const STEPS = 14

/**
 * Where the sun is, for a time of day: its direction across the sky (0 east at dawn, π west at
 * dusk) and how high it is, from 0 at the horizon to 1 at noon. Below the horizon, `up` is 0.
 */
export function sunAt(hours: number): { across: number; up: number } {
  const share = (hours - 6) / 12
  return {
    across: Math.max(0, Math.min(1, share)) * Math.PI,
    up: Math.max(0, Math.sin(share * Math.PI)),
  }
}

/** A long soft shadow of stacked layers in one direction, `length` pixels long. */
export function longShadow(angle: number, length: number, color: string) {
  return Array.from({ length: STEPS }, (_, i) => {
    const t = (i + 1) / STEPS
    const d = t * length
    return `${(Math.cos(angle) * d).toFixed(1)}px ${(Math.sin(angle) * d).toFixed(1)}px ${(t * length * 0.25).toFixed(1)}px ${color.replace('ALPHA', (0.22 * (1 - t) + 0.02).toFixed(3))}`
  }).join(', ')
}

export interface ShadowTextProps extends React.ComponentProps<'span'> {
  /** The hour it is set to, from 0 to 24. Default the reader's clock. */
  hour?: number
}

/**
 * A headline that works as a sundial: each letter casts a long, soft shadow set by the reader's
 * clock, long and low in the morning and evening, short at noon, faint at night. Bring the
 * pointer close and it turns into a lamp, the shadows falling away from it.
 */
function ShadowText({ hour, className, children, style, ...props }: ShadowTextProps) {
  const box = React.useRef<HTMLSpanElement>(null)
  const [now, setNow] = React.useState<number | null>(null)
  const [lamp, setLamp] = React.useState<{ x: number; y: number } | null>(null)

  React.useEffect(() => {
    if (hour !== undefined) return
    const read = () => {
      const d = new Date()
      setNow(d.getHours() + d.getMinutes() / 60)
    }
    read()
    const timer = window.setInterval(read, 60_000)
    return () => window.clearInterval(timer)
  }, [hour])

  const time = hour ?? now ?? 12
  let shadow: string
  if (lamp) {
    // Away from the lamp, longer the further it is.
    const angle = Math.atan2(-lamp.y, -lamp.x)
    shadow = longShadow(
      angle,
      Math.min(120, 30 + Math.hypot(lamp.x, lamp.y) * 0.35),
      'rgb(0 0 0 / ALPHA)',
    )
  } else {
    const sun = sunAt(time)
    // The sun in the east casts shadows west, down the page a little; low sun, long shadows.
    const angle = Math.PI - sun.across + Math.PI * 0.08
    shadow =
      sun.up > 0
        ? longShadow(angle, 20 + (1 - sun.up) * 90, 'rgb(0 0 0 / ALPHA)')
        : longShadow(Math.PI / 2, 10, 'rgb(0 0 30 / ALPHA)')
  }

  return (
    <span
      ref={box}
      data-slot="shadow-text"
      className={cn('inline-block', className)}
      onPointerMove={(event) => {
        const r = box.current?.getBoundingClientRect()
        if (!r) return
        setLamp({
          x: event.clientX - (r.left + r.width / 2),
          y: event.clientY - (r.top + r.height / 2),
        })
      }}
      onPointerLeave={() => setLamp(null)}
      style={{ textShadow: shadow, ...style }}
      {...props}
    >
      {children}
    </span>
  )
}

export { ShadowText }
