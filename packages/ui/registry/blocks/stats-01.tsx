'use client'

import * as React from 'react'
import { NumberTicker } from '@/components/ui/number-ticker'
import { cn } from '@/lib/utils'

export interface StatItem {
  /** The number the figure counts up to. */
  value: number
  /** Text before the number, like `$`. */
  prefix?: string
  /** Text after the number, like `%`, `k+` or `ms`. */
  suffix?: string
  /** Digits after the decimal point. Default 0. */
  decimals?: number
  label: string
  /** A short line under the label: the period, the source, the comparison. */
  caption?: React.ReactNode
}

export interface Stats01Props extends Omit<React.ComponentProps<'section'>, 'title'> {
  /** The small line above the heading. `null` hides it. */
  eyebrow?: React.ReactNode
  title?: React.ReactNode
  description?: React.ReactNode
  stats?: StatItem[]
}

const defaultStats: StatItem[] = [
  {
    value: 12,
    suffix: 'k+',
    label: 'Teams',
    caption: 'from two-person startups to public companies',
  },
  {
    value: 99.99,
    suffix: '%',
    decimals: 2,
    label: 'Uptime',
    caption: 'over the last twelve months',
  },
  {
    value: 4.2,
    prefix: '$',
    suffix: 'M',
    decimals: 1,
    label: 'Saved',
    caption: 'in tooling costs, by our customers, last year',
  },
  { value: 38, suffix: 'ms', label: 'Median response', caption: 'across every region we run in' },
]

/**
 * A heading over a row of big figures that count up as they come into view, each with a
 * label and a short caption, separated by hairlines. Two columns when narrow, four when
 * there is room.
 */
function Stats01({
  eyebrow = 'By the numbers',
  title = 'Numbers we are proud of, and we check them daily',
  description,
  stats = defaultStats,
  className,
  ...props
}: Stats01Props) {
  const headingId = React.useId()
  return (
    <section
      data-slot="block-stats-01"
      aria-labelledby={headingId}
      className={cn('@container relative w-full', className)}
      {...props}
    >
      <div className="mx-auto max-w-6xl px-6 py-16 @3xl:py-24">
        <div className="max-w-2xl">
          {eyebrow && <p className="mb-3 text-eyebrow text-primary uppercase">{eyebrow}</p>}
          <h2 id={headingId} className="text-balance text-title">
            {title}
          </h2>
          {description && (
            <p className="mt-4 text-pretty text-lead text-muted-foreground">{description}</p>
          )}
        </div>
        <dl className="mt-12 grid grid-cols-2 border-y @3xl:mt-16 @3xl:grid-cols-4">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={cn(
                'flex min-w-0 flex-col gap-2 py-8 pr-4 @3xl:py-10 @3xl:pr-6',
                // Hairlines between cells: two by two, then one row.
                'even:border-l even:pl-4 [&:nth-child(n+3)]:border-t',
                '@3xl:[&:nth-child(n+3)]:border-t-0 @3xl:[&:not(:first-child)]:border-l @3xl:[&:not(:first-child)]:pl-6',
              )}
            >
              <dt className="order-2 font-medium">{stat.label}</dt>
              <dd className="order-1 whitespace-nowrap font-semibold text-4xl tabular-nums tracking-tight @5xl:text-5xl @6xl:text-6xl">
                {stat.prefix && <span className="text-muted-foreground">{stat.prefix}</span>}
                <NumberTicker value={stat.value} decimals={stat.decimals ?? 0} delay={i * 120} />
                {stat.suffix && <span className="text-muted-foreground">{stat.suffix}</span>}
              </dd>
              {stat.caption && (
                <dd className="order-3 text-caption text-muted-foreground">{stat.caption}</dd>
              )}
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

export { Stats01 }
