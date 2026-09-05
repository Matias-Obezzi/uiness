'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TracingBeamProps extends React.ComponentProps<'div'> {
  /** Color of the lit part of the line. Default the primary color. */
  color?: string
  /** Where on the screen the beam catches up with the reading position, 0 to 1. Default 0.6. */
  anchor?: number
  /** Width of the line in pixels. Default 2. */
  width?: number
}

/**
 * A line beside long content that lights up as far as you have scrolled, with a dot that
 * marks the start. Put it around an article or a changelog.
 */
function TracingBeam({
  color = 'var(--primary)',
  anchor = 0.6,
  width = 2,
  className,
  children,
  ...props
}: TracingBeamProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [height, setHeight] = React.useState(0)
  const [progress, setProgress] = React.useState(0)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setHeight(el.offsetHeight)
    const update = () => {
      const rect = el.getBoundingClientRect()
      const line = window.innerHeight * anchor
      const p = (line - rect.top) / rect.height
      setProgress(Math.max(0, Math.min(1, p)))
    }
    measure()
    update()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      ro.disconnect()
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [anchor])

  const lit = height * progress

  return (
    <div
      ref={ref}
      data-slot="tracing-beam"
      className={cn('relative pl-8', className)}
      style={{ '--beam-color': color } as React.CSSProperties}
      {...props}
    >
      <div aria-hidden className="absolute top-0 bottom-0 left-2" style={{ width }}>
        <div className="absolute inset-0 rounded-full bg-border" />
        <div
          data-slot="tracing-beam-progress"
          className="absolute top-0 right-0 left-0 rounded-full transition-[height] duration-150 ease-out motion-reduce:transition-none"
          style={{
            height: lit,
            background:
              'linear-gradient(to bottom, var(--beam-color), color-mix(in oklab, var(--beam-color) 40%, transparent))',
            boxShadow: '0 0 12px color-mix(in oklab, var(--beam-color) 50%, transparent)',
          }}
        />
        <span
          data-slot="tracing-beam-dot"
          data-state={progress > 0 ? 'active' : 'idle'}
          className="absolute -top-1.5 left-1/2 size-4 -translate-x-1/2 rounded-full border-2 border-border bg-background transition-colors duration-300 data-[state=active]:border-(--beam-color) data-[state=active]:bg-(--beam-color)"
        />
      </div>
      {children}
    </div>
  )
}

export { TracingBeam }
