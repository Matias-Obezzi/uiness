'use client'

import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface VerticalFeedLabels {
  /** Names the feed. */
  feed: string
}

export const defaultVerticalFeedLabels: VerticalFeedLabels = {
  feed: 'Feed',
}

/** How much of an item has to be on screen for it to be the one playing. */
const ACTIVE_RATIO = 0.6

const articlesOf = (feed: HTMLElement | null) =>
  Array.from(feed?.querySelectorAll<HTMLElement>(':scope > article') ?? [])

export interface VerticalFeedProps extends React.ComponentProps<'div'> {
  /** Called with the index of the item that settles on screen. Load more near the end here. */
  onActiveChange?: (index: number) => void
  /** Play the videos of the item on screen and pause the rest. Default true. */
  autoPlay?: boolean
  labels?: Partial<VerticalFeedLabels>
}

/**
 * A full height feed that snaps one item at a time, swiped up and down like short videos. The
 * item on screen plays its videos and the others pause. Page Down, Page Up and the arrows move
 * one item for the keyboard, and each item is an article of an ARIA feed for screen readers.
 * Give it a height; it fills the screen by default.
 */
function VerticalFeed({
  onActiveChange,
  autoPlay = true,
  labels: labelsProp,
  className,
  children,
  onKeyDown,
  ...props
}: VerticalFeedProps) {
  const labels = useLabels('vertical-feed', defaultVerticalFeedLabels, labelsProp)
  const reduced = useReducedMotion()
  const root = React.useRef<HTMLDivElement>(null)
  const [active, setActive] = React.useState(0)
  const items = React.Children.toArray(children)
  const count = items.length

  // The item mostly on screen is the active one.
  // biome-ignore lint/correctness/useExhaustiveDependencies: observes the articles again when items come or go
  React.useEffect(() => {
    const el = root.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting && entry.intersectionRatio >= ACTIVE_RATIO)
            setActive(Number((entry.target as HTMLElement).dataset.index))
      },
      { root: el, threshold: ACTIVE_RATIO },
    )
    for (const article of articlesOf(el)) observer.observe(article)
    return () => observer.disconnect()
  }, [count])

  const onActiveChangeRef = React.useRef(onActiveChange)
  React.useEffect(() => {
    onActiveChangeRef.current = onActiveChange
  })
  React.useEffect(() => {
    onActiveChangeRef.current?.(active)
  }, [active])

  // biome-ignore lint/correctness/useExhaustiveDependencies: new items bring videos to pause
  React.useEffect(() => {
    if (!autoPlay) return
    articlesOf(root.current).forEach((article, i) => {
      for (const video of article.querySelectorAll('video')) {
        if (i === active) video.play().catch(() => {})
        else video.pause()
      }
    })
  }, [active, autoPlay, count])

  const go = (index: number) => {
    const target = articlesOf(root.current)[Math.max(0, Math.min(count - 1, index))]
    if (!target) return
    target.focus({ preventScroll: true })
    root.current?.scrollTo({ top: target.offsetTop, behavior: reduced ? 'auto' : 'smooth' })
  }

  return (
    <div
      ref={root}
      role="feed"
      aria-label={labels.feed}
      aria-busy={false}
      data-slot="vertical-feed"
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented) return
        // Typing in a field inside an item keeps its keys.
        if ((event.target as HTMLElement).closest('input, textarea, select, [contenteditable]'))
          return
        if (['PageDown', 'ArrowDown', 'j'].includes(event.key)) go(active + 1)
        else if (['PageUp', 'ArrowUp', 'k'].includes(event.key)) go(active - 1)
        else return
        event.preventDefault()
      }}
      className={cn(
        'relative h-dvh snap-y snap-mandatory overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
      {...props}
    >
      {items.map((child, i) => (
        <article
          // Children from toArray carry their own keys.
          key={(child as React.ReactElement).key ?? i}
          data-index={i}
          data-active={i === active || undefined}
          aria-posinset={i + 1}
          aria-setsize={count}
          // biome-ignore lint/a11y/noNoninteractiveTabindex: the ARIA feed pattern makes each article focusable, for Page Down and Page Up
          tabIndex={0}
          className="relative h-full snap-start snap-always overflow-hidden outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset"
        >
          {child}
        </article>
      ))}
    </div>
  )
}

/** The column of round buttons down the right side of an item: like, comment, share. */
function VerticalFeedActions({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="vertical-feed-actions"
      className={cn(
        'absolute right-2 bottom-24 z-10 flex flex-col items-center gap-4 text-white',
        className,
      )}
      {...props}
    />
  )
}

export interface VerticalFeedActionProps extends React.ComponentProps<'button'> {
  /** What the button does, read out with its count. */
  label: string
  /** Shown under the icon, such as "12.4K". */
  count?: React.ReactNode
  /** For toggles like a like: on or off. */
  pressed?: boolean
}

function VerticalFeedAction({
  label,
  count,
  pressed,
  className,
  children,
  ...props
}: VerticalFeedActionProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      data-slot="vertical-feed-action"
      className={cn(
        'group flex min-w-11 flex-col items-center gap-1 rounded-lg font-semibold text-xs outline-none drop-shadow-md focus-visible:ring-[3px] focus-visible:ring-white/60',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className="flex size-11 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm transition-[scale] group-active:scale-90 motion-reduce:transition-none [&_svg]:size-6"
      >
        {children}
      </span>
      <span className="sr-only">{label}</span> {count !== undefined && <span>{count}</span>}
    </button>
  )
}

export { VerticalFeed, VerticalFeedAction, VerticalFeedActions }
