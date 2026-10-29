'use client'

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface StackRow {
  id: string
  label: string
  description?: string
  icon?: React.ReactNode
  /** Shown at the right, such as the current setting. */
  detail?: React.ReactNode
  /** The page it opens. */
  to?: string
  onSelect?: () => void
}

export interface StackPage {
  id: string
  title: string
  rows?: StackRow[]
  /** Anything else, under the rows. */
  content?: React.ReactNode
}

export interface StackPanelLabels {
  /** The back button, with where it goes. */
  back: (to: string) => string
}

export const defaultStackPanelLabels: StackPanelLabels = {
  back: (to) => `Back to ${to}`,
}

/** Movement before a press counts as a swipe. */
const SLOP = 8
/** Share of the width a swipe has to cover to go back. */
const BACK_AT = 0.3

export interface StackPanelProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  pages: StackPage[]
  /** The first page. Default the first in `pages`. */
  root?: string
  labels?: Partial<StackPanelLabels>
}

/**
 * A panel that drills into pages, like settings on a phone. The tapped row's label flies up to
 * become the next page's title, the page slides in from the side, and a swipe to the right, or
 * the back button, goes back. Focus moves to each new title, and back to the row on return.
 */
function StackPanel({ pages, root, labels: labelsProp, className, ...props }: StackPanelProps) {
  const labels = useLabels('stack-panel', defaultStackPanelLabels, labelsProp)
  const reduced = useReducedMotion()
  const [stack, setStack] = React.useState<string[]>([root ?? pages[0]?.id ?? ''])
  const [direction, setDirection] = React.useState<'push' | 'pop' | null>(null)
  const [swipe, setSwipe] = React.useState(0)
  const flight = React.useRef<{ rect: DOMRect; text: string } | null>(null)
  const returnTo = React.useRef<string | null>(null)
  const title = React.useRef<HTMLHeadingElement>(null)
  const body = React.useRef<HTMLDivElement>(null)
  const drag = React.useRef<{
    pointer: number
    x: number
    y: number
    axis: 'x' | 'y' | null
  } | null>(null)

  const page = pages.find((p) => p.id === stack.at(-1))
  const previous = pages.find((p) => p.id === stack.at(-2))

  const push = (row: StackRow, label: HTMLElement) => {
    if (!row.to) return row.onSelect?.()
    flight.current = { rect: label.getBoundingClientRect(), text: row.label }
    returnTo.current = row.id
    setDirection('push')
    setStack((s) => [...s, row.to as string])
  }
  const pop = () => {
    if (stack.length < 2) return
    setDirection('pop')
    setSwipe(0)
    setStack((s) => s.slice(0, -1))
  }

  // The title flies from the row it came from; focus follows the new page.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs after each change of page
  React.useLayoutEffect(() => {
    if (direction === 'push') {
      const from = flight.current
      const to = title.current
      if (from && to && !reduced && typeof to.animate === 'function') {
        const rect = to.getBoundingClientRect()
        to.animate(
          [
            {
              transform: `translate(${from.rect.left - rect.left}px, ${from.rect.top - rect.top}px) scale(${from.rect.height / rect.height})`,
              transformOrigin: '0 0',
            },
            { transform: 'none', transformOrigin: '0 0' },
          ],
          { duration: 320, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
        )
      }
      flight.current = null
      title.current?.focus({ preventScroll: true })
    } else if (direction === 'pop') {
      const row =
        returnTo.current &&
        body.current?.querySelector<HTMLElement>(`[data-row="${returnTo.current}"]`)
      ;(row || title.current)?.focus({ preventScroll: true })
    }
  }, [stack, direction, reduced])

  if (!page) return null
  return (
    <div
      data-slot="stack-panel"
      className={cn(
        'relative flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border bg-card',
        className,
      )}
      {...props}
    >
      <div className="flex h-12 items-center gap-1 border-b px-2">
        {previous && (
          <button
            type="button"
            aria-label={labels.back(previous.title)}
            onClick={pop}
            className="flex h-8 items-center gap-0.5 rounded-md pr-2 text-primary text-sm outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:h-11"
          >
            <ChevronLeftIcon aria-hidden="true" className="size-5" />
            <span className="max-w-24 truncate">{previous.title}</span>
          </button>
        )}
      </div>
      <div
        ref={body}
        key={page.id}
        onPointerDown={(event) => {
          if (stack.length < 2 || (event.pointerType === 'mouse' && event.button !== 0)) return
          drag.current = {
            pointer: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            axis: null,
          }
        }}
        onPointerMove={(event) => {
          const d = drag.current
          if (!d || d.pointer !== event.pointerId) return
          const dx = event.clientX - d.x
          const dy = event.clientY - d.y
          if (d.axis === null) {
            if (Math.abs(dx) > SLOP && dx > Math.abs(dy)) {
              d.axis = 'x'
              event.currentTarget.setPointerCapture?.(event.pointerId)
            } else if (Math.abs(dy) > SLOP || dx < -SLOP) d.axis = 'y'
            return
          }
          if (d.axis === 'x') setSwipe(Math.max(0, dx))
        }}
        onPointerUp={(event) => {
          const d = drag.current
          drag.current = null
          if (d?.axis !== 'x') return
          if (swipe > event.currentTarget.offsetWidth * BACK_AT) pop()
          else setSwipe(0)
        }}
        onPointerCancel={() => {
          drag.current = null
          setSwipe(0)
        }}
        className={cn(
          'touch-pan-y px-3 pt-2 pb-3',
          !reduced &&
            direction === 'push' &&
            'animate-in slide-in-from-right-1/3 fade-in duration-(--duration-slow,300ms)',
          !reduced &&
            direction === 'pop' &&
            'animate-in slide-in-from-left-1/3 fade-in duration-(--duration-slow,300ms)',
          swipe === 0 && 'transition-transform duration-(--duration-normal,200ms)',
        )}
        style={swipe ? { transform: `translateX(${swipe}px)` } : undefined}
      >
        <h3
          ref={title}
          tabIndex={-1}
          className="mb-3 px-1 font-bold text-2xl tracking-tight outline-none"
        >
          {page.title}
        </h3>
        {page.rows && page.rows.length > 0 && (
          <ul className="flex flex-col divide-y overflow-hidden rounded-xl border bg-background">
            {page.rows.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  data-row={row.id}
                  onClick={(event) =>
                    push(row, event.currentTarget.querySelector('[data-label]') as HTMLElement)
                  }
                  className="flex min-h-12 w-full items-center gap-3 px-3 py-2 text-left outline-none hover:bg-accent focus-visible:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset [&>svg]:size-4"
                >
                  {row.icon && (
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted [&_svg]:size-4">
                      {row.icon}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span data-label="" className="block truncate text-sm">
                      {row.label}
                    </span>
                    {row.description && (
                      <span className="block truncate text-muted-foreground text-xs">
                        {row.description}
                      </span>
                    )}
                  </span>
                  {row.detail && (
                    <span className="shrink-0 text-muted-foreground text-sm">{row.detail}</span>
                  )}
                  {row.to && (
                    <ChevronRightIcon
                      aria-hidden="true"
                      className="shrink-0 text-muted-foreground"
                    />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
        {page.content && <div className="mt-3">{page.content}</div>}
      </div>
    </div>
  )
}

export { StackPanel }
