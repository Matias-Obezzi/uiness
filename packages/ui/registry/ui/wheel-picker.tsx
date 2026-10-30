'use client'

import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

/** Height of one option, in pixels. */
const ROW = 36
/** Options shown above and below the chosen one. */
const AROUND = 3

export interface WheelOption {
  value: string
  label: string
}

export interface WheelPickerProps
  extends Omit<React.ComponentProps<'div'>, 'children' | 'defaultValue'> {
  options: WheelOption[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** Names the wheel. */
  label: string
  /** The wheel goes round: after the last option comes the first again. */
  loop?: boolean
}

/**
 * An iOS-style drum: options sit on a turning cylinder, tilting away above and below the one
 * in the middle. Flick it and it coasts with native momentum, then settles on an option. On the
 * keyboard it is a listbox: the arrows move one, Page Up and Page Down several, Home and End to
 * the ends.
 */
function WheelPicker({
  options,
  value,
  defaultValue,
  onValueChange,
  label,
  loop = false,
  className,
  ...props
}: WheelPickerProps) {
  const reduced = useReducedMotion()
  const [own, setOwn] = React.useState(defaultValue ?? options[0]?.value)
  const current = value ?? own
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === current),
  )
  const drum = React.useRef<HTMLDivElement>(null)
  const [scroll, setScroll] = React.useState(0)
  const id = React.useId()
  // A looping wheel repeats its options; it starts in the middle copy.
  const copies = loop ? 5 : 1
  const list = Array.from({ length: copies }, () => options).flat()
  const base = loop ? options.length * 2 : 0
  const settling = React.useRef(0)
  // A mouse cannot drag native scrolling, so it gets a drag of its own.
  const drag = React.useRef<{ y: number; top: number; samples: [number, number][] } | null>(null)

  const choose = (i: number) => {
    const option = options[((i % options.length) + options.length) % options.length]
    if (!option || option.value === current) return
    if (value === undefined) setOwn(option.value)
    onValueChange?.(option.value)
  }
  const scrollTo = (i: number, smooth: boolean) => {
    drum.current?.scrollTo({ top: i * ROW, behavior: smooth && !reduced ? 'smooth' : 'auto' })
  }

  // Into place at first, and when the value changes from outside.
  // biome-ignore lint/correctness/useExhaustiveDependencies: only the chosen option moves it
  React.useLayoutEffect(() => {
    const el = drum.current
    if (!el) return
    const at = Math.round(el.scrollTop / ROW)
    const want = base + index
    if (((at % options.length) + options.length) % options.length !== index) scrollTo(want, false)
    else if (loop && Math.abs(at - want) > options.length) scrollTo(want, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the chosen option moves it
  }, [index])

  const centre = scroll / ROW

  return (
    <div
      data-slot="wheel-picker"
      className={cn('relative h-[252px] w-full max-w-40 select-none', className)}
      {...props}
    >
      {/* The band the chosen option sits in. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/2 h-9 -translate-y-1/2 rounded-lg bg-muted"
      />
      <div
        ref={drum}
        role="listbox"
        tabIndex={0}
        aria-label={label}
        aria-activedescendant={`${id}-${base + index}`}
        onScroll={(event) => {
          const el = event.currentTarget
          const top = el.scrollTop
          setScroll(top)
          window.clearTimeout(settling.current)
          // Once it stops, the option in the middle is the choice; a loop recentres itself.
          settling.current = window.setTimeout(() => {
            if (drag.current) return
            el.style.scrollSnapType = ''
            const at = Math.round(top / ROW)
            choose(at)
            if (loop && (at < options.length || at >= options.length * 4))
              scrollTo(base + (((at % options.length) + options.length) % options.length), false)
          }, 120)
        }}
        onPointerDown={(event) => {
          if (event.pointerType !== 'mouse' || event.button !== 0) return
          const el = event.currentTarget
          drag.current = {
            y: event.clientY,
            top: el.scrollTop,
            samples: [[event.timeStamp, event.clientY]],
          }
        }}
        onPointerMove={(event) => {
          const d = drag.current
          if (!d) return
          const el = event.currentTarget
          if (el.style.scrollSnapType !== 'none') {
            if (Math.abs(event.clientY - d.y) < 4) return
            // Snapping would pull it back row by row while it follows the pointer.
            el.style.scrollSnapType = 'none'
            el.setPointerCapture(event.pointerId)
          }
          d.samples = [...d.samples.slice(-4), [event.timeStamp, event.clientY]]
          el.scrollTop = d.top - (event.clientY - d.y)
        }}
        onPointerUp={(event) => {
          const d = drag.current
          drag.current = null
          const el = event.currentTarget
          if (!d || el.style.scrollSnapType !== 'none') return
          const first = d.samples[0] as [number, number]
          const speed = (event.clientY - first[1]) / Math.max(16, event.timeStamp - first[0])
          // A flick carries on a little, as native momentum would, then lands on a row.
          const at = Math.round((el.scrollTop - (reduced ? 0 : speed * 240)) / ROW)
          scrollTo(Math.max(0, Math.min(list.length - 1, at)), true)
        }}
        onKeyDown={(event) => {
          const by: Record<string, number> = { ArrowDown: 1, ArrowUp: -1, PageDown: 5, PageUp: -5 }
          let next: number
          if (event.key === 'Home') next = 0
          else if (event.key === 'End') next = options.length - 1
          else if (by[event.key] !== undefined) {
            next = index + (by[event.key] as number)
            next = loop
              ? ((next % options.length) + options.length) % options.length
              : Math.max(0, Math.min(options.length - 1, next))
          } else return
          event.preventDefault()
          choose(next)
          scrollTo(base + next, true)
        }}
        className="relative h-full cursor-grab snap-y snap-mandatory overflow-y-auto active:cursor-grabbing overscroll-contain rounded-lg outline-none [mask-image:linear-gradient(transparent,#000_30%,#000_70%,transparent)] [perspective:600px] [scrollbar-width:none] focus-visible:ring-[3px] focus-visible:ring-ring/50 [&::-webkit-scrollbar]:hidden"
        style={{ paddingBlock: ROW * AROUND }}
      >
        {list.map((option, i) => {
          const offset = i - centre
          const chosen = i === base + index
          return (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: a looping wheel repeats its options
              key={i}
              id={`${id}-${i}`}
              role="option"
              aria-selected={chosen}
              tabIndex={-1}
              onClick={() => {
                choose(i)
                scrollTo(i, true)
              }}
              onKeyDown={() => {}}
              className={cn(
                'flex snap-center items-center justify-center text-lg tabular-nums',
                Math.abs(offset) < 0.5 ? 'font-semibold text-foreground' : 'text-muted-foreground',
              )}
              style={{
                height: ROW,
                // Tilted away like the face of a drum, by how far it is from the middle.
                transform: reduced
                  ? undefined
                  : `rotateX(${Math.max(-75, Math.min(75, -offset * 22))}deg)`,
                opacity: Math.max(0.25, 1 - Math.abs(offset) * 0.22),
              }}
            >
              {option.label}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { WheelPicker }
