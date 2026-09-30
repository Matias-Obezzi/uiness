'use client'

import { Slot } from 'radix-ui'
import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

export type DockDirection = 'horizontal' | 'vertical'

interface DockContextValue {
  direction: DockDirection
  size: number
  reduced: boolean
}

const DockContext = React.createContext<DockContextValue>({
  direction: 'horizontal',
  size: 48,
  reduced: false,
})

const PARTS = ':scope > [data-slot=dock-item], :scope > [data-slot=dock-separator]'

export interface DockProps extends React.ComponentProps<'div'> {
  /** Lay the items out in a row or a column. Default horizontal. */
  direction?: DockDirection
  /** Scale of the item right under the pointer. Default 1.8. */
  magnification?: number
  /** Pixels from the pointer at which the magnification fades out. Default 140. */
  distance?: number
  /** Resting size of each item in pixels. Default 48. */
  size?: number
  /** Classes for the panel behind the items. */
  panelClassName?: string
}

/**
 * A dock like the one in macOS. Items grow as the pointer passes over them and push their
 * neighbours aside, all with transforms, so nothing around it reflows. Keyboard focus
 * magnifies too. With reduced motion the items keep their size.
 */
function Dock({
  direction = 'horizontal',
  magnification = 1.8,
  distance = 140,
  size = 48,
  panelClassName,
  className,
  style,
  children,
  onPointerMove,
  onPointerLeave,
  onFocus,
  onBlur,
  ...props
}: DockProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const vertical = direction === 'vertical'
  const frame = React.useRef(0)
  // Where the magnification is centered along the main axis, null when at rest.
  const target = React.useRef<number | null>(null)
  const hovering = React.useRef(false)
  const [active, setActive] = React.useState(false)

  const apply = React.useCallback(() => {
    frame.current = 0
    const el = ref.current
    if (!el) return
    const parts = Array.from(el.querySelectorAll<HTMLElement>(PARTS))
    const at = target.current
    const extras = parts.map((part) => {
      if (at === null || part.dataset.slot !== 'dock-item') return 0
      const center = vertical
        ? part.offsetTop + part.offsetHeight / 2
        : part.offsetLeft + part.offsetWidth / 2
      const d = Math.min(Math.abs(at - center) / distance, 1)
      // A cosine bell: full size under the pointer, easing to nothing at `distance`.
      return size * (magnification - 1) * ((Math.cos(Math.PI * d) + 1) / 2)
    })
    const total = extras.reduce((a, b) => a + b, 0)
    let before = 0
    parts.forEach((part, i) => {
      const extra = extras[i] ?? 0
      part.style.setProperty('--dock-scale', (1 + extra / size).toFixed(3))
      part.style.setProperty('--dock-shift', `${(before + extra / 2 - total / 2).toFixed(2)}px`)
      before += extra
    })
    el.style.setProperty('--dock-extra', `${total.toFixed(2)}px`)
  }, [vertical, distance, magnification, size])

  const schedule = () => {
    if (!frame.current) frame.current = requestAnimationFrame(apply)
  }

  React.useEffect(() => {
    if (reduced) target.current = null
    apply()
    return () => {
      cancelAnimationFrame(frame.current)
      frame.current = 0
    }
  }, [apply, reduced])

  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(e)
    const el = ref.current
    if (!el || reduced || e.pointerType === 'touch') return
    const rect = el.getBoundingClientRect()
    target.current = vertical
      ? e.clientY - rect.top - el.clientTop
      : e.clientX - rect.left - el.clientLeft
    hovering.current = true
    setActive(true)
    schedule()
  }

  const leave = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerLeave?.(e)
    hovering.current = false
    target.current = null
    setActive(false)
    schedule()
  }

  const focus = (e: React.FocusEvent<HTMLDivElement>) => {
    onFocus?.(e)
    const item = (e.target as HTMLElement).closest<HTMLElement>('[data-slot=dock-item]')
    if (!item || reduced || hovering.current || !focusVisible(e.target)) return
    target.current = vertical
      ? item.offsetTop + item.offsetHeight / 2
      : item.offsetLeft + item.offsetWidth / 2
    schedule()
  }

  const blur = (e: React.FocusEvent<HTMLDivElement>) => {
    onBlur?.(e)
    if (hovering.current || e.currentTarget.contains(e.relatedTarget as Node | null)) return
    target.current = null
    schedule()
  }

  const context = React.useMemo(() => ({ direction, size, reduced }), [direction, size, reduced])

  return (
    <DockContext.Provider value={context}>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: it only tracks the pointer and focus, the items are the buttons */}
      <div
        ref={ref}
        data-slot="dock"
        data-orientation={direction}
        data-active={active ? '' : undefined}
        className={cn(
          'group/dock relative flex w-max gap-2 p-2',
          vertical ? 'flex-col items-start' : 'items-end',
          className,
        )}
        style={{ '--dock-size': `${size}px`, ...style } as React.CSSProperties}
        onPointerMove={move}
        onPointerLeave={leave}
        onFocus={focus}
        onBlur={blur}
        {...props}
      >
        <div
          aria-hidden
          data-slot="dock-panel"
          className={cn(
            'absolute inset-0 rounded-2xl border bg-background/70 shadow-lg backdrop-blur-md transition-[left,right,top,bottom] duration-(--duration-slow,300ms) ease-out group-data-active/dock:duration-100 motion-reduce:transition-none',
            panelClassName,
          )}
          style={
            vertical
              ? {
                  top: 'calc(var(--dock-extra, 0px) / -2)',
                  bottom: 'calc(var(--dock-extra, 0px) / -2)',
                }
              : {
                  left: 'calc(var(--dock-extra, 0px) / -2)',
                  right: 'calc(var(--dock-extra, 0px) / -2)',
                }
          }
        />
        {children}
      </div>
    </DockContext.Provider>
  )
}

