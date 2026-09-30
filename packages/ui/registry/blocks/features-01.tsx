'use client'

import {
  BellRingIcon,
  GaugeIcon,
  LayersIcon,
  LockKeyholeIcon,
  PlugZapIcon,
  UsersIcon,
} from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'
import { Reveal } from '@/ui/reveal'

export interface FeatureItem {
  /** An icon element, like `<GaugeIcon />`. */
  icon?: React.ReactNode
  title: string
  description: React.ReactNode
}

export interface Features01Props extends Omit<React.ComponentProps<'section'>, 'title'> {
  /** The small line above the heading. `null` hides it. */
  eyebrow?: React.ReactNode
  title?: React.ReactNode
  description?: React.ReactNode
  features?: FeatureItem[]
}

const defaultFeatures: FeatureItem[] = [
  {
    icon: <GaugeIcon />,
    title: 'Fast by default',
    description: 'Pages load in under a second on a mid-range phone, with nothing to tune first.',
  },
  {
    icon: <LayersIcon />,
    title: 'Composable',
    description: 'Every part is a small piece you can take apart, restyle and put back together.',
  },
  {
    icon: <UsersIcon />,
    title: 'Built for teams',
    description: 'Roles, reviews and a shared history, so nobody overwrites anybody by accident.',
  },
  {
    icon: <LockKeyholeIcon />,
    title: 'Private by design',
    description: 'Data is encrypted at rest and in transit, and stays in the region you pick.',
  },
  {
    icon: <PlugZapIcon />,
    title: 'Connects to your stack',
    description: 'Webhooks, a typed API and ready-made integrations for the tools you already use.',
  },
  {
    icon: <BellRingIcon />,
    title: 'Alerts that matter',
    description:
      'Set a threshold once and hear about it the moment it is crossed, not at month end.',
  },
]

/**
 * A heading and a grid of features, each with an icon, a title and a sentence. One, two
 * or three columns by the width of the container; the cells cascade in as they scroll into
 * view.
 */
function Features01({
  eyebrow = 'Features',
  title = 'Everything you need, nothing you have to babysit',
  description = 'The parts every product ends up needing, done properly once, so your team can spend its week on the parts only it can build.',
  features = defaultFeatures,
  className,
  ...props
}: Features01Props) {
  const headingId = React.useId()
  return (
    <section
      data-slot="block-features-01"
      aria-labelledby={headingId}
      className={cn('@container relative w-full', className)}
      {...props}
    >
      <div className="mx-auto max-w-6xl px-6 py-16 @3xl:py-24">
        <div className="mx-auto max-w-2xl text-center">
          {eyebrow && <p className="mb-3 text-eyebrow text-primary uppercase">{eyebrow}</p>}
          <h2 id={headingId} className="text-balance text-title">
            {title}
          </h2>
          {description && (
            <p className="mt-4 text-pretty text-lead text-muted-foreground">{description}</p>
          )}
        </div>
        <Reveal
          variant="up"
          stagger={80}
          className="mt-14 grid grid-cols-1 gap-x-10 gap-y-10 @3xl:gap-y-14 @xl:grid-cols-2 @4xl:grid-cols-3"
        >
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative flex flex-col items-start border-t pt-8"
            >
              <span
                aria-hidden
                className="-top-px absolute left-0 h-px w-12 bg-foreground transition-[width] duration-(--duration-slower,500ms) ease-emphasized group-hover:w-full motion-reduce:transition-none"
              />
              {feature.icon && (
                <div
                  aria-hidden
                  className="relative isolate mb-5 grid size-11 place-items-center rounded-xl border bg-gradient-to-b from-background to-muted text-foreground shadow-xs transition-transform duration-(--duration-slow,300ms) ease-spring group-hover:-translate-y-0.5 group-hover:rotate-[-4deg] motion-reduce:transition-none [&_svg]:size-5"
                >
                  <span className="-z-10 absolute inset-0 rounded-[inherit] bg-primary/20 opacity-0 blur-md transition-opacity duration-(--duration-slow,300ms) group-hover:opacity-100" />
                  {feature.icon}
                </div>
              )}
              <h3 className="text-subheading">{feature.title}</h3>
              <p className="mt-2 text-pretty text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  )
}

export { Features01 }
