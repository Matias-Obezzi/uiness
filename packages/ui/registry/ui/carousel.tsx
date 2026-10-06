'use client'

import { ChevronLeftIcon, ChevronRightIcon, PauseIcon, PlayIcon } from 'lucide-react'
import * as React from 'react'
import { useInView } from '@/hooks/use-in-view'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface CarouselLabels {
  /** What the carousel is announced as. */
  carousel: string
  /** Name of the list of items, from the carousel's `label` when it has one. */
  items: (label?: string) => string
  previous: string
  next: string
  /** Name of a dot. */
  goTo: (index: number, count: number) => string
  /** Where the run is, read out politely when it moves and is not autoplaying. */
  position: (index: number, count: number) => string
  /** The autoplay toggle while the run is stopped. */
  play: string
  /** The autoplay toggle while the run is moving on its own. */
  pause: string
}

export const defaultCarouselLabels: CarouselLabels = {
  carousel: 'carousel',
  items: (label) => (label ? `${label} items` : 'Carousel items'),
  previous: 'Previous',
  next: 'Next',
  goTo: (index, count) => `Go to item ${index} of ${count}`,
  position: (index, count) => `Item ${index} of ${count}`,
  play: 'Start automatic scrolling',
  pause: 'Pause automatic scrolling',
}

/* -------------------------------------------------------------------------------------------------
 * The scroller itself is a plain overflow-x element with CSS scroll snapping. That is the whole
 * engine: momentum on touch, the wheel, Home and End and the arrow keys all come from the browser
 * already knowing how to scroll, and items keep whatever width they were given because nothing here
 * measures them into a track. The script below only reads the scroll position to light up the
 * controls, and writes it when one is used — or when autoplay asks for the next item.
 * -----------------------------------------------------------------------------------------------*/

/** What `useCarousel()` and `apiRef` give you: where the run is, and how to move it. */
export interface CarouselApi {
  /** Index of the item snapped at the start edge. */
  index: number
  /** How many items the run holds. */
  count: number
  /** Whether `prev()` would move. Always true with `loop` and more than one item. */
  canPrev: boolean
  /** Whether `next()` would move. Always true with `loop` and more than one item. */
  canNext: boolean
  prev: () => void
  next: () => void
  goTo: (index: number) => void
  /** Whether autoplay is on and not stopped by the reader. Hover and focus pause it for a moment
   * without changing this. False when `autoplay` is off or motion is reduced. */
  playing: boolean
  play: () => void
  pause: () => void
}

/** Look of the arrows, dots and play button: on the page, or over a picture. */
export type CarouselControls = 'default' | 'overlay'

interface CarouselContextValue extends CarouselApi {
  scrollerRef: React.RefObject<HTMLUListElement | null>
  /** Autoplay could run here: asked for, motion allowed, more than one item. */
  canAutoplay: boolean
  /** Autoplay is moving the run right now, so the live region stays quiet. */
  rotating: boolean
  controls: CarouselControls
  label?: string
  labels: CarouselLabels
}

const CarouselContext = React.createContext<CarouselContextValue | null>(null)

function useCarouselContext() {
  const context = React.useContext(CarouselContext)
  if (!context) throw new Error('Carousel parts must be used inside <Carousel>')
  return context
}

/**
 * Drive the carousel from any component inside it: where it is, how many items, and the moves.
 * From outside the carousel, pass `apiRef` instead.
 */
function useCarousel(): CarouselApi {
  const { index, count, canPrev, canNext, prev, next, goTo, playing, play, pause } =
    useCarouselContext()
  return { index, count, canPrev, canNext, prev, next, goTo, playing, play, pause }
}

/** Items are the scroller's element children, so a caller can wrap or reorder them freely. */
const itemsOf = (scroller: HTMLElement | null): HTMLElement[] =>
  scroller ? (Array.from(scroller.children) as HTMLElement[]) : []

/**
 * Nearest start edge rather than nearest centre: with items of different widths, the centre of a
 * wide one can sit closer to the viewport centre than the narrow one actually snapped.
 */
function nearestIndex(el: HTMLElement): number {
  const items = itemsOf(el)
  let nearest = 0
  let best = Number.POSITIVE_INFINITY
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (!item) continue
    const distance = Math.abs(item.offsetLeft - el.scrollLeft - el.clientLeft)
    if (distance < best) {
      best = distance
      nearest = i
    }
  }
  return nearest
}

