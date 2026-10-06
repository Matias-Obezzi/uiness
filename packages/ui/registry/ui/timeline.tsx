import type * as React from 'react'
import { cn } from '@/lib/utils'

export interface TimelineProps extends React.ComponentProps<'div'> {
  /** Color of the lit part of the line. Default the primary color. */
  color?: string
  /** Where on the screen the line catches up with the reading position, 0 to 1. Default 0.6. */
  anchor?: number
}

/** The animation properties shared by every scroll-driven part; the name comes from a class. */
const driven = (timeline: string, range?: string): React.CSSProperties => ({
  animationTimeline: timeline,
  animationRange: range,
  animationDuration: 'auto',
  animationFillMode: 'both',
  animationTimingFunction: 'linear',
})

/** A view timeline cut down to a line across the viewport at `anchor`: 0 is the top. */
const insetAt = (anchor: number) => {
  const at = Math.min(1, Math.max(0, anchor))
  return `${Number((at * 100).toFixed(4))}% ${Number(((1 - at) * 100).toFixed(4))}%`
}

/**
 * Entries down a vertical line that lights up as you scroll. Each entry's dot turns on
 * when it passes the reading position.
 *
 * Pure CSS: the line and the dots follow scroll-driven animations on view timelines, so it
 * runs no JavaScript and works as a server component. Browsers without scroll-driven
 * animations show it fully lit. The layout follows the timeline's own width with container
 * queries: date beside the entry from 42rem, above it below that.
 */
function Timeline({
  color = 'var(--primary)',
  anchor = 0.6,
  className,
  style,
  children,
  ...props
}: TimelineProps) {
  return (
    <div
      data-slot="timeline"
      className={cn('@container/timeline relative', className)}
      style={
        {
          '--timeline-color': color,
          // The entries read it for their own view timelines.
          '--timeline-inset': insetAt(anchor),
          viewTimeline: '--timeline block',
          viewTimelineInset: 'var(--timeline-inset)',
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      <div
        aria-hidden
        className="absolute top-0 bottom-0 left-4 w-0.5 bg-border @2xl/timeline:left-8"
      >
        <div
          data-slot="timeline-progress"
          className="h-full w-full rounded-full supports-[animation-timeline:view()]:[animation-name:timeline-progress]"
          style={{
            background:
              'linear-gradient(to bottom, color-mix(in oklab, var(--timeline-color) 40%, transparent), var(--timeline-color))',
            ...driven('--timeline'),
          }}
        />
      </div>
      {children}
    </div>
  )
}

export interface TimelineItemProps extends Omit<React.ComponentProps<'div'>, 'title'> {
  /** Shown beside the entry on a wide timeline, above it on a narrow one. */
  date?: React.ReactNode
  title?: React.ReactNode
  /** Replaces the dot. */
  icon?: React.ReactNode
}

/** One entry. Its dot lights up over the first 2rem of scrolling past the reading position. */
function TimelineItem({
  date,
  title,
  icon,
  className,
  style,
  children,
  ...props
}: TimelineItemProps) {
  return (
    <div
      data-slot="timeline-item"
      className={cn(
        'relative pb-12 pl-12 last:pb-0 @2xl/timeline:grid @2xl/timeline:grid-cols-[12rem_1fr] @2xl/timeline:gap-8 @2xl/timeline:pl-20',
        className,
      )}
      style={
        {
          viewTimeline: '--timeline-item block',
          viewTimelineInset: 'var(--timeline-inset)',
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      <span
        aria-hidden
        data-slot="timeline-dot"
        className="absolute top-1 left-4 flex size-4 -translate-x-1/2 items-center justify-center rounded-full border-(--timeline-color) border-2 bg-(--timeline-color) @2xl/timeline:left-8 supports-[animation-timeline:view()]:[animation-name:timeline-dot] [&_svg]:size-2.5 [&_svg]:text-background"
        style={driven('--timeline-item', 'cover 0% cover 2rem')}
      >
        {icon}
      </span>
      <div
        data-slot="timeline-heading"
        className="mb-3 @2xl/timeline:sticky @2xl/timeline:top-24 @2xl/timeline:mb-0 @2xl/timeline:self-start"
      >
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
