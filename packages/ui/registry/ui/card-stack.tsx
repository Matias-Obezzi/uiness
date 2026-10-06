'use client'

import * as React from 'react'
import { useInView } from '@/hooks/use-in-view'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface CardStackLabels {
  /** Name of the stack when no `aria-label` is given. */
  region: string
  /** What the stack is announced as. */
  carousel: string
  /** What each card is announced as. */
  slide: string
  /** Name of each card. */
  position: (index: number, count: number) => string
}

export const defaultCardStackLabels: CardStackLabels = {
  region: 'Cards',
  carousel: 'carousel',
  slide: 'slide',
  position: (index, count) => `${index} of ${count}`,
}

export interface CardStackProps extends React.ComponentProps<'section'> {
  /** Send the front card to the back on its own. Default true. */
  autoplay?: boolean
  /** Milliseconds between cards when autoplaying. Default 4000. */
  interval?: number
  /** Hold still while the pointer is over the stack. Default true. */
  pauseOnHover?: boolean
  /** Cards visible behind the front one. Default 2. */
  visible?: number
  /** Pixels each card behind peeks out above the one in front. Default 12. */
  offset?: number
  /** How much smaller each card behind gets. Default 0.06. */
  scaleStep?: number
  /** Milliseconds a card takes to go round. Default 600. */
  duration?: number
  /** Pixels of drag that count as a swipe. Default 80. */
  threshold?: number
  /** Called with the index of the card that comes to the front. */
  onIndexChange?: (index: number) => void
  /** Words to use instead of the English ones. A `LabelsProvider` sets them for the whole app. */
  labels?: Partial<CardStackLabels>
}

/** A card on its way round. `back` is the previous card coming to the front. */
type Toss = { id: number; dir: 1 | -1; phase: 'out' | 'in'; back?: boolean }

/**
 * Cards piled on top of each other. The front one is tossed aside and slips under the pile,
 * every `interval` milliseconds, on click, or when swiped. Arrow keys go forwards and back
 * while the stack has focus. Autoplay is off with reduced motion and cards swap in place.
 */
