'use client'

import { MinusIcon, PlusIcon, ShoppingCartIcon, Trash2Icon } from 'lucide-react'
import * as React from 'react'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface CartButtonLabels {
  add: string
  /** Names the stepper, with the item. */
  quantity: (item: string) => string
  increase: string
  decrease: string
  remove: string
  /** Read out as the count changes. */
  inCart: (count: number) => string
}

export const defaultCartButtonLabels: CartButtonLabels = {
  add: 'Add',
  quantity: (item) => `Quantity of ${item}`,
  increase: 'Add one',
  decrease: 'Remove one',
  remove: 'Remove from cart',
  inCart: (count) => `${count} in cart`,
}

/** Held this long, a press starts repeating, then every REPEAT_MS. */
const HOLD_MS = 400
const REPEAT_MS = 90

export interface CartButtonProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** What is being added, for screen readers. */
  item: string
  quantity: number
  onQuantityChange: (quantity: number) => void
  /** Default 99. */
  max?: number
  labels?: Partial<CartButtonLabels>
}

/**
 * An Add button that opens into a quantity stepper in place. At one, minus becomes a bin;
 * holding plus or minus repeats.
 */
function CartButton({
  item,
  quantity,
  onQuantityChange,
  max = 99,
  labels: labelsProp,
  className,
  ...props
}: CartButtonProps) {
  const labels = useLabels('cart-button', defaultCartButtonLabels, labelsProp)
  const latest = React.useRef(quantity)
  React.useEffect(() => {
    latest.current = quantity
  })
  const plus = React.useRef<HTMLButtonElement>(null)
  const wasEmpty = React.useRef(quantity === 0)
  // Opening moves focus to plus, so the keyboard carries on where the click was.
  React.useEffect(() => {
    if (wasEmpty.current && quantity > 0) plus.current?.focus()
    wasEmpty.current = quantity === 0
  }, [quantity])

  const step = (by: number) => {
    const next = Math.min(max, Math.max(0, latest.current + by))
    if (next === latest.current) return false
    latest.current = next
    onQuantityChange(next)
    return next > 0
  }
  if (quantity === 0)
    return (
      <div data-slot="cart-button" className={cn('inline-flex', className)} {...props}>
        <button
          type="button"
          onClick={() => onQuantityChange(1)}
          className="flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 font-medium text-primary-foreground text-sm outline-none transition-[scale] active:scale-95 focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none pointer-coarse:h-11 [&_svg]:size-4"
        >
          <ShoppingCartIcon aria-hidden="true" />
          {labels.add}
        </button>
      </div>
    )

  return (
    // biome-ignore lint/a11y/useSemanticElements: a stepper, not a set of form fields
    <div
      data-slot="cart-button"
      role="group"
      aria-label={labels.quantity(item)}
      className={cn(
        'inline-flex h-9 items-center rounded-full bg-primary text-primary-foreground animate-in fade-in zoom-in-95 duration-(--duration-fast,150ms) motion-reduce:animate-none pointer-coarse:h-11',
        className,
      )}
      {...props}
    >
      <StepButton label={quantity === 1 ? labels.remove : labels.decrease} onStep={() => step(-1)}>
        {quantity === 1 ? <Trash2Icon /> : <MinusIcon />}
      </StepButton>
      <output aria-live="polite" className="min-w-7 text-center font-semibold text-sm tabular-nums">
        <span
          key={quantity}
          className="inline-block animate-in fade-in slide-in-from-bottom-1 motion-reduce:animate-none"
        >
          {quantity}
        </span>
        <span className="sr-only">, {labels.inCart(quantity)}</span>
      </output>
      <StepButton
        ref={plus}
        label={labels.increase}
        disabled={quantity >= max}
        onStep={() => step(1)}
      >
        <PlusIcon />
      </StepButton>
    </div>
  )
}

/**
 * A click steps once; a press held past HOLD_MS keeps stepping until let go, or until `onStep`
 * returns false at a limit.
 */
function StepButton({
  label,
  onStep,
  className,
  ...props
}: Omit<React.ComponentProps<'button'>, 'onClick'> & { label: string; onStep: () => boolean }) {
  const timers = React.useRef<number[]>([])
  const stop = React.useCallback(() => {
    for (const t of timers.current) {
      window.clearTimeout(t)
      window.clearInterval(t)
    }
    timers.current = []
  }, [])
  React.useEffect(() => stop, [stop])
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return
        stop()
        timers.current.push(
          window.setTimeout(() => {
            timers.current.push(
              window.setInterval(() => {
                if (!onStep()) stop()
              }, REPEAT_MS),
            )
          }, HOLD_MS),
        )
      }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onClick={() => onStep()}
      onContextMenu={(event) => event.preventDefault()}
      className={cn(
        'relative flex size-9 shrink-0 touch-manipulation select-none items-center justify-center rounded-full outline-none hover:bg-primary-foreground/10 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-40 pointer-coarse:size-11 [&_svg]:size-4',
        className,
      )}
      {...props}
    />
  )
}

export { CartButton }
