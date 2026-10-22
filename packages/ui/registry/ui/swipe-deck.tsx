'use client'

import { HeartIcon, StarIcon, Undo2Icon, XIcon } from 'lucide-react'
import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export type SwipeDirection = 'left' | 'right' | 'up'

export interface SwipeDeckLabels {
  /** Names the deck. */
  deck: string
  /** Swiping right, on its button and on the stamp over the card. */
  like: string
  /** Swiping left. */
  nope: string
  /** Swiping up. */
  superLike: string
  undo: string
  /** Announced after a card goes. */
  result: (direction: SwipeDirection) => string
}

export const defaultSwipeDeckLabels: SwipeDeckLabels = {
  deck: 'Cards',
  like: 'Like',
  nope: 'Nope',
  superLike: 'Super like',
  undo: 'Undo',
  result: (direction) =>
    direction === 'right' ? 'Liked' : direction === 'left' ? 'Passed' : 'Super liked',
}

/** Movement before a press counts as a swipe, or is left to the page as a scroll. */
const SLOP = 8
/** How far across the card, as a share of its width or height, a swipe has to go to count. */
const THRESHOLD = 0.3
/** How far ahead, in milliseconds, the release speed carries the card when deciding. */
const PROJECT_MS = 200
/** Only the movement in this many milliseconds before release counts towards the speed. */
const VELOCITY_WINDOW = 100
const FLY_MS = 300
/** Cards drawn in the stack, the top one included. */
const STACK = 3

export interface SwipeDeckProps<T extends { id: string }>
  extends Omit<React.ComponentProps<'section'>, 'children'> {
  /** The cards, top first. The deck keeps track of the ones swiped, so keep them in the list. */
  items: T[]
  /** Draws a card's face. */
  children: (item: T) => React.ReactNode
  /** Called as a card goes. */
  onSwipe?: (item: T, direction: SwipeDirection) => void
  /** Called when undo brings a card back. */
  onUndo?: (item: T, direction: SwipeDirection) => void
  /** Allow swiping up, with its own button. Default false. */
  superLike?: boolean
  /** Show the undo button. Default true. */
  undo?: boolean
  /** Shown once every card is gone. */
  empty?: React.ReactNode
  labels?: Partial<SwipeDeckLabels>
}

type Point = { x: number; y: number }

/**
 * A stack of cards to sort one at a time: drag the top card right to like it, left to pass, or
 * up for a super like. It tilts as it follows the finger, a stamp says what letting go will do,
 * and it flies off past the threshold or on a quick flick, or springs back. The buttons and the
 * arrow keys do the same for the keyboard, screen readers and anyone who would rather not drag.
 */
