'use client'

import { CheckIcon, SparklesIcon } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/ui/badge'
import { Button } from '@/ui/button'
import { GradientBorder } from '@/ui/gradient-text'
import { Odometer } from '@/ui/odometer'
import { ToggleGroup, ToggleGroupItem } from '@/ui/toggle-group'

export type PricingBilling = 'monthly' | 'yearly'

export interface PricingAction {
  label: string
  href: string
}

export interface PricingPlan {
  name: string
  description?: React.ReactNode
  /** Price per month for each billing period: `yearly` is the monthly price when paid for a year. */
  price: { monthly: number; yearly: number }
  features: string[]
  cta: PricingAction
  /** The recommended plan: a flowing ring, a badge and the filled button. */
  highlighted?: boolean
}

export interface PricingLabels {
  monthly: string
  yearly: string
  /** The badge next to the yearly option. Empty hides it. */
  save: string
  /** After the price. */
  period: string
  /** Under the price, billed monthly. */
  billedMonthly: string
  /** Under the price, billed yearly; `{total}` becomes the yearly total. */
  billedYearly: string
  /** Under the price of a plan that costs nothing. */
  free: string
  /** The badge on the highlighted plan. */
  popular: string
}

export interface Pricing01Props extends Omit<React.ComponentProps<'section'>, 'title'> {
  /** The small line above the heading. `null` hides it. */
  eyebrow?: React.ReactNode | null
  title?: React.ReactNode
  /** The lead under the heading. `null` hides it. */
  description?: React.ReactNode | null
  plans?: PricingPlan[]
  /** ISO 4217 code for the prices. Default `USD`. */
  currency?: string
  /** Locale for the numbers. Default `en-US`. */
  locale?: string
  /** Digits after the decimal point. Default 0. */
  decimals?: number
  /** The billing period shown first. Default `monthly`. */
  defaultBilling?: PricingBilling
  /** The words around the prices; give only the ones you change. */
  labels?: Partial<PricingLabels>
  /** A line under the plans: taxes, trials, refunds. `null` hides it. */
  note?: React.ReactNode | null
}

const defaultPlans: PricingPlan[] = [
  {
    name: 'Starter',
    description: 'For side projects and trying things out.',
    price: { monthly: 0, yearly: 0 },
    features: ['Up to 3 projects', '1,000 events a month', 'Community support', '7-day history'],
    cta: { label: 'Start for free', href: '#' },
  },
  {
    name: 'Pro',
    description: 'For makers shipping to real customers.',
    price: { monthly: 24, yearly: 19 },
    features: [
      'Unlimited projects',
      '250,000 events a month',
      'Custom domains',
      'Priority email support',
      '1-year history',
    ],
    cta: { label: 'Start a 14-day trial', href: '#' },
    highlighted: true,
  },
  {
    name: 'Team',
    description: 'For teams that need control and scale.',
    price: { monthly: 59, yearly: 47 },
    features: [
      'Everything in Pro',
      '2 million events a month',
      'Roles and SSO',
      'Audit log',
      'Shared Slack channel',
    ],
    cta: { label: 'Talk to sales', href: '#' },
  },
]

const defaultLabels: PricingLabels = {
  monthly: 'Monthly',
  yearly: 'Yearly',
  save: 'Save 20%',
  period: '/ month',
  billedMonthly: 'Billed monthly',
  billedYearly: '{total} billed yearly',
  free: 'Free forever',
  popular: 'Most popular',
}

/**
 * Three plans side by side with a monthly/yearly switch. Switching rolls every price to its
 * new value, and the recommended plan wears a flowing gradient ring. One column when narrow,
 * three when there is room.
 */
