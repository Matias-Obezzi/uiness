'use client'

import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export type ContactMark = 'pick' | 'strike'

export interface ContactFrame {
  id: string
  src: string
  alt: string
}

export interface ContactSheetLabels {
  /** A frame's button, with its number, description and mark. */
  frame: (n: number, alt: string, mark: ContactMark | null) => string
  /** The tally of picks. */
  picked: (n: number) => string
}

export const defaultContactSheetLabels: ContactSheetLabels = {
  frame: (n, alt, mark) =>
    `Frame ${n}, ${alt}${mark === 'pick' ? ', circled' : mark === 'strike' ? ', struck' : ''}`,
  picked: (n) => `${n} circled`,
}

/** What a press does to a frame: circle it, then strike it, then clear it. */
export function nextMark(mark: ContactMark | null): ContactMark | null {
  return mark === null ? 'pick' : mark === 'pick' ? 'strike' : null
}

/** A hand-drawn loop around a frame: an ellipse that wobbles and overshoots where it closes. */
function loopPath(seed: number) {
  const points: string[] = []
  const turns = 1.12
  for (let i = 0; i <= 48; i++) {
    const t = (i / 48) * turns * Math.PI * 2 - 2.2
    const wobble = 1 + Math.sin(t * 3 + seed) * 0.035 + (i / 48) * 0.05
    points.push(
      `${(50 + Math.cos(t) * 47 * wobble).toFixed(1)},${(50 + Math.sin(t) * 44 * wobble).toFixed(1)}`,
    )
  }
  return `M${points.join('L')}`
}

/** A china marker stroke that draws itself in when it appears. */
function Stroke({ d, width, ms }: { d: string; width: number; ms: number }) {
  const path = React.useRef<SVGPathElement>(null)
  const reduced = useReducedMotion()
  React.useEffect(() => {
    if (!reduced)
      path.current?.animate?.([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
        duration: ms,
        easing: 'ease-out',
      })
  }, [reduced, ms])
  return (
    <path
      ref={path}
      d={d}
      pathLength={1}
      strokeDasharray={1}
      fill="none"
      stroke="oklch(0.6 0.22 27)"
      strokeWidth={width}
      strokeLinecap="round"
    />
  )
}

export interface ContactSheetProps
  extends Omit<React.ComponentProps<'div'>, 'defaultValue' | 'onChange'> {
  frames: ContactFrame[]
  value?: Record<string, ContactMark>
  defaultValue?: Record<string, ContactMark>
  onValueChange?: (value: Record<string, ContactMark>) => void
  labels?: Partial<ContactSheetLabels>
}

/**
 * Pick from a shoot the way photographers do on a contact sheet: press a frame to circle it in
 * red china marker, press again to strike it out, once more to clear it. With a mouse, a loupe
 * follows the pointer to look at the detail first.
 */
function ContactSheet({
  frames,
  value: valueProp,
  defaultValue = {},
  onValueChange,
  labels: labelsProp,
  className,
  ...props
}: ContactSheetProps) {
  const labels = useLabels('contact-sheet', defaultContactSheetLabels, labelsProp)
  const [inner, setInner] = React.useState(defaultValue)
  const value = valueProp ?? inner
  const [loupe, setLoupe] = React.useState<{
    src: string
    x: number
    y: number
    fx: number
    fy: number
  } | null>(null)
  const sheet = React.useRef<HTMLDivElement>(null)
  const picked = Object.values(value).filter((m) => m === 'pick').length

  const mark = (id: string) => {
    const next = { ...value }
    const m = nextMark(value[id] ?? null)
    if (m) next[id] = m
    else delete next[id]
    setInner(next)
    onValueChange?.(next)
  }

  return (
    <div
      data-slot="contact-sheet"
      className={cn('flex w-full flex-col gap-3', className)}
      {...props}
    >
      <div
        ref={sheet}
        className="relative grid grid-cols-3 gap-2 rounded-md bg-neutral-900 p-3"
        onPointerLeave={() => setLoupe(null)}
      >
        {frames.map((frame, i) => {
          const m = value[frame.id] ?? null
          return (
            <button
              key={frame.id}
              type="button"
              aria-label={labels.frame(i + 1, frame.alt, m)}
              onClick={() => mark(frame.id)}
              onPointerMove={(e) => {
                if (e.pointerType !== 'mouse') return
                const r = e.currentTarget.getBoundingClientRect()
                const s = sheet.current?.getBoundingClientRect()
                if (!s) return
                setLoupe({
                  src: frame.src,
                  x: e.clientX - s.left,
                  y: e.clientY - s.top,
                  fx: (e.clientX - r.left) / r.width,
                  fy: (e.clientY - r.top) / r.height,
                })
              }}
              className="group relative flex cursor-zoom-in flex-col gap-1 outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <img
                src={frame.src}
                alt=""
                draggable={false}
                className={cn(
                  'aspect-[3/2] w-full object-cover transition-[filter] duration-300',
                  m === 'strike' && 'brightness-50 grayscale',
                )}
              />
              <span className="self-start font-mono text-[10px] text-amber-200/80">{i + 1}</span>
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
                className="pointer-events-none absolute -top-1.5 -left-1.5 h-[calc(100%+0.75rem)] w-[calc(100%+0.75rem)] overflow-visible"
              >
                {m === 'pick' && <Stroke d={loopPath(i)} width={2.5} ms={450} />}
                {m === 'strike' && <Stroke d="M8,88 C30,62 62,38 94,10" width={3} ms={250} />}
              </svg>
            </button>
          )
        })}
        {loupe && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute z-10 size-36 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-neutral-800 bg-no-repeat shadow-2xl"
            style={{
              left: loupe.x,
              top: loupe.y,
              backgroundImage: `url("${loupe.src}")`,
              backgroundSize: '600% auto',
              backgroundPosition: `${loupe.fx * 100}% ${loupe.fy * 100}%`,
            }}
          />
        )}
      </div>
      <p className="text-muted-foreground text-sm tabular-nums" aria-live="polite">
        {labels.picked(picked)}
      </p>
    </div>
  )
}

export { ContactSheet }
