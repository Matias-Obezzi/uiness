'use client'

import { ArrowRightIcon } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { IPhone } from '@/components/ui/iphone'
import { Pattern } from '@/components/ui/pattern'
import { Reveal } from '@/components/ui/reveal'
import { Safari } from '@/components/ui/safari'
import { cn } from '@/lib/utils'

export interface Hero03Props extends Omit<React.ComponentProps<'section'>, 'title'> {
  /** The small line above the headline. `null` hides it. */
  eyebrow?: React.ReactNode
  title?: React.ReactNode
  description?: React.ReactNode
  primaryAction?: { label: string; href: string } | null
  secondaryAction?: { label: string; href: string } | null
  /** The site in the browser window: its address and a screenshot. */
  desktop?: { url: string; src: string; alt: string }
  /** A screenshot of the phone app. `null` leaves only the browser. */
  mobile?: { src: string; alt: string } | null
}

/**
 * A hero for a product that lives on the web and on the phone: headline, lead and actions
 * above a browser window, with the phone app overlapping its corner. The devices rise in as
 * they come into view, and the phone sits under the browser when the container is narrow.
 */
function Hero03({
  eyebrow = 'Web and mobile',
  title = 'Your whole week, on every screen you own',
  description = 'Plan on the big screen, check off on the go. Everything syncs the moment you change it, even offline.',
  primaryAction = { label: 'Start free', href: '#' },
  secondaryAction = { label: 'Get the app', href: '#' },
  desktop = { url: 'app.example.com/week', src: '/img/gallery-2.png', alt: 'The week view' },
  mobile = { src: '/img/gallery-4.png', alt: 'Today on the phone' },
  className,
  ...props
}: Hero03Props) {
  const headingId = React.useId()
  return (
    <section
      data-slot="block-hero-03"
      aria-labelledby={headingId}
      className={cn('@container relative w-full overflow-hidden', className)}
      {...props}
    >
      <Pattern variant="dots" fadeAt="50% 0%" className="text-border" />
      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-6 pt-16 text-center @3xl:pt-24">
        {eyebrow && <p className="mb-4 text-eyebrow text-primary uppercase">{eyebrow}</p>}
        <h1 id={headingId} className="max-w-3xl text-balance text-title @2xl:text-display">
          {title}
        </h1>
        {description && (
          <p className="mt-5 max-w-2xl text-pretty text-lead text-muted-foreground">
            {description}
          </p>
        )}
        {(primaryAction || secondaryAction) && (
          <div className="mt-8 flex flex-wrap justify-center gap-3">
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

        {/* The phone hangs off the browser's corner when there is room, and sits below it
            when there is not, so it never covers the part of the screenshot that matters. */}
        <div className="relative mt-14 w-full max-w-5xl pb-16 @3xl:mt-20 @3xl:pb-24">
          <Reveal>
            <Safari
              url={desktop.url}
              src={desktop.src}
              alt={desktop.alt}
              className="w-full shadow-2xl shadow-foreground/10"
            />
          </Reveal>
          {mobile && (
            <Reveal
              delay={150}
              className="mx-auto mt-8 w-40 @3xl:absolute @3xl:right-0 @3xl:bottom-6 @3xl:mt-0 @3xl:w-[22%] @5xl:-right-8"
            >
              <IPhone src={mobile.src} alt={mobile.alt} className="drop-shadow-2xl" />
            </Reveal>
          )}
        </div>
      </div>
    </section>
  )
}

export { Hero03 }
