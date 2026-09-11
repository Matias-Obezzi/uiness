'use client'

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------------------------------
 * The scroller itself is a plain overflow-x element with CSS scroll snapping. That is the whole
 * engine: momentum on touch, the wheel, Home and End and the arrow keys all come from the browser
 * already knowing how to scroll, and items keep whatever width they were given because nothing here
 * measures them into a track. The script below only reads the scroll position to light up the
 * controls, and writes it when one is used.
 * -----------------------------------------------------------------------------------------------*/

interface CarouselContextValue {
  scroller: React.RefObject<HTMLUListElement | null>
  active: number
  count: number
  atStart: boolean
  atEnd: boolean
  scrollToIndex: (index: number) => void
  step: (delta: number) => void
  label?: string
}

const CarouselContext = React.createContext<CarouselContextValue | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)
  if (!context) throw new Error('Carousel parts must be used inside <Carousel>')
  return context
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
}

/**
 * A horizontal run of items of any width, snapped as you scroll. Put anything in the items: a
 * picture, a video, a paragraph, a whole card. Sizes are yours to set, and they do not have to
 * match each other.
 */
function Carousel({ label, className, children, ...props }: CarouselProps) {
  const reduced = useReducedMotion()
  const scroller = React.useRef<HTMLUListElement | null>(null)
  const [active, setActive] = React.useState(0)
  const [count, setCount] = React.useState(0)
  const [atStart, setAtStart] = React.useState(true)
  const [atEnd, setAtEnd] = React.useState(false)

  const read = React.useCallback(() => {
    const el = scroller.current
    if (!el) return
    const items = itemsOf(el)
    setCount(items.length)
    setAtStart(el.scrollLeft <= 1)
    setAtEnd(el.scrollLeft >= el.scrollWidth - el.clientWidth - 1)
    setActive(nearestIndex(el))
  }, [])

  React.useEffect(() => {
    const el = scroller.current
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

  const scrollToIndex = React.useCallback(
    (index: number) => {
      const el = scroller.current
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

  const step = React.useCallback(
    (delta: number) => {
      const el = scroller.current
      if (!el) return
      scrollToIndex(nearestIndex(el) + delta)
    },
    [scrollToIndex],
  )

  const value = React.useMemo(
    () => ({ scroller, active, count, atStart, atEnd, scrollToIndex, step, label }),
    [active, count, atStart, atEnd, scrollToIndex, step, label],
  )

  return (
    <CarouselContext.Provider value={value}>
      <section
        data-slot="carousel"
        aria-roledescription="carousel"
        aria-label={label}
        className={cn('relative', className)}
        {...props}
      >
        {children}
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
  const { scroller, label } = useCarousel()
  const [dragging, setDragging] = React.useState(false)
  const origin = React.useRef({ x: 0, scroll: 0, moved: false })

  const onPointerDown = (event: React.PointerEvent<HTMLUListElement>) => {
    // Mouse only. Touch and pen already scroll this natively, and taking those over would throw
    // away the momentum the platform gives for free.
    if (!draggable || event.pointerType !== 'mouse' || event.button !== 0) return
    const el = scroller.current
    if (!el) return
    origin.current = { x: event.clientX, scroll: el.scrollLeft, moved: false }
    setDragging(true)
  }

  const onPointerMove = (event: React.PointerEvent<HTMLUListElement>) => {
    if (!dragging) return
    const el = scroller.current
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
      ref={scroller}
      data-slot="carousel-content"
      data-dragging={dragging ? '' : undefined}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: a region that scrolls has to be focusable, or everything past the first screenful is out of reach by keyboard
      tabIndex={0}
      aria-label={label ? `${label} items` : 'Carousel items'}
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

export type CarouselPreviousProps = React.ComponentProps<'button'>

function CarouselPrevious({ className, ...props }: CarouselPreviousProps) {
  const { step, atStart } = useCarousel()
  return (
    <button
      type="button"
      data-slot="carousel-previous"
      aria-label="Previous"
      disabled={atStart}
      onClick={() => step(-1)}
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-full border border-input bg-background/80 text-foreground backdrop-blur transition-opacity',
        'hover:bg-accent hover:text-accent-foreground',
        'focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
        'disabled:pointer-events-none disabled:opacity-40',
        className,
      )}
      {...props}
    >
      <ChevronLeftIcon className="size-4" />
    </button>
  )
}

export type CarouselNextProps = React.ComponentProps<'button'>

function CarouselNext({ className, ...props }: CarouselNextProps) {
  const { step, atEnd } = useCarousel()
  return (
    <button
      type="button"
      data-slot="carousel-next"
      aria-label="Next"
      disabled={atEnd}
      onClick={() => step(1)}
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-full border border-input bg-background/80 text-foreground backdrop-blur transition-opacity',
        'hover:bg-accent hover:text-accent-foreground',
        'focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
        'disabled:pointer-events-none disabled:opacity-40',
        className,
      )}
      {...props}
    >
      <ChevronRightIcon className="size-4" />
    </button>
  )
}

export type CarouselDotsProps = React.ComponentProps<'div'>

/** One dot per item. They are real buttons, so the run can be jumped through without dragging. */
function CarouselDots({ className, ...props }: CarouselDotsProps) {
  const { count, active, scrollToIndex } = useCarousel()
  if (count < 2) return null
  return (
    <div
      data-slot="carousel-dots"
      className={cn('flex items-center justify-center gap-2', className)}
      {...props}
    >
      {Array.from({ length: count }, (_, i) => (
        <button
          // biome-ignore lint/suspicious/noArrayIndexKey: dots are positional
          key={i}
          type="button"
          aria-label={`Go to item ${i + 1} of ${count}`}
          aria-current={i === active || undefined}
          onClick={() => scrollToIndex(i)}
          className={cn(
            'size-2 rounded-full bg-muted-foreground/30 transition-[background-color,width]',
            'focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
            i === active && 'w-5 bg-foreground',
          )}
        />
      ))}
    </div>
  )
}

export {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselVideo,
}
