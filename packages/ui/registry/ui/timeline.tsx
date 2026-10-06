'use client'

import { observeScrollProgress } from '@uiness/scroll'
import * as React from 'react'
import { type ScrollDriver, useScrollDriver, viewTimelineFor } from '@/hooks/use-scroll-driver'
import { cn } from '@/lib/utils'

export interface TimelineProps extends React.ComponentProps<'div'> {
  /** Color of the lit part of the line. Default the primary color. */
  color?: string
  /** Where on the screen the line catches up with the reading position, 0 to 1. Default 0.6. */
  anchor?: number
  /**
   * What lights the line and the dots. `css` runs on CSS scroll-driven animations, without
   * JavaScript; where the browser has none the timeline shows fully lit. `js` measures the
   * scroll with `@uiness/scroll`. `auto` uses CSS where it can and JavaScript elsewhere.
   * Default `auto`.
   */
  driver?: ScrollDriver
}

interface TimelineContextValue {
  anchor: number
  mode: 'css' | 'js'
}

const TimelineContext = React.createContext<TimelineContextValue>({ anchor: 0.6, mode: 'js' })

const useIsoLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect

const subscribe = () => () => {}
/**
 * True on the server and while hydrating its HTML, false for a render that starts on the client.
 * The server HTML starts fully lit, for readers without JavaScript; a client render starts
 * unlit, so nothing fades out on load before the first measurement.
 */
const useFromServer = () =>
  React.useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  )

/** The animation properties shared by every scroll-driven part; the name comes from a class. */
const driven = (timeline: string, range?: string): React.CSSProperties => ({
  animationTimeline: timeline,
  animationRange: range,
  animationDuration: 'auto',
  animationFillMode: 'both',
  animationTimingFunction: 'linear',
})

/**
 * Entries down a vertical line that lights up as you scroll. Each entry's dot turns on
 * when it passes the reading position.
 *
 * Where the browser has CSS scroll-driven animations, the line and the dots follow view
 * timelines and need no JavaScript. Otherwise `@uiness/scroll` measures the progress. Before
 * either runs, the server HTML shows the timeline fully lit.
 */
function Timeline({
  color = 'var(--primary)',
  anchor = 0.6,
  driver = 'auto',
  className,
  style,
  children,
  ...props
}: TimelineProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const mode = useScrollDriver(ref, driver)
  const css = mode === 'css'
  const fromServer = useFromServer()
  const [progress, setProgress] = React.useState(fromServer ? 1 : 0)

  useIsoLayoutEffect(() => {
    const el = ref.current
    if (!el || mode !== 'js') return
    return observeScrollProgress(
      el,
      { offset: [`start ${anchor}`, `end ${anchor}`] },
      ({ progress }) => setProgress(progress),
    )
  }, [mode, anchor])

  const context = React.useMemo(() => ({ anchor, mode }), [anchor, mode])
  const inset = viewTimelineFor([`start ${anchor}`, `end ${anchor}`])?.inset

  return (
    <TimelineContext.Provider value={context}>
      <div
        ref={ref}
        data-slot="timeline"
        data-driver={mode}
        className={cn('relative', className)}
        style={
          {
            '--timeline-color': color,
            ...(css && { viewTimeline: '--timeline block', viewTimelineInset: inset }),
            ...style,
          } as React.CSSProperties
        }
        {...props}
      >
        <div aria-hidden className="absolute top-0 bottom-0 left-4 w-0.5 bg-border md:left-8">
          <div
            data-slot="timeline-progress"
            className={cn(
              'w-full rounded-full transition-[height] duration-150 ease-out motion-reduce:transition-none',
              css && 'supports-[animation-timeline:view()]:[animation-name:timeline-progress]',
            )}
            style={{
              height: `${(progress * 100).toFixed(2)}%`,
              background:
                'linear-gradient(to bottom, color-mix(in oklab, var(--timeline-color) 40%, transparent), var(--timeline-color))',
              ...(css && driven('--timeline')),
            }}
          />
        </div>
        {children}
      </div>
    </TimelineContext.Provider>
  )
}

export interface TimelineItemProps extends Omit<React.ComponentProps<'div'>, 'title'> {
  /** Shown on the left on wide screens, above the content on narrow ones. */
  date?: React.ReactNode
  title?: React.ReactNode
  /** Replaces the dot. */
  icon?: React.ReactNode
}

/**
 * One entry. `data-state` is `active` once its top passes the reading position. With the CSS
 * driver the dot is lit by the stylesheet instead, and `data-state` stays `active`.
 */
function TimelineItem({
  date,
  title,
  icon,
  className,
  style,
  children,
  ...props
}: TimelineItemProps) {
  const { anchor, mode } = React.useContext(TimelineContext)
  const css = mode === 'css'
  const ref = React.useRef<HTMLDivElement>(null)
  const fromServer = useFromServer()
  const [passed, setPassed] = React.useState(fromServer)

  useIsoLayoutEffect(() => {
    const el = ref.current
    if (!el || mode !== 'js') return
    // A zero length trip: 1 once the top of the entry is above the reading position.
    return observeScrollProgress(
      el,
      { offset: [`start ${anchor}`, `start ${anchor}`] },
      ({ progress }) => setPassed(progress >= 1),
    )
  }, [mode, anchor])

  // The viewport shrunk to a line at the anchor: the timeline starts as the top crosses it.
  const inset = viewTimelineFor([`start ${anchor}`, `end ${anchor}`])?.inset

  return (
    <div
      ref={ref}
      data-slot="timeline-item"
      data-state={passed ? 'active' : 'idle'}
      className={cn(
        'group/item relative pb-12 pl-12 last:pb-0 md:grid md:grid-cols-[12rem_1fr] md:gap-8 md:pl-20',
        className,
      )}
      style={
        css
          ? ({ viewTimeline: '--timeline-item block', viewTimelineInset: inset, ...style } as const)
          : style
      }
      {...props}
    >
      <span
        aria-hidden
        data-slot="timeline-dot"
        className={cn(
          'absolute top-1 left-4 flex size-4 -translate-x-1/2 items-center justify-center rounded-full border-2 border-border bg-background transition-colors duration-300 group-data-[state=active]/item:border-(--timeline-color) group-data-[state=active]/item:bg-(--timeline-color) md:left-8 [&_svg]:size-2.5 [&_svg]:text-background',
          css && 'supports-[animation-timeline:view()]:[animation-name:timeline-dot]',
        )}
        // Lights up over the first 2rem of scrolling past the reading position.
        style={css ? driven('--timeline-item', 'cover 0% cover 2rem') : undefined}
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
