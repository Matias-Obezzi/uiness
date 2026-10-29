'use client'

import { XIcon } from 'lucide-react'
import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface ParticleButtonLabels {
  working: string
  done: string
  failed: string
}

export const defaultParticleButtonLabels: ParticleButtonLabels = {
  working: 'Working…',
  done: 'Done',
  failed: 'Something went wrong',
}

type Status = 'idle' | 'working' | 'done' | 'failed'

/** How long the done or failed state stays before the button is ready again. */
const SETTLE_MS = 1800
const PARTICLES = 14

export interface ParticleButtonProps extends Omit<React.ComponentProps<'button'>, 'onClick'> {
  /** The action. A promise shows a spinner until it settles: resolved bursts, rejected shakes. */
  onAction: () => unknown
  /** Shown once it succeeds. Default "Done". */
  doneLabel?: React.ReactNode
  labels?: Partial<ParticleButtonLabels>
}

/**
 * A button for an async action: a spinner while it runs, then a check that draws itself with a
 * burst of particles, or a shake and a cross if it fails, before it is ready again.
 */
function ParticleButton({
  onAction,
  doneLabel,
  labels: labelsProp,
  className,
  children,
  disabled,
  ...props
}: ParticleButtonProps) {
  const labels = useLabels('particle-button', defaultParticleButtonLabels, labelsProp)
  const reduced = useReducedMotion()
  const [status, setStatus] = React.useState<Status>('idle')
  const self = React.useRef<HTMLButtonElement>(null)
  const timer = React.useRef(0)
  const check = React.useRef<SVGPathElement>(null)
  React.useEffect(() => () => window.clearTimeout(timer.current), [])
  // The check draws itself; a failure shakes the button.
  React.useEffect(() => {
    if (reduced) return
    if (status === 'done')
      check.current?.animate?.([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
        duration: 350,
        easing: 'ease-out',
        fill: 'both',
      })
    if (status === 'failed')
      self.current?.animate?.(
        [
          { translate: '0' },
          { translate: '-4px' },
          { translate: '4px' },
          { translate: '-4px' },
          { translate: '0' },
        ],
        { duration: 400 },
      )
  }, [status, reduced])

  const burst = () => {
    const el = self.current
    if (!el || reduced || typeof el.animate !== 'function') return
    const box = el.getBoundingClientRect()
    for (let i = 0; i < PARTICLES; i++) {
      const dot = document.createElement('span')
      const angle = (i / PARTICLES) * Math.PI * 2 + Math.random() * 0.4
      const distance = 28 + Math.random() * 26
      const size = 3 + Math.random() * 4
      Object.assign(dot.style, {
        position: 'fixed',
        left: `${box.left + box.width / 2}px`,
        top: `${box.top + box.height / 2}px`,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '9999px',
        background: `oklch(0.72 0.17 ${140 + Math.random() * 40})`,
        pointerEvents: 'none',
        zIndex: '100',
      })
      document.body.appendChild(dot)
      const x = Math.cos(angle) * (distance + box.width / 3)
      const y = Math.sin(angle) * distance
      dot
        .animate(
          [
            { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
            {
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(0.2)`,
              opacity: 0,
            },
          ],
          { duration: 600 + Math.random() * 300, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
        )
        .finished.finally(() => dot.remove())
    }
  }

  const run = async () => {
    if (status !== 'idle') return
    setStatus('working')
    let next: Status = 'done'
    try {
      await onAction()
    } catch {
      next = 'failed'
    }
    setStatus(next)
    if (next === 'done') burst()
    timer.current = window.setTimeout(() => setStatus('idle'), SETTLE_MS)
  }

  return (
    <button
      ref={self}
      type="button"
      data-slot="particle-button"
      data-status={status}
      aria-disabled={status !== 'idle' || undefined}
      disabled={disabled}
      onClick={run}
      className={cn(
        'relative inline-flex h-10 min-w-32 items-center justify-center gap-2 rounded-full px-5 font-medium text-sm outline-none transition-[background-color,color,scale] duration-(--duration-normal,200ms) focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[0.97] disabled:opacity-50 motion-reduce:transition-none pointer-coarse:h-11 [&_svg]:size-4',
        status === 'done'
          ? 'bg-emerald-600 text-white'
          : status === 'failed'
            ? 'bg-destructive text-white'
            : 'bg-primary text-primary-foreground',
        className,
      )}
      {...props}
    >
      {status === 'working' ? (
        <>
          <span
            aria-hidden="true"
            className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
          />
          {labels.working}
        </>
      ) : status === 'done' ? (
        <>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path ref={check} d="M5 12.5l4.5 4.5L19 7.5" pathLength={1} strokeDasharray="1" />
          </svg>
          {doneLabel ?? labels.done}
        </>
      ) : status === 'failed' ? (
        <>
          <XIcon aria-hidden="true" />
          {labels.failed}
        </>
      ) : (
        children
      )}
      <span className="sr-only" aria-live="polite">
        {status === 'done' ? labels.done : status === 'failed' ? labels.failed : ''}
      </span>
    </button>
  )
}

export { ParticleButton }
