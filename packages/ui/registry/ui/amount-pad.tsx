'use client'

import { DeleteIcon } from 'lucide-react'
import * as React from 'react'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface AmountPadLabels {
  /** Names the amount shown. */
  amount: string
  /** Names the keypad. */
  keypad: string
  delete: string
  decimal: string
}

export const defaultAmountPadLabels: AmountPadLabels = {
  amount: 'Amount',
  keypad: 'Keypad',
  delete: 'Delete',
  decimal: 'Decimal point',
}

/** The amount typed so far with one more key: a digit, `.` or `back`. */
export function press(typed: string, key: string, decimals: number, maxDigits: number): string {
  if (key === 'back') return typed.slice(0, -1)
  const [whole = '', fraction] = typed.split('.')
  if (key === '.') return decimals > 0 && fraction === undefined ? `${whole || '0'}.` : typed
  if (!/^\d$/.test(key)) return typed
  if (fraction !== undefined) return fraction.length < decimals ? typed + key : typed
  if (whole.length >= maxDigits) return typed
  // No leading zeros: 0 then 5 is 5.
  return whole === '0' ? key : typed + key
}

export interface AmountPadProps
  extends Omit<React.ComponentProps<'div'>, 'children' | 'defaultValue'> {
  /** The amount, when you keep it. */
  value?: number
  defaultValue?: number
  onValueChange?: (value: number) => void
  /** ISO code, such as `USD` or `EUR`. Default `USD`. */
  currency?: string
  locale?: string
  /** Digits before the decimal point. Default 7. */
  maxDigits?: number
  labels?: Partial<AmountPadLabels>
}

/**
 * A keypad for sending money. The amount is written in the currency's own format as it is
 * typed; each new digit springs into place, and the figure shrinks to fit as it grows. The
 * keys on a keyboard work too while the pad has focus.
 */
function AmountPad({
  value,
  defaultValue,
  onValueChange,
  currency = 'USD',
  locale,
  maxDigits = 7,
  labels: labelsProp,
  className,
  ...props
}: AmountPadProps) {
  const labels = useLabels('amount-pad', defaultAmountPadLabels, labelsProp)
  const decimals = React.useMemo(
    () =>
      new Intl.NumberFormat(locale, { style: 'currency', currency }).resolvedOptions()
        .maximumFractionDigits ?? 2,
    [locale, currency],
  )
  const [typed, setTyped] = React.useState(() => {
    const start = value ?? defaultValue
    return start ? String(start) : ''
  })
  // A value from outside that differs from what was typed replaces it.
  const shown = value !== undefined && Number(typed || 0) !== value ? String(value || '') : typed

  const key = (k: string) => {
    const next = press(shown, k, decimals, maxDigits)
    if (next === shown) return
    setTyped(next)
    onValueChange?.(Number(next || 0))
  }

  // Formatted with the fraction digits typed so far, so "12." shows its point.
  const [, fraction] = shown.split('.')
  const parts = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: fraction?.length ?? 0,
    maximumFractionDigits: decimals,
  }).formatToParts(Number(shown || 0))
  let text = parts.map((p) => p.value).join('')
  if (fraction === '') {
    const point =
      parts.find((p) => p.type === 'decimal')?.value ??
      new Intl.NumberFormat(locale).formatToParts(1.5).find((p) => p.type === 'decimal')?.value ??
      '.'
    const at = text.search(/\d(?!.*\d)/) + 1
    text = text.slice(0, at) + point + text.slice(at)
  }
  const digits = shown.replace(/\D/g, '').length
  const size = Math.max(1.75, 3.25 - Math.max(0, digits - 5) * 0.25)

  return (
    // biome-ignore lint/a11y/useSemanticElements: a focusable keypad, not a set of form fields
    <div
      data-slot="amount-pad"
      // biome-ignore lint/a11y/noNoninteractiveTabindex: the pad takes typing from a keyboard while focused
      tabIndex={0}
      role="group"
      aria-label={labels.keypad}
      onKeyDown={(event) => {
        if (event.metaKey || event.ctrlKey || event.altKey) return
        const k =
          event.key === 'Backspace'
            ? 'back'
            : event.key === ',' || event.key === '.'
              ? '.'
              : event.key
        if (k === 'back' || k === '.' || /^\d$/.test(k)) {
          event.preventDefault()
          key(k)
        }
      }}
      className={cn(
        'flex flex-col items-center gap-6 rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
        className,
      )}
      {...props}
    >
      <output
        aria-label={labels.amount}
        aria-live="polite"
        className={cn(
          'flex h-16 items-center font-semibold tabular-nums tracking-tight transition-[font-size] duration-(--duration-fast,150ms) motion-reduce:transition-none',
          !shown && 'text-muted-foreground',
        )}
        style={{ fontSize: `${size}rem` }}
      >
        {[...text].map((char, i) => (
          <span
            // Counted from the end, so the digits already there keep their place and only the new one springs in.
            // biome-ignore lint/suspicious/noArrayIndexKey: the position is the identity here
            key={`${text.length - i}`}
            className="inline-block animate-in fade-in slide-in-from-bottom-3 zoom-in-90 duration-(--duration-normal,200ms) motion-reduce:animate-none"
          >
            {char}
          </span>
        ))}
      </output>
      <div className="grid w-full max-w-72 grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', decimals > 0 ? '.' : '', '0', 'back'].map(
          (k, i) =>
            k === '' ? (
              // biome-ignore lint/suspicious/noArrayIndexKey: the empty corner of the keypad
              <span key={i} />
            ) : (
              <button
                key={k}
                type="button"
                tabIndex={-1}
                aria-label={k === 'back' ? labels.delete : k === '.' ? labels.decimal : undefined}
                onClick={() => key(k)}
                className="flex h-14 items-center justify-center rounded-xl font-medium text-2xl outline-none transition-[background-color,scale] hover:bg-accent active:scale-95 active:bg-accent motion-reduce:transition-none [&_svg]:size-6"
              >
                {k === 'back' ? <DeleteIcon aria-hidden="true" /> : k}
              </button>
            ),
        )}
      </div>
    </div>
  )
}

export { AmountPad }
