'use client'

import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

export type FlipCardTrigger = 'hover' | 'click' | 'manual'
export type FlipCardDirection = 'horizontal' | 'vertical'

interface FlipCardContextValue {
  flipped: boolean
  direction: FlipCardDirection
  reduced: boolean
}

const FlipCardContext = React.createContext<FlipCardContextValue>({
  flipped: false,
  direction: 'horizontal',
  reduced: false,
})

export interface FlipCardProps extends React.ComponentProps<'div'> {
  /** What turns it over. `manual` leaves it to `flipped`. Default hover. */
  trigger?: FlipCardTrigger
  /** Turn around the vertical axis, or tip over the horizontal one. Default horizontal. */
  direction?: FlipCardDirection
  /** Show the back, controlled. */
  flipped?: boolean
  /** Show the back first, uncontrolled. */
  defaultFlipped?: boolean
  onFlippedChange?: (flipped: boolean) => void
  /** Milliseconds for the turn. Default 700. */
  duration?: number
  /** Perspective in pixels. Lower looks more dramatic. Default 1200. */
  perspective?: number
}

const INTERACTIVE = 'a[href], button, input, select, textarea, label, [role=button], [tabindex]'

/**
 * A card with two faces that turns over in 3D. With `hover` or `click` it is a toggle
 * button for keyboards and touch, so keep links and buttons off its faces; with `manual`
 * you drive it through `flipped` and the faces can hold anything. The face out of view is
 * inert. With reduced motion the faces cross-fade instead.
 */
function FlipCard({
  trigger = 'hover',
  direction = 'horizontal',
  flipped: flippedProp,
  defaultFlipped = false,
  onFlippedChange,
  duration = 700,
  perspective = 1200,
  className,
  style,
  children,
  onClick,
  onKeyDown,
  onPointerDown,
  onPointerEnter,
  onPointerLeave,
  ...props
}: FlipCardProps) {
  const reduced = useReducedMotion()
  const [own, setOwn] = React.useState(defaultFlipped)
  const flipped = flippedProp ?? own
  const interactive = trigger !== 'manual'
  const pointer = React.useRef('')

  const set = (next: boolean) => {
    if (next === flipped) return
    if (flippedProp === undefined) setOwn(next)
    onFlippedChange?.(next)
  }

  const click = (e: React.MouseEvent<HTMLDivElement>) => {
    onClick?.(e)
    if (!interactive || e.defaultPrevented) return
    // A mouse already turned a hover card over by pointing at it.
    if (trigger === 'hover' && pointer.current === 'mouse') return
    // Leave clicks on anything interactive inside the card alone.
    const inner = (e.target as Element).closest(INTERACTIVE)
    if (inner && inner !== e.currentTarget) return
    set(!flipped)
  }

  const key = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (!interactive || e.target !== e.currentTarget) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      set(!flipped)
    }
  }

  const down = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerDown?.(e)
    pointer.current = e.pointerType
  }

  const enter = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerEnter?.(e)
    if (trigger === 'hover' && e.pointerType === 'mouse') set(true)
  }

  const leave = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerLeave?.(e)
    if (trigger === 'hover' && e.pointerType === 'mouse') set(false)
  }

  const axis = direction === 'vertical' ? 'rotateX' : 'rotateY'
  const context = React.useMemo(
    () => ({ flipped, direction, reduced }),
    [flipped, direction, reduced],
  )

  return (
    <FlipCardContext.Provider value={context}>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: it is a toggle button unless the trigger is manual */}
      {/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: aria-pressed comes with role button */}
      <div
        data-slot="flip-card"
        data-state={flipped ? 'flipped' : 'front'}
        data-trigger={trigger}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-pressed={interactive ? flipped : undefined}
        className={cn(
          'group/flip-card relative [perspective:var(--perspective)]',
          interactive &&
            'cursor-pointer rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
          className,
        )}
        style={{ '--perspective': `${perspective}px`, ...style } as React.CSSProperties}
        onClick={click}
        onKeyDown={key}
        onPointerDown={down}
        onPointerEnter={enter}
        onPointerLeave={leave}
        {...props}
      >
        <div
          data-slot="flip-card-inner"
          className="grid size-full transition-transform [transform-style:preserve-3d]"
          style={{
            transform: !reduced && flipped ? `${axis}(180deg)` : undefined,
            transitionDuration: `${duration}ms`,
            transitionTimingFunction: 'var(--easing-emphasized, cubic-bezier(0.16, 1, 0.3, 1))',
          }}
        >
          {children}
        </div>
      </div>
    </FlipCardContext.Provider>
  )
}

function useFace(back: boolean) {
  const { flipped, direction, reduced } = React.useContext(FlipCardContext)
  const hidden = back !== flipped
  const axis = direction === 'vertical' ? 'rotateX' : 'rotateY'
  return {
    hidden,
    className: cn(
      '[grid-area:1/1] rounded-xl border bg-card text-card-foreground shadow-sm [backface-visibility:hidden]',
      reduced && 'transition-opacity duration-(--duration-slow,300ms)',
      reduced && hidden && 'opacity-0',
    ),
    transform: back && !reduced ? `${axis}(180deg)` : undefined,
  }
}

/** The side of a `FlipCard` you see first. */
function FlipCardFront({ className, style, ...props }: React.ComponentProps<'div'>) {
  const face = useFace(false)
  return (
    <div
      data-slot="flip-card-front"
      aria-hidden={face.hidden || undefined}
      inert={face.hidden}
      className={cn(face.className, className)}
      style={style}
      {...props}
    />
  )
}

/** The side of a `FlipCard` you see once it turns over. */
function FlipCardBack({ className, style, ...props }: React.ComponentProps<'div'>) {
  const face = useFace(true)
  return (
    <div
      data-slot="flip-card-back"
      aria-hidden={face.hidden || undefined}
      inert={face.hidden}
      className={cn(face.className, className)}
      style={{ transform: face.transform, ...style }}
      {...props}
    />
  )
}

export { FlipCard, FlipCardBack, FlipCardFront }