function CardStack({
  autoplay = true,
  interval = 4000,
  pauseOnHover = true,
  visible = 2,
  offset = 12,
  scaleStep = 0.06,
  duration = 600,
  threshold = 80,
  onIndexChange,
  labels: labelsProp,
  className,
  style,
  children,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  onPointerDown,
  onKeyDown,
  ...props
}: CardStackProps) {
  const ref = React.useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: false, amount: 0.3 })
  const reduced = useReducedMotion()
  const cards = React.Children.toArray(children)
  const count = cards.length
  const [index, setIndex] = React.useState(0)
  const [toss, setToss] = React.useState<Toss | null>(null)
  const [hovered, setHovered] = React.useState(false)
  const [focused, setFocused] = React.useState(false)
  const [drag, setDrag] = React.useState<number | null>(null)
  const start = React.useRef<{ x: number; id: number } | null>(null)
  const moved = React.useRef(false)
  const labels = useLabels('card-stack', defaultCardStackLabels, labelsProp)
  const pointerFocus = React.useRef(false)
  const changeRef = React.useRef(onIndexChange)
  changeRef.current = onIndexChange
  const half = Math.round(duration / 2)

  const go = React.useCallback(
    (dir: 1 | -1) => {
      if (count < 2 || toss) return
      if (reduced) {
        const next = (index + dir + count) % count
        setIndex(next)
        changeRef.current?.(next)
        return
      }
      if (dir === 1) {
        // The front card flies out first; the new index lets the rest move up meanwhile.
        const next = (index + 1) % count
        setToss({ id: index, dir, phase: 'out' })
        setIndex(next)
        changeRef.current?.(next)
      } else {
        // The back card slides out to the side first, then comes in on top.
        setToss({ id: (index - 1 + count) % count, dir, phase: 'out', back: true })
      }
    },
    [count, toss, reduced, index],
  )

  React.useEffect(() => {
    if (!toss) return
    const timer = setTimeout(() => {
      if (toss.phase === 'out' && toss.back) {
        setIndex(toss.id)
        changeRef.current?.(toss.id)
      }
      setToss(toss.phase === 'out' ? { ...toss, phase: 'in' } : null)
    }, half)
    return () => clearTimeout(timer)
  }, [toss, half])

  const paused = (pauseOnHover && hovered) || focused || drag !== null || !inView
  React.useEffect(() => {
    if (!autoplay || reduced || paused || toss || count < 2) return
    const timer = setTimeout(() => go(1), interval)
    return () => clearTimeout(timer)
  }, [autoplay, reduced, paused, toss, count, interval, go])

  const pointerDown = (e: React.PointerEvent<HTMLDivElement>, id: number) => {
    if (e.button !== 0 || id !== index || toss) return
    start.current = { x: e.clientX, id }
    moved.current = false
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const pointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!start.current) return
    const dx = e.clientX - start.current.x
    if (Math.abs(dx) > 4) moved.current = true
    if (moved.current) setDrag(dx)
  }

  const pointerUp = () => {
    if (!start.current) return
    const dx = drag ?? 0
    start.current = null
    setDrag(null)
    if (!moved.current) {
      go(1)
    } else if (Math.abs(dx) > threshold) {
      // A swipe tosses the card the way it was thrown.
      const next = (index + 1) % count
      setToss({ id: index, dir: dx > 0 ? 1 : -1, phase: 'out' })
      setIndex(next)
      changeRef.current?.(next)
    }
  }

  const keyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented) return
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      go(1)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      go(-1)
    }
  }

  return (
    <section
      ref={ref}
      aria-roledescription={labels.carousel}
      aria-label={props['aria-label'] ?? labels.region}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: the stack takes focus so the arrow keys can move it
      tabIndex={0}
      data-slot="card-stack"
      className={cn(
        'relative isolate grid touch-pan-y select-none rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
        className,
      )}
      style={{ paddingTop: Math.min(visible, count - 1) * offset, ...style }}
      onPointerEnter={(e) => {
        onPointerEnter?.(e)
        setHovered(true)
      }}
      onPointerLeave={(e) => {
        onPointerLeave?.(e)
        setHovered(false)
      }}
      onPointerDown={(e) => {
        onPointerDown?.(e)
        pointerFocus.current = true
      }}
      onFocus={(e) => {
        onFocus?.(e)
        // Focus from the keyboard pauses autoplay; a click on a card does not.
        if (e.target === e.currentTarget && !pointerFocus.current) setFocused(true)
        pointerFocus.current = false
      }}
      onBlur={(e) => {
        onBlur?.(e)
        setFocused(false)
        pointerFocus.current = false
      }}
      onKeyDown={keyDown}
      {...props}
    >
      <div aria-live={autoplay && !reduced ? 'off' : 'polite'} className="contents">
        {cards.map((card, id) => {
          const depth = (id - index + count) % count
          const front = depth === 0
          const tossed = toss?.id === id
          let transform = `translateY(${-depth * offset}px) scale(${1 - depth * scaleStep})`
          let z = count - depth
          let opacity = depth > visible ? 0 : 1
          let transition = `transform ${duration}ms var(--easing-emphasized, cubic-bezier(0.16, 1, 0.3, 1)), opacity ${duration}ms ease-out`
          if (tossed && toss.phase === 'out') {
            // Out to the side, still on top when going forwards, still under when coming back.
            transform = `translateX(${toss.dir * 70}%) translateY(-${offset}px) rotate(${toss.dir * 8}deg) scale(0.95)`
            z = toss.back ? 0 : count + 1
            opacity = 1
            transition = `transform ${half}ms var(--easing-standard, cubic-bezier(0.2, 0, 0, 1))`
          } else if (tossed && toss.phase === 'in') {
            z = front ? count + 1 : 0
          }
          if (front && drag !== null) {
            transform = `translateX(${drag}px) rotate(${drag / 20}deg)`
            transition = 'none'
          }
          if (reduced) transition = 'none'
          return (
            // biome-ignore lint/a11y/useSemanticElements: a fieldset would bring its own box model
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: cards are positional
              key={id}
              role="group"
              aria-roledescription={labels.slide}
              aria-label={labels.position(id + 1, count)}
              aria-hidden={!front || undefined}
              inert={!front || undefined}
              data-slot="card-stack-item"
              data-state={front ? 'front' : 'behind'}
              className={cn(
                'origin-top [grid-area:1/1]',
                front ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none',
              )}
              style={{ transform, zIndex: z, opacity, transition }}
              onPointerDown={(e) => pointerDown(e, id)}
              onPointerMove={pointerMove}
              onPointerUp={pointerUp}
              onPointerCancel={pointerUp}
            >
              {card}
            </div>
          )
        })}
      </div>
    </section>
  )
}

export { CardStack }