function SwipeDeck<T extends { id: string }>({
  items,
  children,
  onSwipe,
  onUndo,
  superLike = false,
  undo = true,
  empty,
  labels: labelsProp,
  className,
  ...props
}: SwipeDeckProps<T>) {
  const labels = useLabels('swipe-deck', defaultSwipeDeckLabels, labelsProp)
  const reduced = useReducedMotion()
  const stage = React.useRef<HTMLDivElement>(null)
  const [history, setHistory] = React.useState<{ id: string; direction: SwipeDirection }[]>([])
  const [offset, setOffset] = React.useState<Point>({ x: 0, y: 0 })
  const [dragging, setDragging] = React.useState(false)
  const [flying, setFlying] = React.useState(false)
  const [announcement, setAnnouncement] = React.useState('')
  const drag = React.useRef<{
    pointer: number
    start: Point
    started: boolean
    samples: [number, number, number][]
  } | null>(null)
  const suppressClick = React.useRef(false)

  const gone = new Set(history.map((h) => h.id))
  const remaining = items.filter((item) => !gone.has(item.id))
  const top = remaining[0]
  const size = () => ({
    width: stage.current?.offsetWidth || 320,
    height: stage.current?.offsetHeight || 420,
  })
  // The stage's size for rendering, kept in state: render cannot measure the DOM.
  const [box, setBox] = React.useState({ width: 320, height: 420 })
  React.useLayoutEffect(() => {
    const el = stage.current
    if (!el) return
    const measure = () => setBox({ width: el.offsetWidth || 320, height: el.offsetHeight || 420 })
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  /** Where a card ends up, well off the stage, for a direction. */
  const away = (direction: SwipeDirection, from: Point): Point => {
    const { width, height } = size()
    if (direction === 'up') return { x: from.x, y: -height * 1.5 }
    return { x: (direction === 'right' ? 1 : -1) * width * 1.5, y: from.y }
  }

  const swipe = (direction: SwipeDirection, from: Point = offset) => {
    if (!top || flying) return
    const done = () => {
      setHistory((prev) => [...prev, { id: top.id, direction }])
      setOffset({ x: 0, y: 0 })
      setFlying(false)
      setAnnouncement(labels.result(direction))
      onSwipe?.(top, direction)
    }
    if (reduced) return done()
    setFlying(true)
    setOffset(away(direction, from))
    window.setTimeout(done, FLY_MS)
  }

  const back = () => {
    const last = history.at(-1)
    const item = last && items.find((i) => i.id === last.id)
    if (!last || !item || flying) return
    setHistory((prev) => prev.slice(0, -1))
    setAnnouncement('')
    onUndo?.(item, last.direction)
    if (reduced) return
    // In from where it left: placed there with no transition, then let go on the next frames.
    setDragging(true)
    setOffset(away(last.direction, { x: 0, y: 0 }))
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setDragging(false)
        setOffset({ x: 0, y: 0 })
      }),
    )
  }

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (flying || (event.pointerType === 'mouse' && event.button !== 0)) return
    if ((event.target as HTMLElement).closest('[data-swipe-ignore]')) return
    drag.current = {
      pointer: event.pointerId,
      start: { x: event.clientX, y: event.clientY },
      started: false,
      samples: [[event.timeStamp, event.clientX, event.clientY]],
    }
  }

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || d.pointer !== event.pointerId) return
    const dx = event.clientX - d.start.x
    const dy = event.clientY - d.start.y
    if (!d.started) {
      if (Math.hypot(dx, dy) <= SLOP) return
      // Without super like, a mostly vertical press is the page scrolling.
      if (!superLike && Math.abs(dy) > Math.abs(dx)) {
        drag.current = null
        return
      }
      d.started = true
      event.currentTarget.setPointerCapture?.(event.pointerId)
      setDragging(true)
    }
    event.preventDefault()
    d.samples.push([event.timeStamp, event.clientX, event.clientY])
    if (d.samples.length > 6) d.samples.shift()
    setOffset({ x: dx, y: dy })
  }

  const finishDrag = (event: React.PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const d = drag.current
    if (!d || d.pointer !== event.pointerId) return
    drag.current = null
    if (!d.started) return
    suppressClick.current = true
    setDragging(false)
    const current = { x: event.clientX - d.start.x, y: event.clientY - d.start.y }
    // Speed over the last moments before release; a finger that stopped has none.
    const recent = d.samples.filter(([t]) => event.timeStamp - t <= VELOCITY_WINDOW)
    const first = recent[0]
    const span = first ? Math.max(event.timeStamp - first[0], 16) : 0
    const moving = !cancelled && first && recent.length > 1
    const projected = {
      x: current.x + (moving ? ((event.clientX - first[1]) / span) * PROJECT_MS : 0),
      y: current.y + (moving ? ((event.clientY - first[2]) / span) * PROJECT_MS : 0),
    }
    const { width, height } = size()
    if (cancelled) setOffset({ x: 0, y: 0 })
    else if (superLike && -projected.y > height * THRESHOLD && -projected.y > Math.abs(projected.x))
      swipe('up', current)
    else if (Math.abs(projected.x) > width * THRESHOLD)
      swipe(projected.x > 0 ? 'right' : 'left', current)
    else setOffset({ x: 0, y: 0 })
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowRight') swipe('right')
    else if (event.key === 'ArrowLeft') swipe('left')
    else if (event.key === 'ArrowUp' && superLike) swipe('up')
    else return
    event.preventDefault()
  }

  // How sure the top card is of each way, 0 to 1, for its stamps and the cards behind it.
  const { width, height } = box
  const toward = (n: number, of: number) => Math.min(1, Math.max(0, n / (of * THRESHOLD)))
  const likeness = toward(offset.x, width)
  const nopeness = toward(-offset.x, width)
  const upness = superLike ? toward(-offset.y, height) : 0
  const progress = Math.max(likeness, nopeness, upness)
  const rotate = Math.max(-30, Math.min(30, offset.x / 16))

  return (
    <section
      data-slot="swipe-deck"
      aria-label={labels.deck}
      onKeyDown={onKeyDown}
      className={cn('mx-auto flex w-full max-w-sm flex-col items-center gap-5', className)}
      {...props}
    >
      <div ref={stage} data-slot="swipe-deck-stage" className="relative mb-6 aspect-3/4 w-full">
        {remaining.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl border border-dashed p-6 text-center text-muted-foreground text-sm">
            {empty}
          </div>
        )}
        {remaining
          .slice(0, STACK)
          .map((item, i) => {
            const isTop = i === 0
            // Cards behind sit smaller and lower, and rise as the top one is pulled away.
            const depth = Math.max(0, i - progress)
            const transform = isTop
              ? `translate3d(${offset.x}px, ${offset.y}px, 0) rotate(${rotate}deg)`
              : `translate3d(0, ${depth * 12}px, 0) scale(${1 - depth * 0.05})`
            return (
              <div
                key={item.id}
                data-slot="swipe-deck-card"
                aria-hidden={!isTop || undefined}
                inert={!isTop || undefined}
                className={cn(
                  'absolute inset-0 overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-lg will-change-transform',
                  isTop && 'cursor-grab touch-pan-y select-none active:cursor-grabbing',
                  isTop && superLike && 'touch-none',
                  !dragging &&
                    'transition-transform duration-(--duration-slow,300ms) motion-reduce:transition-none',
                  !dragging &&
                    (flying && isTop
                      ? 'ease-(--easing-exit,cubic-bezier(0.3,0,0.8,0.15))'
                      : 'ease-(--easing-spring,cubic-bezier(0.2,0,0,1))'),
                )}
                style={{ transform, transformOrigin: '50% 100%', zIndex: STACK - i }}
                {...(isTop && {
                  onPointerDown,
                  onPointerMove,
                  onPointerUp: (event: React.PointerEvent<HTMLDivElement>) =>
                    finishDrag(event, false),
                  onPointerCancel: (event: React.PointerEvent<HTMLDivElement>) =>
                    finishDrag(event, true),
                  onClickCapture: (event: React.MouseEvent) => {
                    // The click that ends a drag is not a tap on the card.
                    if (!suppressClick.current) return
                    suppressClick.current = false
                    event.preventDefault()
                    event.stopPropagation()
                  },
                  onDragStart: (event: React.DragEvent) => event.preventDefault(),
                })}
              >
                {children(item)}
                {isTop && (
                  <>
                    <Stamp
                      className="top-8 left-6 -rotate-12 border-emerald-500 text-emerald-500"
                      style={{ opacity: likeness }}
                    >
                      {labels.like}
                    </Stamp>
                    <Stamp
                      className="top-8 right-6 rotate-12 border-rose-500 text-rose-500"
                      style={{ opacity: nopeness }}
                    >
                      {labels.nope}
                    </Stamp>
                    {superLike && (
                      <Stamp
                        className="bottom-16 left-1/2 -translate-x-1/2 -rotate-6 border-sky-500 text-sky-500"
                        style={{ opacity: upness }}
                      >
                        {labels.superLike}
                      </Stamp>
                    )}
                  </>
                )}
              </div>
            )
          })
          .reverse()}
      </div>

      <div className="flex items-center justify-center gap-4">
        {undo && (
          <RoundButton label={labels.undo} size="sm" disabled={history.length === 0} onClick={back}>
            <Undo2Icon className="text-amber-500" />
          </RoundButton>
        )}
        <RoundButton label={labels.nope} disabled={!top} onClick={() => swipe('left')}>
          <XIcon className="text-rose-500" />
        </RoundButton>
        {superLike && (
          <RoundButton
            label={labels.superLike}
            size="sm"
            disabled={!top}
            onClick={() => swipe('up')}
          >
            <StarIcon className="fill-sky-500 text-sky-500" />
          </RoundButton>
        )}
        <RoundButton label={labels.like} disabled={!top} onClick={() => swipe('right')}>
          <HeartIcon className="fill-emerald-500 text-emerald-500" />
        </RoundButton>
      </div>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </section>
  )
}

function Stamp({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute rounded-lg border-4 bg-background/30 px-3 py-1 font-black text-3xl uppercase tracking-wider',
        className,
      )}
      {...props}
    />
  )
}

function RoundButton({
  label,
  size = 'lg',
  ...props
}: React.ComponentProps<'button'> & { label: string; size?: 'sm' | 'lg' }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        'flex items-center justify-center rounded-full border bg-background shadow-md outline-none transition-[scale,box-shadow] hover:scale-105 focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-95 disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none',
        size === 'lg' ? 'size-14 [&_svg]:size-7' : 'size-11 [&_svg]:size-5',
      )}
      {...props}
    />
  )
}

export { SwipeDeck }
