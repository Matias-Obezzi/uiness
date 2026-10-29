'use client'

import * as React from 'react'
import { useInView } from '@/hooks/use-in-view'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useLocale } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface ActivityRing {
  label: string
  value: number
  goal: number
  /** Like "kcal" or "min". */
  unit?: string
  /** Any CSS colour. Defaults to red, green and cyan, from the outside in. */
  color?: string
}

const COLORS = ['oklch(0.65 0.25 15)', 'oklch(0.85 0.22 135)', 'oklch(0.82 0.14 205)']
const STROKE = 14
const GAP = 3

export interface ActivityRingsProps extends React.ComponentProps<'div'> {
  /** One to three rings, from the outside in. */
  rings: ActivityRing[]
}

/**
 * Activity rings that draw with a count-up when they come into view. A ring past its goal
 * laps itself, the end cap casting a shadow on the lap below. Hover a ring's row to dim the
 * others. Always on black, like the watch, so the bright colours read.
 */
function ActivityRings({ rings, className, ...props }: ActivityRingsProps) {
  const locale = useLocale()
  const reduced = useReducedMotion()
  const box = React.useRef<HTMLDivElement>(null)
  const inView = useInView(box)
  const [grow, setGrow] = React.useState(0)
  const shown = reduced && inView ? 1 : grow
  const [focus, setFocus] = React.useState<number | null>(null)
  const id = React.useId()

  React.useEffect(() => {
    if (!inView || reduced) return
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 1400)
      setGrow(1 - (1 - t) ** 3)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [inView, reduced])

  const size = 2 * (rings.length * (STROKE + GAP)) + 40
  const center = size / 2

  return (
    <div
      ref={box}
      data-slot="activity-rings"
      className={cn(
        'flex flex-wrap items-center gap-6 rounded-3xl bg-zinc-950 p-6 text-white',
        className,
      )}
      {...props}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="size-40 shrink-0" aria-hidden="true">
        <defs>
          <filter id={`${id}-cap`} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodOpacity="0.6" />
          </filter>
        </defs>
        {rings.map((ring, i) => {
          const radius = center - STROKE / 2 - i * (STROKE + GAP)
          const length = 2 * Math.PI * radius
          const share = (ring.value / ring.goal) * shown
          const color = ring.color ?? COLORS[i % COLORS.length]
          return (
            <g
              key={ring.label}
              className="transition-opacity duration-300"
              opacity={focus === null || focus === i ? 1 : 0.25}
            >
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={color}
                strokeOpacity={0.2}
                strokeWidth={STROKE}
              />
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={`${Math.min(share, 1) * length} ${length}`}
                transform={`rotate(-90 ${center} ${center})`}
              />
              {share > 1 && (
                // The lap's end: its last stretch again over the lap below, with a shadow.
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={color}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  strokeDasharray={`${length * 0.04} ${length}`}
                  transform={`rotate(${(share % 1) * 360 - 90 - 0.04 * 360} ${center} ${center})`}
                  filter={`url(#${id}-cap)`}
                />
              )}
            </g>
          )
        })}
      </svg>
      <ul className="flex min-w-36 flex-col gap-3">
        {rings.map((ring, i) => (
          <li
            key={ring.label}
            className="flex flex-col"
            onPointerEnter={() => setFocus(i)}
            onPointerLeave={() => setFocus(null)}
          >
            <span className="font-medium text-sm">{ring.label}</span>
            <span
              className="font-semibold text-xl tabular-nums"
              style={{ color: ring.color ?? COLORS[i % COLORS.length] }}
            >
              {Math.round(ring.value * shown).toLocaleString(locale)}/
              {ring.goal.toLocaleString(locale)}
              {ring.unit && <span className="ml-1 text-sm uppercase">{ring.unit}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export { ActivityRings }