export interface CarouselProps extends React.ComponentProps<'section'> {
  /** Names the carousel for assistive tech. Strongly recommended when there is more than one. */
  label?: string
  /**
   * Move to the next item on its own every `interval` milliseconds. Pauses while the pointer is
   * over the carousel, while keyboard focus is inside it, and while it is off screen; never runs
   * under a reduced motion preference. Render a `CarouselPlayPause` with it. Default false.
   */
  autoplay?: boolean
  /** Milliseconds between items when autoplaying. Default 5000. */
  interval?: number
  /**
   * Wrap around: next from the last item goes to the first, previous from the first goes to the
   * last, and the arrows never disable. Without it, autoplay stops at the end. Default false.
   */
  loop?: boolean
  /**
   * `overlay` styles the arrows, dots and play button to sit over a picture — a dark translucent
   * scrim with white icons — and places them over the run. Default `default`.
   */
  controls?: CarouselControls
  /** Called with the new index whenever the snapped item changes. */
  onIndexChange?: (index: number) => void
  /** Receives the same API as `useCarousel()`, to drive the carousel from outside it. */
  apiRef?: React.Ref<CarouselApi>
  /** Words to use instead of the English ones. A `LabelsProvider` sets them for the whole app. */
  labels?: Partial<CarouselLabels>
}

/**
 * A horizontal run of items of any width, snapped as you scroll. Put anything in the items: a
 * picture, a video, a paragraph, a whole card. Sizes are yours to set, and they do not have to
 * match each other.
 */