function Pricing01({
  eyebrow = 'Pricing',
  title = 'Simple pricing that grows with you',
  description = 'Start free, upgrade when it pays for itself. Every plan includes the full editor, unlimited collaborators and our uptime promise.',
  plans = defaultPlans,
  currency = 'USD',
  locale = 'en-US',
  decimals = 0,
  defaultBilling = 'monthly',
  labels: labelsProp,
  note = 'Prices exclude tax. Cancel or change plans at any time.',
  className,
  ...props
}: Pricing01Props) {
  const headingId = React.useId()
  const [billing, setBilling] = React.useState<PricingBilling>(defaultBilling)
  const labels = { ...defaultLabels, ...labelsProp }

  const format = React.useMemo<Intl.NumberFormatOptions>(
    () => ({
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }),
    [currency, decimals],
  )
  const formatter = React.useMemo(() => new Intl.NumberFormat(locale, format), [locale, format])

  return (
    <section
      data-slot="block-pricing-01"
      aria-labelledby={headingId}
      className={cn('@container relative isolate w-full overflow-hidden', className)}
      {...props}
    >
      {/* A soft glow behind the plans, strongest where the recommended one sits. */}
      <div
        aria-hidden
        className="-z-10 -translate-x-1/2 pointer-events-none absolute top-[60%] left-1/2 aspect-square -translate-y-1/2 w-[60rem] max-w-[150%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--primary)_8%,transparent),transparent)]"
      />
      <div className="mx-auto max-w-6xl px-6 py-16 @3xl:py-24">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          {eyebrow != null && (
            <p className="mb-3 text-eyebrow text-muted-foreground uppercase">{eyebrow}</p>
          )}
          <h2 id={headingId} className="text-balance text-title">
            {title}
          </h2>
          {description != null && (
            <p className="mt-4 text-pretty text-lead text-muted-foreground">{description}</p>
          )}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <ToggleGroup
              type="single"
              aria-label="Billing period"
              value={billing}
              // A segmented control always has one side on: ignore the click that would clear it.
              onValueChange={(value) => value && setBilling(value as PricingBilling)}
              className="rounded-full border bg-background p-1 shadow-xs"
            >
              {(['monthly', 'yearly'] as const).map((period) => (
                <ToggleGroupItem
                  key={period}
                  value={period}
                  className="h-8 rounded-full! px-4 text-muted-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm hover:data-[state=on]:bg-primary hover:data-[state=on]:text-primary-foreground"
                >
                  {labels[period]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            {labels.save && (
              <Badge
                variant="outline"
                className={cn(
                  'bg-background transition-colors duration-(--duration-normal,200ms)',
                  billing === 'yearly' && 'border-transparent bg-primary/10 text-foreground',
                )}
              >
                <SparklesIcon />
                {labels.save}
              </Badge>
            )}
          </div>
        </div>

        <ul className="mx-auto mt-14 grid max-w-md gap-6 @4xl:max-w-none @4xl:grid-cols-3 @4xl:items-stretch">
          {plans.map((plan) => {
            const price = plan.price[billing]
            const free = plan.price.monthly === 0 && plan.price.yearly === 0
            const caption = free
              ? labels.free
              : billing === 'yearly'
                ? labels.billedYearly.replace('{total}', formatter.format(price * 12))
                : labels.billedMonthly
            const body = (
              <div
                data-slot="card-body"
                className={cn(
                  'relative flex h-full flex-col rounded-2xl bg-card p-6 text-card-foreground @4xl:p-8',
                  !plan.highlighted && 'border shadow-xs',
                  plan.highlighted && 'shadow-lg shadow-primary/5',
                )}
              >
                <h3 className="text-subheading">{plan.name}</h3>
                {plan.description && (
                  <p className="mt-1.5 text-caption text-muted-foreground">{plan.description}</p>
                )}
                <div className="mt-6 flex items-baseline gap-1.5">
                  <Odometer
                    value={price}
                    locale={locale}
                    format={format}
                    duration={700}
                    className="font-semibold text-[2.75rem] leading-none tracking-tight"
                  />
                  <span className="text-caption text-muted-foreground">{labels.period}</span>
                </div>
                <p className="mt-2 min-h-[1lh] text-caption text-muted-foreground">{caption}</p>
                <Button
                  asChild
                  size="lg"
                  variant={plan.highlighted ? 'default' : 'outline'}
                  className="mt-6 w-full"
                >
                  <a href={plan.cta.href}>{plan.cta.label}</a>
                </Button>
                <ul className="mt-8 space-y-3 border-t pt-6 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <span
                        aria-hidden
                        className={cn(
                          'mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full',
                          plan.highlighted
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground',
                        )}
                      >
                        <CheckIcon className="size-3" strokeWidth={3} />
                      </span>
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
            return (
              <li key={plan.name} data-highlighted={plan.highlighted || undefined}>
                {plan.highlighted ? (
                  <GradientBorder
                    width="1.5px"
                    speed={0.6}
                    // The ring is drawn in the padding, so the card sits inside it.
                    className="h-full rounded-2xl p-[1.5px] [&>[data-slot=card-body]]:rounded-[calc(1rem-1.5px)]"
                  >
                    <div
                      aria-hidden
                      className="-z-10 -inset-2 pointer-events-none absolute rounded-[inherit] bg-linear-to-br from-violet-500/25 via-pink-500/15 to-cyan-500/25 opacity-70 blur-2xl"
                    />
                    {labels.popular && (
                      <Badge className="-translate-x-1/2 -top-3 absolute left-1/2 z-(--z-raised,10) px-3 py-1 shadow-sm">
                        {labels.popular}
                      </Badge>
                    )}
                    {body}
                  </GradientBorder>
                ) : (
                  body
                )}
              </li>
            )
          })}
        </ul>

        {note != null && (
          <p className="mt-10 text-center text-caption text-muted-foreground">{note}</p>
        )}
      </div>
    </section>
  )
}

export { Pricing01 }
