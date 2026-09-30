'use client'

import { Slot } from 'radix-ui'
import * as React from 'react'
import { cn } from '@/lib/utils'

interface Wave {
  id: number
  x: number
  y: number
  size: number
  released: boolean
}

export interface UseRippleOptions {
  /** Always start from the center, as on an icon button. Default false. */
  center?: boolean
  /** Milliseconds to grow across the element. Default 550. */
  duration?: number
  /** Milliseconds to fade once released. Default 450. */
  fade?: number
  /** Any CSS color. Default the text color. */
  color?: string
  /** Opacity of the ink at its strongest. Default 0.2. */
  opacity?: number
  /** Stop making ripples. */
  disabled?: boolean
}

/**
 * The state behind `Ripple`, for elements you build yourself. Spread the handlers on the
 * element, give it `relative`, and render `ripples` inside it.
 */
function useRipple<T extends HTMLElement = HTMLElement>({
  center = false,
  duration = 550,
  fade = 450,
  color = 'currentColor',
  opacity = 0.2,
  disabled = false,
}: UseRippleOptions = {}) {
  const [waves, setWaves] = React.useState<Wave[]>([])
  const nextId = React.useRef(0)
  const pressed = React.useRef(new Set<number>())
  const timers = React.useRef(new Set<ReturnType<typeof setTimeout>>())

  React.useEffect(() => {
    const pending = timers.current
    return () => {
      for (const timer of pending) clearTimeout(timer)
      pending.clear()
    }
  }, [])

  const add = (el: T, clientX?: number, clientY?: number) => {
    if (disabled) return
    const rect = el.getBoundingClientRect()
    const fromCenter = center || clientX === undefined || clientY === undefined
    const x = fromCenter ? rect.width / 2 : clientX - rect.left
    const y = fromCenter ? rect.height / 2 : clientY - rect.top
    // Wide enough to reach the furthest corner.
    const size = 2 * Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y))
    const id = nextId.current++
    pressed.current.add(id)
    setWaves((all) => [...all, { id, x, y, size, released: false }])
  }

  // Fade every wave that is still held, then drop those once they are gone.
  const release = () => {
    if (!pressed.current.size) return
    const done = new Set(pressed.current)
    pressed.current.clear()
    setWaves((all) => all.map((w) => (done.has(w.id) ? { ...w, released: true } : w)))
    const timer = setTimeout(() => {
      timers.current.delete(timer)
      setWaves((all) => all.filter((w) => !done.has(w.id)))
    }, fade)
    timers.current.add(timer)
  }

  const handlers = {
    onPointerDown: (e: React.PointerEvent<T>) => {
      if (e.button !== 0) return
      add(e.currentTarget, e.clientX, e.clientY)
    },
    onPointerUp: release,
    onPointerLeave: release,
    onPointerCancel: release,
    onKeyDown: (e: React.KeyboardEvent<T>) => {
      if (e.repeat || (e.key !== 'Enter' && e.key !== ' ')) return
      add(e.currentTarget)
    },
    onKeyUp: release,
    onBlur: release,
  }

  const ripples = (
    <span
      aria-hidden
      data-slot="ripple-container"
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
    >
      {waves.map((w) => (
        <span
          key={w.id}
          data-slot="ripple-wave"
          data-state={w.released ? 'released' : 'pressed'}
          className="absolute animate-[ripple-grow_var(--ripple-duration)_cubic-bezier(0.2,0,0,1)] rounded-full transition-opacity ease-out motion-reduce:animate-none"
          style={
            {
              '--ripple-duration': `${duration}ms`,
              left: w.x - w.size / 2,
              top: w.y - w.size / 2,
              width: w.size,
              height: w.size,
              background: color,
              opacity: w.released ? 0 : opacity,
              transitionDuration: `${fade}ms`,
            } as React.CSSProperties
          }
        />
      ))}
    </span>
  )

  return { handlers, ripples }
}

export interface RippleProps extends React.ComponentProps<'div'>, UseRippleOptions {
  /** Render the child element instead of a `<div>`, so your own button gets the ink. */
  asChild?: boolean
}

type Handlers = ReturnType<typeof useRipple<HTMLDivElement>>['handlers']

/**
 * An ink ripple that spreads from where you press, or from the center when pressed with
 * the keyboard. Wrap a card, or use `asChild` on a button. The ink takes the text color.
 * With reduced motion it fades in place without growing.
 */
function Ripple({
  asChild,
  center,
  duration,
  fade,
  color,
  opacity,
  disabled,
  className,
  children,
  ...props
}: RippleProps) {
  const { handlers, ripples } = useRipple<HTMLDivElement>({
    center,
    duration,
    fade,
    color,
    opacity,
    disabled,
  })
  const Comp = asChild ? Slot.Root : 'div'

  // Run the caller's handlers first, the same order Slot uses for its child.
  const merged = Object.fromEntries(
    Object.entries(handlers).map(([name, handler]) => {
      const own = props[name as keyof typeof props] as ((e: never) => void) | undefined
      return [
        name,
        (e: never) => {
          own?.(e)
          handler(e)
        },
      ]
    }),
  ) as Handlers

  return (
    <Comp data-slot="ripple" className={cn('relative isolate', className)} {...props} {...merged}>
      {asChild ? <Slot.Slottable>{children}</Slot.Slottable> : children}
      {ripples}
    </Comp>
  )
}

export { Ripple, useRipple }
