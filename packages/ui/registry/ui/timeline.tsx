'use client'

import { useScrollProgress } from '@uiness/scroll'
import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TimelineProps extends React.ComponentProps<'div'> {
  /** Color of the lit part of the line. Default the primary color. */
  color?: string
  /** Where on the screen the line catches up with the reading position, 0 to 1. Default 0.6. */
  anchor?: number
}

const AnchorContext = React.createContext(0.6)

/**
 * Entries down a vertical line that lights up as you scroll. Each entry's dot turns on
 * when it passes the reading position.
 */
function Timeline({
  color = 'var(--primary)',
  anchor = 0.6,
  className,
  style,
  children,
  ...props
}: TimelineProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const progress = useScrollProgress(ref, { offset: [`start ${anchor}`, `end ${anchor}`] })
  return (
    <AnchorContext.Provider value={anchor}>
      <div
        ref={ref}
        data-slot="timeline"
        className={cn('relative', className)}
        style={{ '--timeline-color': color, ...style } as React.CSSProperties}
        {...props}
      >
        <div aria-hidden className="absolute top-0 bottom-0 left-4 w-0.5 bg-border md:left-8">
          <div
            data-slot="timeline-progress"
            className="w-full rounded-full transition-[height] duration-150 ease-out motion-reduce:transition-none"
            style={{
              height: `${(progress * 100).toFixed(2)}%`,
              background:
                'linear-gradient(to bottom, color-mix(in oklab, var(--timeline-color) 40%, transparent), var(--timeline-color))',
            }}
          />
        </div>
        {children}
      </div>
    </AnchorContext.Provider>
  )
}

export interface TimelineItemProps extends Omit<React.ComponentProps<'div'>, 'title'> {
  /** Shown on the left on wide screens, above the content on narrow ones. */
  date?: React.ReactNode
  title?: React.ReactNode
  /** Replaces the dot. */
  icon?: React.ReactNode
}

function TimelineItem({ date, title, icon, className, children, ...props }: TimelineItemProps) {
  const anchor = React.useContext(AnchorContext)
  const ref = React.useRef<HTMLDivElement>(null)
  // A zero length trip: 1 once the top of the entry is above the reading position.
  const passed = useScrollProgress(ref, { offset: [`start ${anchor}`, `start ${anchor}`] }) >= 1
  return (
    <div
      ref={ref}
      data-slot="timeline-item"
      data-state={passed ? 'active' : 'idle'}
      className={cn(
        'group/item relative pb-12 pl-12 last:pb-0 md:grid md:grid-cols-[12rem_1fr] md:gap-8 md:pl-20',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        data-slot="timeline-dot"
        className="absolute top-1 left-4 flex size-4 -translate-x-1/2 items-center justify-center rounded-full border-2 border-border bg-background transition-colors duration-300 group-data-[state=active]/item:border-(--timeline-color) group-data-[state=active]/item:bg-(--timeline-color) md:left-8 [&_svg]:size-2.5 [&_svg]:text-background"
      >
        {icon}
      </span>
      <div data-slot="timeline-heading" className="mb-3 md:sticky md:top-24 md:mb-0 md:self-start">
        {date && <p className="text-muted-foreground text-sm">{date}</p>}
        {title && <h3 className="font-semibold text-xl tracking-tight">{title}</h3>}
      </div>
      <div data-slot="timeline-content" className="text-muted-foreground">
        {children}
      </div>
    </div>
  )
}

export { Timeline, TimelineItem }