function Carousel({
  label,
  autoplay = false,
  interval = 5000,
  loop = false,
  controls = 'default',
  onIndexChange,
  apiRef,
  labels: labelsProp,
  className,
  children,
  onPointerEnter,
  onPointerLeave,
  onPointerDown,
  onFocus,
  onBlur,
  ...props
}: CarouselProps) {
  const labels = useLabels('carousel', defaultCarouselLabels, labelsProp)
  const reduced = useReducedMotion()
  const root = React.useRef<HTMLElement | null>(null)
  const scrollerRef = React.useRef<HTMLUListElement | null>(null)
  const [active, setActive] = React.useState(0)
  const [count, setCount] = React.useState(0)
  const [atStart, setAtStart] = React.useState(true)
  const [atEnd, setAtEnd] = React.useState(false)
  const [stopped, setStopped] = React.useState(false)
  const [hovered, setHovered] = React.useState(false)
  const [focused, setFocused] = React.useState(false)
  const pointerFocus = React.useRef(false)
  const inView = useInView(root, { once: false, amount: 0.25 })

  const read = React.useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const items = itemsOf(el)
    setCount(items.length)
    setAtStart(el.scrollLeft <= 1)
    setAtEnd(el.scrollLeft >= el.scrollWidth - el.clientWidth - 1)
    setActive(nearestIndex(el))
  }, [])

  React.useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    read()

    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        read()
      })
    }
    el.addEventListener('scroll', onScroll, { passive: true })

    // Items arriving late, or the box changing width, both move what counts as active.
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(read) : null
    observer?.observe(el)
    for (const item of itemsOf(el)) observer?.observe(item)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      el.removeEventListener('scroll', onScroll)
      observer?.disconnect()
    }
  }, [read])

  const changeRef = React.useRef(onIndexChange)
  React.useLayoutEffect(() => {
    changeRef.current = onIndexChange
  })
  const firstIndex = React.useRef(true)
  // Nothing is read out until the run has moved once, or every page load would announce it.
  const [moved, setMoved] = React.useState(false)
  React.useEffect(() => {
    if (firstIndex.current) {
      firstIndex.current = false
      return
    }
    setMoved(true)
    changeRef.current?.(active)
  }, [active])

  const goTo = React.useCallback(
    (index: number) => {
      const el = scrollerRef.current
      if (!el) return
      const items = itemsOf(el)
      const target = items[Math.max(0, Math.min(index, items.length - 1))]
      if (!target) return
      el.scrollTo({
        left: target.offsetLeft - el.clientLeft,
        behavior: reduced ? 'auto' : 'smooth',
      })
    },
    [reduced],
  )

  const wraps = loop && count > 1

  // Read from the element rather than from state, so two presses in the same frame still land
  // two items along instead of both starting from the same one.
  const next = React.useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const end = el.scrollLeft >= el.scrollWidth - el.clientWidth - 1
    if (end) {
      if (wraps) goTo(0)
      return
    }
    goTo(nearestIndex(el) + 1)
  }, [goTo, wraps])

  const prev = React.useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    if (el.scrollLeft <= 1) {
      if (wraps) goTo(itemsOf(el).length - 1)
      return
    }
    goTo(nearestIndex(el) - 1)
  }, [goTo, wraps])

  const canAutoplay = autoplay && !reduced && count > 1
  const playing = canAutoplay && !stopped
  const rotating = playing && !hovered && !focused && inView && (wraps || !atEnd)

  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed on `active` too, so each item, including one the reader scrolled to, gets a full interval
  React.useEffect(() => {
    if (!rotating) return
    const timer = setTimeout(next, interval)
    return () => clearTimeout(timer)
  }, [rotating, active, interval, next])

  const play = React.useCallback(() => setStopped(false), [])
  const pause = React.useCallback(() => setStopped(true), [])

  const value = React.useMemo<CarouselContextValue>(
    () => ({
      scrollerRef,
      index: active,
      count,
      canPrev: wraps || !atStart,
      canNext: wraps || !atEnd,
      prev,
      next,
      goTo,
      playing,
      play,
      pause,
      canAutoplay,
      rotating,
      controls,
      label,
      labels,
    }),
    [
      active,
      count,
      wraps,
      atStart,
      atEnd,
      prev,
      next,
      goTo,
      playing,
      play,
      pause,
      canAutoplay,
      rotating,
      controls,
      label,
      labels,
    ],
  )

  React.useImperativeHandle(
    apiRef,
    () => ({
      index: value.index,
      count: value.count,
      canPrev: value.canPrev,
      canNext: value.canNext,
      prev: value.prev,
      next: value.next,
      goTo: value.goTo,
      playing: value.playing,
      play: value.play,
      pause: value.pause,
    }),
    [value],
  )

  return (
    <CarouselContext.Provider value={value}>
      <section
        ref={root}
        data-slot="carousel"
        data-controls={controls}
        aria-roledescription={labels.carousel}
        aria-label={label}
        className={cn('relative', className)}
        onPointerEnter={(event) => {
          onPointerEnter?.(event)
          // A finger lifting is not a pointer resting there, so touch does not pause it.
          if (event.pointerType !== 'touch') setHovered(true)
        }}
        onPointerLeave={(event) => {
          onPointerLeave?.(event)
          setHovered(false)
        }}
        onPointerDown={(event) => {
          onPointerDown?.(event)
          pointerFocus.current = true
        }}
        onFocus={(event) => {
          onFocus?.(event)
          // Keyboard focus inside pauses autoplay: what is being read must not slide away. Focus
          // left on an arrow by a mouse click does not, or the run would stop for good after
          // the first press while the pointer is long gone.
          if (!pointerFocus.current) setFocused(true)
          pointerFocus.current = false
        }}
        onBlur={(event) => {
          onBlur?.(event)
          const to = event.relatedTarget as Node | null
          if (!to || !event.currentTarget.contains(to)) setFocused(false)
        }}
        {...props}
      >
        {children}
        {/* Polite while the reader is the one moving it; off while autoplay is, so items sliding
            by on their own are not read out over whatever else the reader is doing. */}
        <span
          data-slot="carousel-status"
          className="sr-only"
          aria-live={rotating ? 'off' : 'polite'}
          aria-atomic
        >
          {moved && count > 1 ? labels.position(active + 1, count) : null}
        </span>
      </section>
    </CarouselContext.Provider>
  )
}

export interface CarouselContentProps extends React.ComponentProps<'ul'> {
  /** Space between items. Any CSS length. Default `1rem`. */
  gap?: string
  /** Let the pointer drag the run sideways, the way it does on a touch screen. Default true. */
  draggable?: boolean
}

/**
 * The scrolling run. It is focusable on purpose: a region that scrolls has to be reachable by
 * keyboard, or everything past the first screenful is unreachable without a mouse.
 */
