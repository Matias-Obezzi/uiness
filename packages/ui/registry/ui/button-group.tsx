'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import * as React from 'react'
import { cn } from '@/lib/utils'

type Orientation = 'horizontal' | 'vertical'

interface ButtonGroupContextValue {
  orientation: Orientation
  size: VariantProps<typeof buttonGroupItemVariants>['size']
  move: (el: HTMLElement) => void
}

const ButtonGroupContext = React.createContext<ButtonGroupContextValue | null>(null)

const buttonGroupItemVariants = cva(
  "relative z-[1] inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium text-muted-foreground text-sm outline-none transition-[color,box-shadow,scale] hover:text-foreground active:scale-[0.97] motion-reduce:active:scale-100 focus-visible:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 aria-[current=page]:bg-muted aria-[current=page]:text-foreground aria-pressed:bg-muted aria-pressed:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      size: {
        sm: 'h-7 px-2.5 text-xs',
        default: 'h-8 px-3',
        lg: 'h-9 px-4',
      },
    },
    defaultVariants: { size: 'default' },
  },
)

export interface ButtonGroupProps
  extends React.ComponentProps<'div'>,
    VariantProps<typeof buttonGroupItemVariants> {
  /** Lay the buttons out in a row or a column. Default `horizontal`. */
  orientation?: Orientation
  /** Milliseconds the highlight takes to glide between buttons. Default 200. */
  duration?: number
  /** Classes for the gliding highlight. */
  highlightClassName?: string
}

/**
 * Related buttons joined into one surface with hairline dividers. A single highlight glides to
 * whichever button the pointer or keyboard is on. Name the group with `aria-label`.
 */
function ButtonGroup({
  orientation = 'horizontal',
  size = 'default',
  duration = 200,
  highlightClassName,
  className,
  children,
  onPointerLeave,
  onBlur,
  ...props
}: ButtonGroupProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const highlight = React.useRef<HTMLDivElement>(null)
  const current = React.useRef<HTMLElement | null>(null)

  const place = React.useCallback(
    (el: HTMLElement | null) => {
      const root = ref.current
      const h = highlight.current
      if (!root || !h) return
      current.current?.removeAttribute('data-highlighted')
      current.current = el
      if (!el) {
        h.style.opacity = '0'
        return
      }
      el.setAttribute('data-highlighted', '')
      const a = root.getBoundingClientRect()
      const b = el.getBoundingClientRect()
      // Appear in place the first time instead of sliding in from the corner.
      h.style.transitionDuration = h.style.opacity === '1' ? `${duration}ms` : '0ms'
      // The highlight is positioned inside the border, so take the border out.
      h.style.transform = `translate(${b.left - a.left - root.clientLeft}px, ${b.top - a.top - root.clientTop}px)`
      h.style.width = `${b.width}px`
      h.style.height = `${b.height}px`
      h.style.opacity = '1'
    },
    [duration],
  )

  // When the pointer leaves, fall back to the button the keyboard is on, if any.
  const settle = React.useCallback(() => {
    const active = document.activeElement
    const inside = active instanceof HTMLElement && ref.current?.contains(active)
    place(inside && focusVisible(active) ? active : null)
  }, [place])

  const value = React.useMemo(
    () => ({ orientation, size, move: place }),
    [orientation, size, place],
  )

  return (
    <ButtonGroupContext.Provider value={value}>
      {/* biome-ignore lint/a11y/useSemanticElements: a fieldset would bring its own box model and legend */}
      <div
        ref={ref}
        role="group"
        data-slot="button-group"
        data-orientation={orientation}
        className={cn(
          'relative isolate inline-flex w-fit rounded-lg border bg-background p-0.5 shadow-xs',
          orientation === 'vertical' ? 'flex-col items-stretch' : 'items-center',
          className,
        )}
        onPointerLeave={(e) => {
          onPointerLeave?.(e)
          settle()
        }}
        onBlur={(e) => {
          onBlur?.(e)
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            if (!e.currentTarget.matches(':hover')) place(null)
          }
        }}
        {...props}
      >
        <div
          ref={highlight}
          aria-hidden="true"
          data-slot="button-group-highlight"
          className={cn(
            'pointer-events-none absolute top-0 left-0 rounded-md bg-accent opacity-0 transition-[transform,width,height,opacity] ease-(--easing-standard,cubic-bezier(0.2,0,0,1)) motion-reduce:transition-none',
            highlightClassName,
          )}
        />
        {children}
      </div>
    </ButtonGroupContext.Provider>
  )
}

// A click focuses the button too; only keyboard focus should pull the highlight over.
function focusVisible(el: Element) {
  try {
    return el.matches(':focus-visible')
  } catch {
    return true
  }
}

export interface ButtonGroupItemProps extends React.ComponentProps<'button'> {
  /** Render the child element, a link for example, instead of a `<button>`. */
  asChild?: boolean
}

/**
 * One button in a `ButtonGroup`. Mark the current one with `aria-pressed` or, for links,
 * `aria-current="page"`.
 */
function ButtonGroupItem({
  asChild = false,
  className,
  type,
  onPointerEnter,
  onFocus,
  ...props
}: ButtonGroupItemProps) {
  const ctx = React.useContext(ButtonGroupContext)
  const vertical = ctx?.orientation === 'vertical'
  const Comp = asChild ? Slot.Root : 'button'
  return (
    <Comp
      data-slot="button-group-item"
      type={asChild ? type : (type ?? 'button')}
      className={cn(
        buttonGroupItemVariants({ size: ctx?.size }),
        // A hairline before every button but the first, faded out next to the highlight so the
        // highlighted button reads as one clean shape.
        'before:pointer-events-none before:absolute before:hidden before:bg-border before:transition-opacity [[data-slot=button-group-item]+&]:before:block',
        'aria-[current=page]:before:opacity-0 aria-pressed:before:opacity-0 data-highlighted:before:opacity-0 [[aria-current=page]+&]:before:opacity-0 [[aria-pressed=true]+&]:before:opacity-0 [[data-highlighted]+&]:before:opacity-0',
        vertical
          ? 'justify-start before:inset-x-2 before:-top-px before:h-px'
          : 'before:inset-y-1.5 before:-left-px before:w-px',
        className,
      )}
      onPointerEnter={(e: React.PointerEvent<HTMLButtonElement>) => {
        onPointerEnter?.(e)
        if (e.pointerType !== 'touch') ctx?.move(e.currentTarget)
      }}
      onFocus={(e: React.FocusEvent<HTMLButtonElement>) => {
        onFocus?.(e)
        if (focusVisible(e.currentTarget)) ctx?.move(e.currentTarget)
      }}
      {...props}
    />
  )
}

export { ButtonGroup, ButtonGroupItem, buttonGroupItemVariants }
