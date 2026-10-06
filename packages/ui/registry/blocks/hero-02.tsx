'use client'

import { ArrowRightIcon, SparklesIcon, TrendingUpIcon } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Pattern } from '@/components/ui/pattern'
import { TiltCard, TiltCardItem } from '@/components/ui/tilt-card'
import { cn } from '@/lib/utils'

export interface HeroAction {
  label: string
  href: string
}

export interface HeroStat {
  /** The figure, as it should read: `12k+`, `99.9%`, `4.9/5`. */
  value: string
  label: string
}

export interface HeroHighlight {
  value: string
  label: string
}

export interface HeroImage {
  src: string
  alt: string
}

export interface Hero02Props extends Omit<React.ComponentProps<'section'>, 'title'> {
  /** The small line above the headline. `null` hides it. */
  eyebrow?: React.ReactNode
  title?: React.ReactNode
  description?: React.ReactNode
  /** `null` hides a button. */
  primaryAction?: HeroAction | null
  secondaryAction?: HeroAction | null
  /** A row of small figures under the buttons. `null` or `[]` hides it. */
  stats?: HeroStat[] | null
  /** A screenshot of the product. Without one, a drawn product mockup takes its place. */
  image?: HeroImage | null
  /** A small card that floats above the corner of the picture. `null` hides it. */
  badge?: HeroHighlight | null
}

const defaultStats: HeroStat[] = [
  { value: '12k+', label: 'teams on board' },
  { value: '99.99%', label: 'uptime last year' },
  { value: '4.9/5', label: 'average review' },
]

const chartBars = [38, 52, 44, 66, 58, 74, 62, 86, 78, 92, 84, 100]

const mockRows = [
  { name: 'Checkout redesign', status: 'Shipped', tone: 'bg-emerald-500' },
  { name: 'Usage-based billing', status: 'In review', tone: 'bg-amber-500' },
  { name: 'Mobile onboarding', status: 'Building', tone: 'bg-sky-500' },
]

