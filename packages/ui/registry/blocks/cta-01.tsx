'use client'

import { ArrowRightIcon, type LucideIcon, RocketIcon } from 'lucide-react'
import * as React from 'react'
import { Aurora } from '@/components/ui/aurora'
import { Button } from '@/components/ui/button'
import { Pattern } from '@/components/ui/pattern'
import { Sonar } from '@/components/ui/sonar'
import { Spotlight } from '@/components/ui/spotlight'
import { cn } from '@/lib/utils'

export interface CtaAction {
  label: string
  href: string
}

export interface Cta01Props extends Omit<React.ComponentProps<'section'>, 'title'> {
  /** The icon in the pulsing badge above the headline. `null` hides the badge. */
  icon?: LucideIcon | null
  title?: React.ReactNode
  description?: React.ReactNode
  primaryAction?: CtaAction | null
  secondaryAction?: CtaAction | null
  /** A short line under the buttons. `null` hides it. */
  note?: React.ReactNode
}

/** Decorative hues for the aurora. They sit behind the text at low strength in both themes. */
const auroraColors: [string, string, string] = [
  'oklch(0.68 0.22 285)',
  'oklch(0.75 0.16 215)',
  'oklch(0.78 0.17 155)',
]

/**
 * A closing call to action: a card with a slow aurora behind it and a light that follows the
 * pointer, a badge that pulses, a headline, one line and two actions. Put it just above the
 * footer, where the page asks for the next step.
 */
function Cta01({
  icon: Icon = RocketIcon,
  title = 'Your next launch starts here',
  description = 'Bring the team over in an afternoon. Import your projects, invite everyone, and plan the week before lunch.',
  primaryAction = { label: 'Start free trial', href: '#' },
  secondaryAction = { label: 'Talk to sales', href: '#' },
  note = 'Free for 14 days. No card needed.',
  className,
  ...props
}: Cta01Props) {
  const headingId = React.useId()
  return (
    <section
      data-slot="block-cta-01"
      aria-labelledby={headingId}
      className={cn('@container w-full', className)}
      {...props}
    >
      <div className="mx-auto max-w-6xl px-6 py-16 @3xl:py-24">
        <Spotlight
          size={560}
          strength={0.12}
          className="isolate rounded-3xl border bg-card shadow-sm"
        >
          <Aurora colors={auroraColors} blur={90} duration={22} className="-z-10" />
          <Pattern variant="dots" size={22} className="-z-10 text-foreground/15" />
          <div className="relative flex flex-col items-center px-5 py-16 text-center @3xl:px-16 @3xl:py-24">
            {Icon && (
              <Sonar rings={3} duration={3.5} scale={2.2} className="mb-8 text-primary/40">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                  <Icon aria-hidden className="size-5" />
                </span>
              </Sonar>
            )}
            <h2 id={headingId} className="max-w-2xl text-balance text-title @3xl:text-display">
              {title}
            </h2>
            {description && (
              <p className="mt-5 max-w-xl text-pretty text-lead text-muted-foreground">
                {description}
              </p>
            )}
            {(primaryAction || secondaryAction) && (
              <div className="mt-9 flex w-full flex-col items-stretch gap-3 @md:w-auto @md:flex-row @md:items-center">
                {primaryAction && (
                  <Button asChild size="lg" className="group rounded-full">
                    <a href={primaryAction.href}>
                      {primaryAction.label}
                      <ArrowRightIcon className="transition-transform duration-(--duration-fast,150ms) group-hover:translate-x-0.5" />
                    </a>
                  </Button>
                )}
                {secondaryAction && (
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="rounded-full bg-background/60 backdrop-blur"
                  >
                    <a href={secondaryAction.href}>{secondaryAction.label}</a>
                  </Button>
                )}
              </div>
            )}
            {note && <p className="mt-5 text-caption text-muted-foreground">{note}</p>}
          </div>
        </Spotlight>
      </div>
    </section>
  )
}

export { Cta01 }
