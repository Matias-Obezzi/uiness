'use client'

import { ArrowRightIcon } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { GradientText } from '@/components/ui/gradient-text'
import { Pattern } from '@/components/ui/pattern'
import { cn } from '@/lib/utils'

export interface HeroAction {
  label: string
  href: string
}

export interface Hero01Props extends Omit<React.ComponentProps<'section'>, 'title'> {
  /** The small pill above the headline, a link to what is new. `null` hides it. */
  announcement?: HeroAction | null
  /** The headline before the highlighted words. */
  title?: React.ReactNode
  /** The words at the end of the headline, filled with a flowing gradient. */
  highlight?: string
  description?: React.ReactNode
  /** `null` hides a button. */
  primaryAction?: HeroAction | null
  secondaryAction?: HeroAction | null
  /** A short line under the buttons: a promise, a limit, a reassurance. */
  note?: React.ReactNode
}

/**
 * A centered hero: an announcement pill, a headline that ends in a gradient, a lead
 * paragraph and two actions, over a grid that fades out. Lays itself out by the width of
 * its container, so it works in a full page as well as in a panel.
 */
function Hero01({
  announcement = { label: 'Blocks are here: whole sections, ready to paste', href: '#' },
  title = 'Ship pages that feel',
  highlight = 'finished',
  description = 'Prebuilt sections made from the components you already have. Install one, change the words, and move on to the part only you can build.',
  primaryAction = { label: 'Get started', href: '#' },
  secondaryAction = { label: 'Browse blocks', href: '#' },
  note = 'Free and open source. Copy what you need, own all of it.',
  className,
  ...props
}: Hero01Props) {
  const headingId = React.useId()
  return (
    <section
      data-slot="block-hero-01"
      aria-labelledby={headingId}
      className={cn('@container relative isolate w-full overflow-hidden', className)}
      {...props}
    >
      <Pattern variant="grid" size={40} fadeAt="50% 0%" className="-z-10 text-border" />
      <div className="mx-auto flex max-w-4xl flex-col items-center px-6 pt-20 pb-16 text-center @3xl:pt-28 @3xl:pb-24">
        {announcement && (
          <a
            href={announcement.href}
            className="group mb-6 inline-flex max-w-full items-center gap-2 rounded-full border bg-background/80 py-1 pr-3 pl-1 text-caption backdrop-blur transition-colors hover:bg-accent"
          >
            <span className="rounded-full bg-primary px-2 py-0.5 font-medium text-primary-foreground text-xs">
              New
            </span>
            <span className="truncate text-muted-foreground group-hover:text-foreground">
              {announcement.label}
            </span>
            <ArrowRightIcon className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-(--duration-fast,150ms) group-hover:translate-x-0.5" />
          </a>
        )}
        <h1 id={headingId} className="max-w-3xl text-balance text-title @2xl:text-display">
          {title}
          {highlight && (
            <>
              {' '}
              <GradientText>{highlight}</GradientText>
            </>
          )}
        </h1>
        {description && (
          <p className="mt-5 max-w-2xl text-pretty text-lead text-muted-foreground">
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
        {note && <p className="mt-4 text-caption text-muted-foreground">{note}</p>}
      </div>
    </section>
  )
}

export { Hero01 }
