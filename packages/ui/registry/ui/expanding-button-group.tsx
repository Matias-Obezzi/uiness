'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/lib/utils'

interface ExpandingContextValue {
  active: string | null
  setActive: (id: string | null) => void
  size: VariantProps<typeof expandingButtonVariants>['size']
}

const ExpandingContext = React.createContext<ExpandingContextValue | null>(null)

const expandingButtonVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center rounded-full font-medium text-muted-foreground text-sm outline-none transition-[color,background-color,box-shadow] duration-(--duration-normal,200ms) focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-expanded:bg-accent data-expanded:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      size: {
        sm: 'h-7 min-w-7 px-1.5 text-xs',
        default: 'h-8 min-w-8 px-2',
        lg: 'h-10 min-w-10 px-3',
      },
    },
    defaultVariants: { size: 'default' },
  },
)

function focusVisible(el: Element) {
  try {
    return el.matches(':focus-visible')
  } catch {
    return true
  }
}

export interface ExpandingButtonGroupProps
  extends React.ComponentProps<'div'>,
    VariantProps<typeof expandingButtonVariants> {}

/**
 * Icon buttons where the one under the pointer or keyboard grows to show its label, and the
 * others slide aside to make room. Name the group with `aria-label`.
 */
function ExpandingButtonGroup({
  size = 'default',
  className,
  onPointerLeave,
  onBlur,
  ...props
}: ExpandingButtonGroupProps) {
  const [active, setActive] = React.useState<string | null>(null)
  const value = React.useMemo(() => ({ active, setActive, size }), [active, size])
  return (
    <ExpandingContext.Provider value={value}>
      {/* biome-ignore lint/a11y/useSemanticElements: a fieldset would bring its own box model and legend */}
      <div
        role="group"
        data-slot="expanding-button-group"
        className={cn(
          'inline-flex w-fit items-center gap-0.5 rounded-full border bg-background p-1 shadow-xs',
          className,
        )}
        onPointerLeave={(e) => {
          onPointerLeave?.(e)
          // Hand the label back to the button the keyboard is on, if there is one.
          const focused = document.activeElement
          const keyboard =
            focused instanceof HTMLElement &&
            e.currentTarget.contains(focused) &&
            focusVisible(focused)
          setActive(keyboard ? (focused.dataset.id ?? null) : null)
        }}
        onBlur={(e) => {
          onBlur?.(e)
          const inside = e.currentTarget.contains(e.relatedTarget as Node | null)
          if (!inside && !e.currentTarget.matches(':hover')) setActive(null)
        }}
        {...props}
      />
    </ExpandingContext.Provider>
  )
}

export interface ExpandingButtonProps extends Omit<React.ComponentProps<'button'>, 'children'> {
  /** The icon shown at rest. */
  icon: React.ReactNode
  /** The label revealed on hover and focus. Screen readers always get it. */
  label: React.ReactNode
  /** Keep the label open regardless of hover, to show a result in place for example. */
  expanded?: boolean
}

/** One icon button in an `ExpandingButtonGroup`. */
function ExpandingButton({
  icon,
  label,
  expanded,
  className,
  type = 'button',
  onPointerEnter,
  onFocus,
  ...props
}: ExpandingButtonProps) {
  const ctx = React.useContext(ExpandingContext)
  const id = React.useId()
  const open = expanded ?? ctx?.active === id
  return (
    <button
      type={type}
      data-slot="expanding-button"
      data-id={id}
      data-expanded={open || undefined}
      className={cn(expandingButtonVariants({ size: ctx?.size }), className)}
      onPointerEnter={(e) => {
        onPointerEnter?.(e)
        if (e.pointerType !== 'touch') ctx?.setActive(id)
      }}
      onFocus={(e) => {
        onFocus?.(e)
        ctx?.setActive(id)
      }}
      {...props}
    >
      <span aria-hidden="true" className="inline-flex">
        {icon}
      </span>
      {/* The label stays in the accessibility tree at zero width: the grid track collapses,
          the text does not go anywhere, so the button is named the same at rest and open. */}
      <span
        data-slot="expanding-button-label"
        className={cn(
          'grid grid-cols-[0fr] opacity-0 transition-[grid-template-columns,opacity] duration-(--duration-slow,300ms) ease-(--easing-emphasized,cubic-bezier(0.16,1,0.3,1)) motion-reduce:transition-none',
          open && 'grid-cols-[1fr] opacity-100',
        )}
      >
        <span className="min-w-0 overflow-hidden whitespace-nowrap">
          <span className="block pr-1 pl-1.5">{label}</span>
        </span>
      </span>
    </button>
  )
}

export { ExpandingButton, ExpandingButtonGroup, expandingButtonVariants }