function focusVisible(el: EventTarget) {
  try {
    return (el as Element).matches(':focus-visible')
  } catch {
    return true
  }
}

const follow =
  'transition-transform duration-(--duration-slow,300ms) ease-out group-data-active/dock:duration-100 motion-reduce:transition-none'

export interface DockItemProps extends React.ComponentProps<'button'> {
  /** Name shown in the tooltip and read out by screen readers. */
  label: string
  /** Render the child element, a link say, instead of a `<button>`. */
  asChild?: boolean
  /** Show a dot beside it, like a running app. */
  active?: boolean
  /** Hop when clicked. Default true. */
  bounce?: boolean
}

/** One icon in a `Dock`, with its label in a tooltip on hover and focus. */
function DockItem({
  label,
  asChild,
  active,
  bounce = true,
  className,
  style,
  onClick,
  children,
  ...props
}: DockItemProps) {
  const { direction, size, reduced } = React.useContext(DockContext)
  const vertical = direction === 'vertical'
  const hop = React.useRef<HTMLSpanElement>(null)

  const click = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    if (!bounce || reduced) return
    const away = vertical ? 'translateX' : 'translateY'
    const up = vertical ? size * 0.45 : size * -0.45
    hop.current?.animate?.(
      [
        { transform: `${away}(0)`, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
        { transform: `${away}(${up}px)`, offset: 0.3, easing: 'cubic-bezier(0.5, 0, 1, 1)' },
        { transform: `${away}(0)`, offset: 0.6, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
        { transform: `${away}(${up * 0.3}px)`, offset: 0.8, easing: 'cubic-bezier(0.5, 0, 1, 1)' },
        { transform: `${away}(0)` },
      ],
      { duration: 650 },
    )
  }

  const Comp = asChild ? Slot.Root : 'button'
  return (
    <div
      data-slot="dock-item"
      className={cn(
        'group/dock-item relative flex shrink-0 focus-within:z-(--z-raised,10) hover:z-(--z-raised,10)',
        follow,
      )}
      style={{
        transform: vertical
          ? 'translate3d(0, var(--dock-shift, 0px), 0)'
          : 'translate3d(var(--dock-shift, 0px), 0, 0)',
      }}
    >
      <span ref={hop} data-slot="dock-item-hop" className="flex">
        <Comp
          type={asChild ? undefined : 'button'}
          aria-label={label}
          data-slot="dock-item-button"
          className={cn(
            'flex size-(--dock-size) items-center justify-center rounded-[28%] bg-secondary text-secondary-foreground shadow-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg:not([class*=size-])]:size-1/2',
            vertical ? 'origin-left' : 'origin-bottom',
            follow,
            className,
          )}
          style={{ transform: 'scale(var(--dock-scale, 1))', ...style }}
          onClick={click}
          {...props}
        >
          {children}
        </Comp>
      </span>
      <span
        aria-hidden
        data-slot="dock-item-label"
        className={cn(
          'pointer-events-none absolute scale-90 whitespace-nowrap rounded-md bg-foreground px-2 py-1 font-medium text-background text-xs opacity-0 shadow-md transition-[opacity,scale,transform] duration-(--duration-slow,300ms) ease-out group-hover/dock-item:scale-100 group-hover/dock-item:opacity-100 group-has-[:focus-visible]/dock-item:scale-100 group-has-[:focus-visible]/dock-item:opacity-100 group-data-active/dock:duration-100 motion-reduce:transition-none',
          vertical ? 'top-1/2 left-full ml-3' : 'bottom-full left-1/2 mb-3',
        )}
        style={{
          transform: vertical
            ? 'translate(calc(var(--dock-size) * (var(--dock-scale, 1) - 1)), -50%)'
            : 'translate(-50%, calc(var(--dock-size) * (1 - var(--dock-scale, 1))))',
        }}
      >
        {label}
      </span>
      {active && (
        <span
          aria-hidden
          data-slot="dock-item-indicator"
          className={cn(
            'absolute size-1 rounded-full bg-foreground/60',
            vertical
              ? 'top-1/2 -left-1.5 -translate-y-1/2'
              : '-bottom-1.5 left-1/2 -translate-x-1/2',
          )}
        />
      )}
    </div>
  )
}

/** A thin line between groups of items in a `Dock`. */
function DockSeparator({ className, style, ...props }: React.ComponentProps<'div'>) {
  const { direction } = React.useContext(DockContext)
  const vertical = direction === 'vertical'
  return (
    <div
      aria-hidden
      data-slot="dock-separator"
      className={cn(
        'shrink-0 self-stretch bg-border',
        vertical ? 'mx-1 h-px' : 'my-1 w-px',
        follow,
        className,
      )}
      style={{
        transform: vertical
          ? 'translate3d(0, var(--dock-shift, 0px), 0)'
          : 'translate3d(var(--dock-shift, 0px), 0, 0)',
        ...style,
      }}
      {...props}
    />
  )
}

export { Dock, DockItem, DockSeparator }