/** The drawn stand-in for a screenshot: a small analytics app made of boxes. */
function ProductMockup() {
  return (
    <div aria-hidden className="flex flex-col overflow-hidden rounded-[inherit] text-left">
      <div className="flex items-center gap-1.5 border-b bg-muted/50 px-4 py-3">
        <span className="size-2.5 rounded-full bg-foreground/15" />
        <span className="size-2.5 rounded-full bg-foreground/15" />
        <span className="size-2.5 rounded-full bg-foreground/15" />
        <span className="ml-3 h-5 flex-1 rounded-md bg-background/80 @md:max-w-56" />
      </div>
      <div className="flex">
        <div className="hidden w-36 shrink-0 flex-col gap-2 border-r p-4 @xl:flex">
          <span className="mb-2 h-3 w-16 rounded bg-foreground/80" />
          {[70, 55, 80, 60, 45].map((w, i) => (
            <span
              key={w}
              className={cn('h-2.5 rounded', i === 1 ? 'bg-primary/60' : 'bg-muted-foreground/20')}
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-4 p-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              ['Revenue', '$48.2k'],
              ['Active', '2,931'],
              ['Churn', '1.2%'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border bg-background p-2.5">
                <div className="text-[0.625rem] text-muted-foreground uppercase tracking-wide">
                  {label}
                </div>
                <div className="mt-0.5 font-semibold text-sm tabular-nums">{value}</div>
              </div>
            ))}
          </div>
          <div className="rounded-lg border bg-background p-3">
            <div className="mb-3 flex items-center justify-between">
              <span className="h-2.5 w-20 rounded bg-foreground/70" />
              <span className="h-2.5 w-10 rounded bg-muted-foreground/25" />
            </div>
            <div className="flex h-24 items-end gap-1.5">
              {chartBars.map((h, i) => (
                <span
                  // biome-ignore lint/suspicious/noArrayIndexKey: a fixed decorative series
                  key={i}
                  className="flex-1 rounded-t-sm bg-gradient-to-t from-primary/25 to-primary/70"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col divide-y rounded-lg border bg-background">
            {mockRows.map((row) => (
              <div key={row.name} className="flex items-center gap-3 px-3 py-2 text-xs">
                <span className={cn('size-1.5 shrink-0 rounded-full', row.tone)} />
                <span className="truncate font-medium">{row.name}</span>
                <span className="ml-auto shrink-0 text-muted-foreground">{row.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * A split hero: eyebrow, headline, lead, two actions and a row of small figures on one
 * side, and the product on the other, on a card that tilts towards the pointer. Pass
 * `image` for a real screenshot; without one it draws a product mockup. The columns stack
 * when the container is narrow.
 */
function Hero02({
  eyebrow = 'Analytics for product teams',
  title = 'See what moved the numbers, while it still matters',
  description = 'Revenue, usage and releases on one live board. Spot the change, find the cause and tell the team before the weekly meeting does.',
  primaryAction = { label: 'Start free trial', href: '#' },
  secondaryAction = { label: 'Book a demo', href: '#' },
  stats = defaultStats,
  image,
  badge = { value: '+24.8%', label: 'conversion this week' },
  className,
  ...props
}: Hero02Props) {
  const headingId = React.useId()
  return (
    <section
      data-slot="block-hero-02"
      aria-labelledby={headingId}
      className={cn('@container relative isolate w-full overflow-hidden', className)}
      {...props}
    >
      <Pattern variant="dots" size={24} fadeAt="75% 40%" className="-z-10 text-border" />
      <div
        aria-hidden
        className="-z-10 absolute top-1/4 right-0 size-[28rem] rounded-full bg-primary/[0.07] blur-3xl"
      />
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-16 @3xl:py-24 @4xl:grid-cols-[1fr_1.1fr] @4xl:gap-12">
        <div className="flex flex-col items-start">
          {eyebrow && (
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-eyebrow text-muted-foreground uppercase backdrop-blur">
              <SparklesIcon aria-hidden className="size-3.5 text-primary" />
              {eyebrow}
            </p>
          )}
          <h1
            id={headingId}
            className="text-balance text-title @3xl:text-display @4xl:text-[clamp(2.5rem,5cqi,3.75rem)]"
          >
            {title}
          </h1>
          {description && (
            <p className="mt-5 max-w-xl text-pretty text-lead text-muted-foreground">
              {description}
            </p>
          )}
          {(primaryAction || secondaryAction) && (
            <div className="mt-8 flex w-full flex-col items-stretch gap-3 @md:w-auto @md:flex-row @md:items-center">
              {primaryAction && (
                <Button asChild size="lg">
                  <a href={primaryAction.href}>
                    {primaryAction.label}
                    <ArrowRightIcon />
                  </a>
                </Button>
              )}
              {secondaryAction && (
                <Button asChild size="lg" variant="outline">
                  <a href={secondaryAction.href}>{secondaryAction.label}</a>
                </Button>
              )}
            </div>
          )}
          {stats && stats.length > 0 && (
            <dl className="mt-10 grid w-full max-w-lg grid-cols-3 divide-x border-t pt-6">
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col gap-1 px-4 first:pl-0">
                  <dt className="order-2 text-caption text-muted-foreground">{stat.label}</dt>
                  <dd className="order-1 font-semibold text-xl tabular-nums tracking-tight @md:text-2xl">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        <div className="relative w-full">
          <TiltCard max={6} scale={1.01} className="overflow-visible bg-card shadow-2xl">
            {image ? (
              <img
                src={image.src}
                alt={image.alt}
                className="block h-auto w-full rounded-[inherit] object-cover"
              />
            ) : (
              <ProductMockup />
            )}
            {badge && (
              <TiltCardItem
                depth={60}
                className="-bottom-5 -left-2 @4xl:-left-8 absolute flex items-center gap-3 rounded-xl border bg-background/95 px-4 py-3 shadow-lg backdrop-blur"
              >
                <span className="grid size-8 place-items-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <TrendingUpIcon aria-hidden className="size-4" />
                </span>
                <span className="flex flex-col">
                  <span className="font-semibold text-sm tabular-nums">{badge.value}</span>
                  <span className="text-muted-foreground text-xs">{badge.label}</span>
                </span>
              </TiltCardItem>
            )}
          </TiltCard>
        </div>
      </div>
    </section>
  )
}

export { Hero02 }
