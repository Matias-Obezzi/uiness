'use client'

import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface BellButtonLabels {
  subscribe: string
  subscribed: string
}

export const defaultBellButtonLabels: BellButtonLabels = {
  subscribe: 'Subscribe',
  subscribed: 'Subscribed',
}

export interface BellButtonProps extends Omit<React.ComponentProps<'button'>, 'onChange'> {
  subscribed?: boolean
  defaultSubscribed?: boolean
  onSubscribedChange?: (subscribed: boolean) => void
  labels?: Partial<BellButtonLabels>
}

/**
 * A subscribe button whose bell rings when it is turned on: the bell swings on its hook, the
 * clapper swings the other way, lagging, and strikes the rim on each swing until it settles.
 */
function BellButton({
  subscribed,
  defaultSubscribed = false,
  onSubscribedChange,
  labels: labelsProp,
  className,
  onClick,
  ...props
}: BellButtonProps) {
  const labels = useLabels('bell-button', defaultBellButtonLabels, labelsProp)
  const reduced = useReducedMotion()
  const [own, setOwn] = React.useState(defaultSubscribed)
  const on = subscribed ?? own
  const bell = React.useRef<SVGGElement>(null)
  const clapper = React.useRef<SVGGElement>(null)

  const ring = () => {
    if (reduced) return
    // A damped swing: the bell leads, the clapper follows a beat later the other way.
    const swing = [0, 18, -14, 10, -6, 3, 0]
    const opts = { duration: 900, easing: 'ease-out' }
    bell.current?.animate?.(
      swing.map((a) => ({ rotate: `${a}deg` })),
      opts,
    )
    clapper.current?.animate?.(
      swing.map((a) => ({ rotate: `${-a * 1.4}deg` })),
      { ...opts, delay: 60 },
    )
  }

  return (
    <button
      type="button"
      data-slot="bell-button"
      aria-pressed={on}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        const next = !on
        if (subscribed === undefined) setOwn(next)
        onSubscribedChange?.(next)
        if (next) ring()
      }}
      className={cn(
        'inline-flex h-10 items-center gap-2 rounded-full border px-4 font-medium text-sm outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:h-11',
        on
          ? 'border-transparent bg-muted text-foreground'
          : 'bg-primary text-primary-foreground hover:bg-primary/90',
        className,
      )}
      {...props}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 overflow-visible">
        <g ref={bell} style={{ transformOrigin: '12px 3px' }}>
          <path
            d="M12 3a1 1 0 0 1 1 1v.6a6 6 0 0 1 5 5.9v3.8l1.6 2.4a.8.8 0 0 1-.7 1.3H5.1a.8.8 0 0 1-.7-1.3L6 14.3v-3.8a6 6 0 0 1 5-5.9V4a1 1 0 0 1 1-1Z"
            fill={on ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <g ref={clapper} style={{ transformOrigin: '12px 15px' }}>
            <circle cx="12" cy="20.3" r="1.7" fill="currentColor" />
          </g>
        </g>
      </svg>
      {on ? labels.subscribed : labels.subscribe}
    </button>
  )
}

export { BellButton }
