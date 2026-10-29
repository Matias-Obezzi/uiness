'use client'

import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface PullCordLabels {
  /** Names the switch. */
  light: string
}

export const defaultPullCordLabels: PullCordLabels = {
  light: 'Light',
}

/** Pixels pulled that flip it. */
const PULL_PX = 40
const MAX_PULL = 70
const CORD = 90

export interface PullCordProps extends Omit<React.ComponentProps<'div'>, 'children' | 'onChange'> {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  labels?: Partial<PullCordLabels>
}

/**
 * A lamp switch on a pull cord. Pull the bead down and let go: past a point it clicks and the
 * light flips, and the cord springs back up and swings. It is a switch for the keyboard too:
 * Space or Enter gives it a pull.
 */
function PullCord({
  checked,
  defaultChecked = false,
  onCheckedChange,
  labels: labelsProp,
  className,
  ...props
}: PullCordProps) {
  const labels = useLabels('pull-cord', defaultPullCordLabels, labelsProp)
  const reduced = useReducedMotion()
  const [own, setOwn] = React.useState(defaultChecked)
  const on = checked ?? own
  const [pull, setPull] = React.useState({ x: 0, y: 0 })
  const [dragging, setDragging] = React.useState(false)
  const drag = React.useRef<{ pointer: number; x: number; y: number } | null>(null)
  const cord = React.useRef<SVGGElement>(null)

  const flip = () => {
    const next = !on
    if (checked === undefined) setOwn(next)
    onCheckedChange?.(next)
  }
  // Let go, the cord swings side to side a few times, smaller each time.
  const swing = (from: number) => {
    if (reduced) return
    const frames = [from, -from * 0.6, from * 0.35, -from * 0.18, 0].map((a) => ({
      rotate: `${a}deg`,
    }))
    cord.current?.animate?.(frames, { duration: 900, easing: 'ease-out' })
  }

  const bead = { x: 30 + pull.x, y: CORD + pull.y }

  return (
    <div
      data-slot="pull-cord"
      className={cn('relative inline-flex flex-col items-center', className)}
      {...props}
    >
      <svg
        aria-hidden="true"
        viewBox={`0 0 60 ${CORD + MAX_PULL + 20}`}
        className="w-15 overflow-visible"
        style={{ height: CORD + MAX_PULL + 20 }}
      >
        <g ref={cord} style={{ transformOrigin: '30px 0px' }}>
          <path
            d={`M30 0 Q ${30 + pull.x / 2} ${bead.y / 2} ${bead.x} ${bead.y - 8}`}
            fill="none"
            strokeWidth="1.5"
            className={cn(
              'stroke-muted-foreground',
              !dragging &&
                'transition-[d] duration-(--duration-slow,300ms) ease-(--easing-spring,ease-out)',
            )}
          />
          <circle
            cx={bead.x}
            cy={bead.y}
            r="8"
            className={cn(
              on ? 'fill-amber-400' : 'fill-muted-foreground',
              !dragging &&
                'transition-[cx,cy,fill] duration-(--duration-slow,300ms) ease-(--easing-spring,ease-out)',
            )}
          />
        </g>
      </svg>
      {/* The bead to grab, over the drawn one. */}
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={labels.light}
        onPointerDown={(event) => {
          if (event.pointerType === 'mouse' && event.button !== 0) return
          event.currentTarget.setPointerCapture?.(event.pointerId)
          drag.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY }
          setDragging(true)
        }}
        onPointerMove={(event) => {
          const d = drag.current
          if (!d || d.pointer !== event.pointerId) return
          setPull({
            x: Math.max(-30, Math.min(30, (event.clientX - d.x) * 0.5)),
            y: Math.max(0, Math.min(MAX_PULL, event.clientY - d.y)),
          })
        }}
        onPointerUp={() => {
          if (!drag.current) return
          drag.current = null
          setDragging(false)
          if (pull.y >= PULL_PX) flip()
          swing(Math.max(-14, Math.min(14, pull.x / 2 + (pull.y >= PULL_PX ? 8 : 4))))
          setPull({ x: 0, y: 0 })
        }}
        onPointerCancel={() => {
          drag.current = null
          setDragging(false)
          setPull({ x: 0, y: 0 })
        }}
        onClick={(event) => {
          // A click from the keyboard or a screen reader; a pointer pulls instead.
          if (event.detail !== 0) return
          flip()
          swing(10)
        }}
        className="absolute size-11 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 active:cursor-grabbing"
        style={{ left: bead.x, top: bead.y, transition: dragging ? 'none' : undefined }}
      />
    </div>
  )
}

export { PullCord }