function CarouselContent({
  gap = '1rem',
  draggable = true,
  className,
  style,
  children,
  ...props
}: CarouselContentProps) {
  const { scrollerRef, label, labels } = useCarouselContext()
  const [dragging, setDragging] = React.useState(false)
  const origin = React.useRef({ x: 0, scroll: 0, moved: false })

  const onPointerDown = (event: React.PointerEvent<HTMLUListElement>) => {
    // Mouse only. Touch and pen already scroll this natively, and taking those over would throw
    // away the momentum the platform gives for free.
    if (!draggable || event.pointerType !== 'mouse' || event.button !== 0) return
    const el = scrollerRef.current
    if (!el) return
    origin.current = { x: event.clientX, scroll: el.scrollLeft, moved: false }
    setDragging(true)
  }

  const onPointerMove = (event: React.PointerEvent<HTMLUListElement>) => {
    if (!dragging) return
    const el = scrollerRef.current
    if (!el) return
    const dx = event.clientX - origin.current.x
    if (Math.abs(dx) > 3) origin.current.moved = true
    el.scrollLeft = origin.current.scroll - dx
  }

  const endDrag = (event: React.PointerEvent<HTMLUListElement>) => {
    if (!dragging) return
    setDragging(false)
    // A drag that ends over a link must not also follow it.
    if (origin.current.moved) event.preventDefault()
  }

  return (
    <ul
      ref={scrollerRef}
      data-slot="carousel-content"
      data-dragging={dragging ? '' : undefined}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: a region that scrolls has to be focusable, or everything past the first screenful is out of reach by keyboard
      tabIndex={0}
      aria-label={labels.items(label)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={cn(
        'flex list-none snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth p-0',
        'outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
        // Snapping while the pointer drags fights the drag; it is put back on release.
        'data-[dragging]:cursor-grabbing data-[dragging]:snap-none data-[dragging]:select-none',
        'motion-reduce:scroll-auto',
        '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
      style={{ gap, ...style }}
      {...props}
    >
      {children}
    </ul>
  )
}

export interface CarouselItemProps extends React.ComponentProps<'li'> {
  /** Where the item lines up when it snaps. Default `start`. */
  align?: 'start' | 'center'
}

/**
 * One item. Give it whatever width you want — a class, a style, nothing at all and let the
 * content decide. Items in the same carousel are not expected to match.
 */
function CarouselItem({ align = 'start', className, ...props }: CarouselItemProps) {
  return (
    <li
      data-slot="carousel-item"
      className={cn(
        'shrink-0',
        align === 'center' ? 'snap-center' : 'snap-start',
        'snap-always',
        className,
      )}
      {...props}
    />
  )
}

/**
 * A video that only plays while it is on screen, muted and looping, the way a product page uses
 * one. It never plays under a reduced motion preference: it shows its poster and its controls
 * instead, so the content is still reachable without the movement.
 *
 * Its looping is the clip's own `<video loop>`; the carousel's `autoplay` and `loop` move the run
 * and leave the clip alone.
 */
export interface CarouselVideoProps extends React.ComponentProps<'video'> {
  src: string
}

function CarouselVideo({ src, className, poster, ...props }: CarouselVideoProps) {
  const ref = React.useRef<HTMLVideoElement | null>(null)
  // Read on the first render rather than in an effect: a frame of autoplay before the preference
  // is noticed is exactly the motion the preference asked not to see.
  const reduced = useReducedMotion()

  React.useEffect(() => {
    const el = ref.current
    if (!el || reduced) return
    if (typeof IntersectionObserver !== 'function') return

    // Off screen it is paused, not merely invisible: a run of autoplaying videos is a battery
    // and bandwidth bill the reader never agreed to.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        if (entry.isIntersecting) void el.play().catch(() => {})
        else el.pause()
      },
      { threshold: 0.5 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [reduced])

  return (
    <video
      ref={ref}
      data-slot="carousel-video"
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="metadata"
      controls={reduced || undefined}
      className={cn('size-full object-cover', className)}
      {...props}
    />
  )
}

/* -------------------------------------------------------------------------------------------------
 * Controls. The default look uses the theme, like any other button on the page. `overlay` is for
 * controls that sit on a photograph, where the theme cannot help: a photo is light in one corner
 * and dark in the next whatever the color scheme says, so a theme color is legible on some photos
 * and invisible on others. A translucent black scrim under white icons reads on any picture, and
 * the focus ring is drawn twice — white inside, black outside — so it shows on either.
 * -----------------------------------------------------------------------------------------------*/

const buttonLook: Record<CarouselControls, string> = {
  default: cn(
    'border border-input bg-background/80 text-foreground backdrop-blur',
    'hover:bg-accent hover:text-accent-foreground',
    'focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
  ),
  overlay: cn(
    'border border-white/20 bg-black/50 text-white shadow-md backdrop-blur-sm',
    'hover:bg-black/70',
    'focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-2 focus-visible:outline-black/70 focus-visible:outline-offset-2',
  ),
}

const arrowBase =
  'inline-flex size-9 items-center justify-center rounded-full transition-[opacity,background-color] disabled:pointer-events-none disabled:opacity-40'

export interface CarouselArrowProps extends React.ComponentProps<'button'> {
  /** Look of this control. Defaults to the carousel's `controls`. */
  variant?: CarouselControls
}

export type CarouselPreviousProps = CarouselArrowProps

function CarouselPrevious({ variant, className, ...props }: CarouselPreviousProps) {
  const { prev, canPrev, labels, controls } = useCarouselContext()
  const look = variant ?? controls
  return (
    <button
      type="button"
      data-slot="carousel-previous"
      data-variant={look}
      aria-label={labels.previous}
      disabled={!canPrev}
      onClick={prev}
      className={cn(
        arrowBase,
        buttonLook[look],
        look === 'overlay' && 'absolute top-1/2 left-3 z-(--z-raised,10) -translate-y-1/2',
        className,
      )}
      {...props}
    >
      <ChevronLeftIcon className="size-4" />
    </button>
  )
}

export type CarouselNextProps = CarouselArrowProps

function CarouselNext({ variant, className, ...props }: CarouselNextProps) {
  const { next, canNext, labels, controls } = useCarouselContext()
  const look = variant ?? controls
  return (
    <button
      type="button"
      data-slot="carousel-next"
      data-variant={look}
      aria-label={labels.next}
      disabled={!canNext}
      onClick={next}
      className={cn(
        arrowBase,
        buttonLook[look],
        look === 'overlay' && 'absolute top-1/2 right-3 z-(--z-raised,10) -translate-y-1/2',
        className,
      )}
      {...props}
    >
      <ChevronRightIcon className="size-4" />
    </button>
  )
}

export interface CarouselDotsProps extends React.ComponentProps<'div'> {
  /** Look of the dots. Defaults to the carousel's `controls`. */
  variant?: CarouselControls
}

/** One dot per item. They are real buttons, so the run can be jumped through without dragging. */
function CarouselDots({ variant, className, ...props }: CarouselDotsProps) {
  const { count, index, goTo, labels, controls } = useCarouselContext()
  const look = variant ?? controls
  if (count < 2) return null
  const overlay = look === 'overlay'
  return (
    <div
      data-slot="carousel-dots"
      data-variant={look}
      className={cn(
        'flex items-center justify-center gap-2',
        overlay &&
          'absolute bottom-3 left-1/2 z-(--z-raised,10) -translate-x-1/2 rounded-full bg-black/50 px-2.5 py-2 backdrop-blur-sm',
        className,
      )}
      {...props}
    >
      {Array.from({ length: count }, (_, i) => (
        <button
          // biome-ignore lint/suspicious/noArrayIndexKey: dots are positional
          key={i}
          type="button"
          aria-label={labels.goTo(i + 1, count)}
          aria-current={i === index || undefined}
          onClick={() => goTo(i)}
          className={cn(
            'size-2 rounded-full transition-[background-color,width]',
            overlay
              ? cn(
                  'bg-white/50 hover:bg-white/80',
                  'focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-2 focus-visible:outline-black/70 focus-visible:outline-offset-2',
                  i === index && 'w-5 bg-white',
                )
              : cn(
                  'bg-muted-foreground/30',
                  'focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                  i === index && 'w-5 bg-foreground',
                ),
          )}
        />
      ))}
    </div>
  )
}

export interface CarouselPlayPauseProps extends React.ComponentProps<'button'> {
  /** Look of this control. Defaults to the carousel's `controls`. */
  variant?: CarouselControls
}

/**
 * Stops and restarts autoplay. Anything that moves on its own for more than five seconds needs
 * a way to stop it (WCAG 2.2.2), and hover or focus are not that way on a touch screen. Renders
 * nothing when autoplay is off, or cannot run because motion is reduced.
 */
function CarouselPlayPause({ variant, className, onClick, ...props }: CarouselPlayPauseProps) {
  const { canAutoplay, playing, play, pause, labels, controls } = useCarouselContext()
  const look = variant ?? controls
  if (!canAutoplay) return null
  return (
    <button
      type="button"
      data-slot="carousel-play-pause"
      data-variant={look}
      data-state={playing ? 'playing' : 'paused'}
      aria-label={playing ? labels.pause : labels.play}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        if (playing) pause()
        else play()
      }}
      className={cn(
        arrowBase,
        buttonLook[look],
        look === 'overlay' && 'absolute right-3 bottom-3 z-(--z-raised,10) size-8',
        className,
      )}
      {...props}
    >
      {playing ? <PauseIcon className="size-4" /> : <PlayIcon className="size-4" />}
    </button>
  )
}

export {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
  CarouselPlayPause,
  CarouselPrevious,
  CarouselVideo,
  useCarousel,
}
