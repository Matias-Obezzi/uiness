'use client'

import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface VerticalFeedLabels {
  /** Names the feed. */
  feed: string
  /** Names the captions box, saying how to move it. */
  captions: string
}

export const defaultVerticalFeedLabels: VerticalFeedLabels = {
  feed: 'Feed',
  captions: 'Captions. Move them with the arrow keys; Home puts them back.',
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

/** How close, in pixels, captions can come to the item's edges. */
const CAPTIONS_EDGE = 8
/** Where the captions were moved to: one place for every item, kept for the next visit. */
const CAPTIONS_KEY = 'uiness:vertical-feed-captions'

type CaptionsPlace = { x: number; y: number }

const captionsListeners = new Set<() => void>()
// Where storage is blocked, the place lasts until the page is left.
let captionsMemory: string | null = null
const captionsStore = {
  subscribe(listener: () => void) {
    captionsListeners.add(listener)
    // Moved in another tab.
    window.addEventListener('storage', listener)
    return () => {
      captionsListeners.delete(listener)
      window.removeEventListener('storage', listener)
    }
  },
  // A string, so reading the same place twice gives the same snapshot.
  get(): string | null {
    try {
      return localStorage.getItem(CAPTIONS_KEY)
    } catch {
      return captionsMemory
    }
  },
  set(place: CaptionsPlace | null) {
    captionsMemory = place && JSON.stringify(place)
    try {
      if (captionsMemory) localStorage.setItem(CAPTIONS_KEY, captionsMemory)
      else localStorage.removeItem(CAPTIONS_KEY)
    } catch {}
    for (const listener of captionsListeners) listener()
  },
}

/** The stored place, as shares of the item's width and height, or null for the default. */
function parsePlace(value: string | null): CaptionsPlace | null {
  try {
    const place = JSON.parse(value ?? 'null')
    const share = (n: unknown) => typeof n === 'number' && n >= 0 && n <= 1
    return place && share(place.x) && share(place.y) ? { x: place.x, y: place.y } : null
  } catch {
    return null
  }
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

export interface VerticalFeedCaptionsProps extends React.ComponentProps<'div'> {
  /** Show the captions. Off, the track is turned off too. Default true. */
  show?: boolean
  labels?: Partial<VerticalFeedLabels>
}

/**
 * The captions of the item's video, drawn here instead of by the browser. Put it in the
 * overlay just before the title: it sits right above it, so they never overlap. Drag it, or
 * focus it and use the arrow keys, to move it anywhere on the item; the place is shared by
 * every item and remembered, and Home or a double click puts it back. While the video plays,
 * each caption is read out. It reads the first captions or subtitles `<track>`.
 */
function VerticalFeedCaptions({
  show = true,
  labels: labelsProp,
  className,
  ...props
}: VerticalFeedCaptionsProps) {
  const labels = useLabels('vertical-feed', defaultVerticalFeedLabels, labelsProp)
  const ref = React.useRef<HTMLDivElement>(null)
  const [text, setText] = React.useState('')
  // What screen readers hear: only cues reached while playing, not every item's first one.
  const [spoken, setSpoken] = React.useState('')
  const stored = React.useSyncExternalStore(captionsStore.subscribe, captionsStore.get, () => null)
  const drag = React.useRef<{ pointer: number; x: number; y: number; from: CaptionsPlace } | null>(
    null,
  )

  React.useEffect(() => {
    const video = ref.current?.closest('article')?.querySelector('video')
    const track = Array.from(video?.textTracks ?? []).find(
      (t) => t.kind === 'captions' || t.kind === 'subtitles',
    )
    if (!video || !track) return
    // Hidden: the cues still load and change, and the browser draws nothing.
    track.mode = show ? 'hidden' : 'disabled'
    if (!show) return
    const update = () => {
      const now = Array.from(track.activeCues ?? [])
        .map((cue) => (cue as VTTCue).text)
        .join('\n')
      setText(now)
      if (!video.paused) setSpoken(now)
    }
    update()
    track.addEventListener('cuechange', update)
    return () => track.removeEventListener('cuechange', update)
  }, [show])

  // Into its place, kept inside the item: again when the text changes its size, or the item.
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new caption or showing it again changes the box to fit
  React.useLayoutEffect(() => {
    const el = ref.current
    const article = el?.closest('article')
    if (!el || !article) return
    const place = parsePlace(stored)
    const put = () => {
      el.style.translate = ''
      if (!place || el.hidden) return
      const box = el.getBoundingClientRect()
      const area = article.getBoundingClientRect()
      const left = clamp(
        area.left + place.x * area.width - box.width / 2,
        area.left + CAPTIONS_EDGE,
        area.right - CAPTIONS_EDGE - box.width,
      )
      const top = clamp(
        area.top + place.y * area.height - box.height / 2,
        area.top + CAPTIONS_EDGE,
        area.bottom - CAPTIONS_EDGE - box.height,
      )
      el.style.translate = `${left - box.left}px ${top - box.top}px`
    }
    put()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(put)
    observer.observe(article)
    return () => observer.disconnect()
  }, [stored, text, show])

  const center = (): CaptionsPlace => {
    const box = ref.current?.getBoundingClientRect()
    return box ? { x: box.left + box.width / 2, y: box.top + box.height / 2 } : { x: 0, y: 0 }
  }

  /** Stores a new center, in pixels, as shares of the item, no closer to its edges than allowed. */
  const moveTo = ({ x, y }: CaptionsPlace) => {
    const box = ref.current?.getBoundingClientRect()
    const area = ref.current?.closest('article')?.getBoundingClientRect()
    if (!box || !area?.width || !area.height) return
    const w = box.width / 2 + CAPTIONS_EDGE
    const h = box.height / 2 + CAPTIONS_EDGE
    captionsStore.set({
      x: clamp((clamp(x, area.left + w, area.right - w) - area.left) / area.width, 0, 1),
      y: clamp((clamp(y, area.top + h, area.bottom - h) - area.top) / area.height, 0, 1),
    })
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const area = ref.current?.closest('article')?.getBoundingClientRect()
    const step = event.shiftKey ? 0.1 : 0.02
    const arrows: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    }
    const arrow = arrows[event.key]
    if (event.key === 'Home' || event.key === 'Escape') captionsStore.set(null)
    else if (arrow && area) {
      const { x, y } = center()
      moveTo({ x: x + arrow[0] * step * area.width, y: y + arrow[1] * step * area.height })
    } else return
    // The feed's own keys stay out of it.
    event.preventDefault()
    event.stopPropagation()
  }

  return (
    // biome-ignore lint/a11y/useSemanticElements: a fieldset is for form controls; this is a box the keyboard moves
    <div
      ref={ref}
      role="group"
      aria-label={labels.captions}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: focusable so the arrow keys can move it
      tabIndex={0}
      hidden={!show}
      data-slot="vertical-feed-captions"
      data-empty={!text || undefined}
      onKeyDown={onKeyDown}
      onDoubleClick={() => captionsStore.set(null)}
      onPointerDown={(event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return
        event.currentTarget.setPointerCapture?.(event.pointerId)
        drag.current = {
          pointer: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          from: center(),
        }
      }}
      onPointerMove={(event) => {
        const d = drag.current
        if (!d || d.pointer !== event.pointerId) return
        moveTo({ x: d.from.x + event.clientX - d.x, y: d.from.y + event.clientY - d.y })
      }}
      onPointerUp={() => {
        drag.current = null
      }}
      onPointerCancel={() => {
        drag.current = null
      }}
      className={cn(
        'mx-auto mb-2 min-h-7 w-fit max-w-full cursor-grab touch-none whitespace-pre-line rounded-md bg-black/75 px-2 py-1 text-center text-sm text-white outline-none select-none focus-visible:ring-[3px] focus-visible:ring-white/60 active:cursor-grabbing',
        // Between captions it stays, unseen, so focus and its place hold.
        'data-empty:opacity-0 data-empty:focus-visible:opacity-100',
        className,
      )}
      {...props}
    >
      <span aria-hidden="true">{text}</span>
      <span aria-live="polite" className="sr-only">
        {spoken}
      </span>
    </div>
  )
}

export { VerticalFeed, VerticalFeedAction, VerticalFeedActions, VerticalFeedCaptions }
