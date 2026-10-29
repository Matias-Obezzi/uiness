'use client'

import { CheckIcon } from 'lucide-react'
import type * as React from 'react'
import { CopyButton } from '@/components/ui/copy-button'
import { Odometer } from '@/components/ui/odometer'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface TransferStep {
  label: string
  /** A line under it, such as when it happened. */
  detail?: string
}

export interface CurrencyTransferLabels {
  /** The rate line. */
  rate: (from: string, rate: string, to: string) => string
  reference: string
  /** Read with each step. */
  stepState: (state: 'done' | 'current' | 'next') => string
}

export const defaultCurrencyTransferLabels: CurrencyTransferLabels = {
  rate: (from, rate, to) => `1 ${from} = ${rate} ${to}`,
  reference: 'Reference',
  stepState: (state) =>
    state === 'done' ? 'done' : state === 'current' ? 'in progress' : 'to come',
}

export interface CurrencyTransferProps extends Omit<React.ComponentProps<'section'>, 'children'> {
  /** What is sent, in `from`. */
  amount: number
  from: string
  to: string
  /** How many `to` one `from` buys. */
  rate: number
  steps: TransferStep[]
  /** The step under way; past the last one, the transfer is complete. */
  current: number
  /** From this step on, the amount shows converted. Default 1. */
  convertAt?: number
  /** Shown, with a copy button, once it is complete. */
  reference?: string
  locale?: string
  labels?: Partial<CurrencyTransferLabels>
}

/**
 * A transfer that tracks itself: the amount converts in place once the money changes currency,
 * the steps fill a rail as they pass, and a reference to copy closes it.
 */
function CurrencyTransfer({
  amount,
  from,
  to,
  rate,
  steps,
  current,
  convertAt = 1,
  reference,
  locale,
  labels: labelsProp,
  className,
  ...props
}: CurrencyTransferProps) {
  const labels = useLabels('currency-transfer', defaultCurrencyTransferLabels, labelsProp)
  const converted = current >= convertAt
  const done = current >= steps.length
  const filled = steps.length > 1 ? Math.min(1, current / (steps.length - 1)) : done ? 1 : 0

  return (
    <section
      data-slot="currency-transfer"
      className={cn(
        'flex w-full max-w-sm flex-col gap-5 rounded-2xl border bg-card p-5 text-sm',
        className,
      )}
      {...props}
    >
      <div>
        <p aria-live="polite" className="font-semibold text-3xl tracking-tight">
          <Odometer
            value={converted ? amount * rate : amount}
            decimals={2}
            locale={locale}
            format={{ style: 'currency', currency: converted ? to : from }}
            duration={700}
          />
        </p>
        <p className="mt-1 text-muted-foreground text-xs">
          {labels.rate(
            from,
            new Intl.NumberFormat(locale, { maximumFractionDigits: 4 }).format(rate),
            to,
          )}
        </p>
      </div>
      <ol className="relative flex flex-col gap-4">
        {/* The rail, and how far along it the transfer is. */}
        <span
          aria-hidden="true"
          className="absolute top-2 bottom-2 left-[7px] w-0.5 rounded-full bg-border"
        />
        <span
          aria-hidden="true"
          className="absolute top-2 left-[7px] w-0.5 rounded-full bg-primary transition-[height] duration-(--duration-slower,500ms) ease-(--easing-emphasized,ease-out) motion-reduce:transition-none"
          style={{ height: `calc((100% - 1rem) * ${filled})` }}
        />
        {steps.map((step, i) => {
          const state = i < current ? 'done' : i === current ? 'current' : 'next'
          return (
            <li
              key={step.label}
              className="relative flex gap-3"
              aria-current={state === 'current' ? 'step' : undefined}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'relative z-10 mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 bg-background transition-colors',
                  state === 'done' && 'border-primary bg-primary text-primary-foreground',
                  state === 'current' && 'border-primary',
                )}
              >
                {state === 'done' && <CheckIcon className="size-2.5" strokeWidth={4} />}
                {state === 'current' && (
                  <span className="size-1.5 animate-pulse rounded-full bg-primary motion-reduce:animate-none" />
                )}
              </span>
              <div>
                <p
                  className={cn(
                    state === 'next' && 'text-muted-foreground',
                    state === 'current' && 'font-medium',
                  )}
                >
                  {step.label}
                  <span className="sr-only">, {labels.stepState(state)}</span>
                </p>
                {step.detail && <p className="text-muted-foreground text-xs">{step.detail}</p>}
              </div>
            </li>
          )
        })}
      </ol>
      {done && reference && (
        <div className="flex items-center gap-2 rounded-lg bg-muted/60 py-1.5 pr-1.5 pl-3 animate-in fade-in slide-in-from-bottom-1 motion-reduce:animate-none">
          <div className="min-w-0 flex-1">
            <p className="text-muted-foreground text-xs">{labels.reference}</p>
            <p className="truncate font-mono text-sm">{reference}</p>
          </div>
          <CopyButton value={reference} variant="ghost" size="icon" />
        </div>
      )}
    </section>
  )
}

export { CurrencyTransfer }
