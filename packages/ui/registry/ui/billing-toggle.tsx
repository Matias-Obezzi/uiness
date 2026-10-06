'use client'

import * as React from 'react'
import { useLabels, useLocale } from '@/lib/labels'
import { cn } from '@/lib/utils'
import { Odometer } from '@/ui/odometer'

export type BillingPeriod = 'monthly' | 'yearly'

export interface BillingToggleLabels {
  /** Name of the radio group. */
  group: string
  monthly: string
  yearly: string
  /** The badge for a number `savings`. The percent comes formatted. */
  save: (percent: string) => string
}

export const defaultBillingToggleLabels: BillingToggleLabels = {
  group: 'Billing period',
  monthly: 'Monthly',
  yearly: 'Yearly',
  save: (percent) => `Save ${percent}`,
}

export interface BillingToggleProps
  extends Omit<React.ComponentProps<'div'>, 'children' | 'defaultValue' | 'onChange'> {
  /** The picked period, to control the toggle. */
  value?: BillingPeriod
  /** The period picked on the first render. Default `monthly`. */
  defaultValue?: BillingPeriod
  /** Called with the new period. */
  onValueChange?: (value: BillingPeriod) => void
  /** Badge on the yearly option. A number is a fraction: `0.2` reads "Save 20%". */
  savings?: number | React.ReactNode
  /** Label of the monthly option. Default "Monthly". */
  monthlyLabel?: React.ReactNode
  /** Label of the yearly option. Default "Yearly". */
  yearlyLabel?: React.ReactNode
  /** Locale of the savings percent. Defaults to the browser's. */
  locale?: string
  /** Words to use instead of the English ones. A `LabelsProvider` sets them for the whole app. */
  labels?: Partial<BillingToggleLabels>
}

const PERIODS: BillingPeriod[] = ['monthly', 'yearly']

/**
 * A monthly or yearly switch with a savings badge. A thumb slides to the picked option. Works as
 * a radio group: arrow keys move between the two, and only the picked one is in the tab order.
 */
function BillingToggle({
  value: valueProp,
  defaultValue = 'monthly',
  onValueChange,
  savings,
  monthlyLabel,
  yearlyLabel,
  locale: localeProp,
  labels: labelsProp,
  className,
  'aria-label': ariaLabel,
  ...props
}: BillingToggleProps) {
  const labels = useLabels('billing-toggle', defaultBillingToggleLabels, labelsProp)
  const locale = useLocale(localeProp)
  const [own, setOwn] = React.useState<BillingPeriod>(defaultValue)
  const value = valueProp ?? own
  const refs = React.useRef(new Map<BillingPeriod, HTMLButtonElement>())
  const [thumb, setThumb] = React.useState<{ left: number; width: number } | null>(null)

  const pick = (next: BillingPeriod, focus = false) => {
    if (focus) refs.current.get(next)?.focus()
    if (next === value) return
    if (valueProp === undefined) setOwn(next)
    onValueChange?.(next)
  }

  // The thumb follows the picked option's box, which changes with fonts and the badge.
  React.useLayoutEffect(() => {
    const el = refs.current.get(value)
    if (!el) return
    const measure = () => setThumb({ left: el.offsetLeft, width: el.offsetWidth })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [value])

  const badge =
    typeof savings === 'number'
      ? labels.save(
          new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(
            savings,
          ),
        )
      : savings

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel ?? labels.group}
      data-slot="billing-toggle"
      className={cn('relative inline-flex items-center rounded-full bg-muted p-1', className)}
      {...props}
    >
      {thumb && (
        <span
          aria-hidden
          data-slot="billing-toggle-thumb"
          className="absolute inset-y-1 rounded-full bg-background shadow-sm ring-1 ring-border/60 transition-[left,width] duration-(--duration-slow,300ms) ease-(--easing-emphasized,cubic-bezier(0.16,1,0.3,1)) motion-reduce:transition-none"
          style={{ left: thumb.left, width: thumb.width }}
        />
      )}
      {PERIODS.map((period) => {
        const checked = period === value
        return (
          // biome-ignore lint/a11y/useSemanticElements: a native radio cannot be the segment, with its badge inside
          <button
            key={period}
            ref={(el) => {
              if (el) refs.current.set(period, el)
              else refs.current.delete(period)
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            data-state={checked ? 'checked' : 'unchecked'}
            onClick={() => pick(period)}
            onKeyDown={(e) => {
              if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                e.preventDefault()
                pick(period === 'monthly' ? 'yearly' : 'monthly', true)
              }
            }}
            className={cn(
              'relative z-[1] inline-flex h-8 items-center gap-2 rounded-full px-4 font-medium text-sm outline-none transition-colors duration-(--duration-fast,150ms) focus-visible:ring-[3px] focus-visible:ring-ring/50',
              checked ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
              checked && !thumb && 'bg-background shadow-sm',
            )}
          >
            {period === 'monthly'
              ? (monthlyLabel ?? labels.monthly)
              : (yearlyLabel ?? labels.yearly)}
            {period === 'yearly' && badge && ' '}
            {period === 'yearly' && badge && (
              <span
                data-slot="billing-toggle-badge"
                className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 font-medium text-[11px] text-emerald-700 leading-none dark:text-emerald-400"
              >
                {badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export interface PriceProps extends Omit<React.ComponentProps<'span'>, 'children'> {
  /** The amount. Every change rolls the digits to it. */
  amount: number
  /** ISO 4217 code. Default `USD`. */
  currency?: string
  /** Formatting locale. Defaults to the browser's. */
  locale?: string
  /** Digits after the decimal point. Defaults to none for whole amounts and two otherwise. */
  decimals?: number
  /** Shown after the amount, like "/month". */
  period?: React.ReactNode
  /** Milliseconds a digit takes to roll. Default 700. */
  duration?: number
}

/**
 * A price whose digits slide to the new amount, for the period switch of a pricing table.
 * Currency symbols and separators come from Intl.NumberFormat and stay put.
 */
function Price({
  amount,
  currency = 'USD',
  locale,
  decimals,
  period,
  duration = 700,
  className,
  ...props
}: PriceProps) {
  const format = React.useMemo(
    () => ({ style: 'currency', currency }) as Intl.NumberFormatOptions,
    [currency],
  )
  return (
    <span
      data-slot="price"
      className={cn('inline-flex items-baseline gap-1', className)}
      {...props}
    >
      <Odometer
        value={amount}
        locale={locale}
        format={format}
        decimals={decimals ?? (Number.isInteger(amount) ? 0 : 2)}
        duration={duration}
        stagger={40}
        className="font-semibold text-4xl tracking-tight"
      />
      {period && <span className="text-muted-foreground text-sm">{period}</span>}
    </span>
  )
}

export { BillingToggle, Price }
