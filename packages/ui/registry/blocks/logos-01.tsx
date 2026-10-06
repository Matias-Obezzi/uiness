'use client'

import {
  AtomIcon,
  FeatherIcon,
  HexagonIcon,
  LeafIcon,
  MountainIcon,
  OrbitIcon,
  SparkleIcon,
  TriangleIcon,
} from 'lucide-react'
import * as React from 'react'
import { Marquee } from '@/components/ui/marquee'
import { cn } from '@/lib/utils'

export interface LogoItem {
  /** The company name, read out and shown as the wordmark. */
  name: string
  /** A mark before the name, like `<HexagonIcon />`. */
  icon?: React.ReactNode
  /** Classes for the wordmark, to give each logo its own type: `font-serif italic`, `font-mono`. */
  className?: string
}

export interface Logos01Props extends Omit<React.ComponentProps<'section'>, 'title'> {
  /** The line above the logos. */
  title?: React.ReactNode
  logos?: LogoItem[]
  /** Seconds for one full loop. Default 40. */
  duration?: number
}

const defaultLogos: LogoItem[] = [
  { name: 'Ridgeline', icon: <MountainIcon />, className: 'font-semibold tracking-tight' },
  { name: 'Lumen', icon: <SparkleIcon />, className: 'font-serif text-2xl italic' },
  { name: 'HEXA', icon: <HexagonIcon />, className: 'font-black tracking-[0.2em]' },
  { name: 'orbital', icon: <OrbitIcon />, className: 'font-mono font-medium lowercase' },
  { name: 'Fieldwork', icon: <LeafIcon />, className: 'font-medium tracking-tight' },
  { name: 'Quill&Co', icon: <FeatherIcon />, className: 'font-serif font-semibold' },
  { name: 'Vertex', icon: <TriangleIcon />, className: 'font-bold uppercase tracking-wide' },
  { name: 'Atomica', icon: <AtomIcon />, className: 'font-light text-2xl tracking-tight' },
]

/**
 * A "trusted by" line over an endless row of customer wordmarks. The row fades out at both
 * edges, stops while the pointer is over it and stands still with reduced motion.
 */
function Logos01({
  title = 'Trusted by product teams at companies of every size',
  logos = defaultLogos,
  duration = 40,
  className,
  ...props
}: Logos01Props) {
  const headingId = React.useId()
  return (
    <section
      data-slot="block-logos-01"
      aria-labelledby={headingId}
      className={cn('@container relative w-full', className)}
      {...props}
    >
      <div className="mx-auto max-w-6xl px-6 py-12 @3xl:py-16">
        <h2 id={headingId} className="text-balance text-center text-caption text-muted-foreground">
          {title}
        </h2>
        <Marquee duration={duration} gap="3.5rem" className="mt-8 py-2 @3xl:mt-10">
          {logos.map((logo) => (
            <span
              key={logo.name}
              className="flex shrink-0 items-center gap-2 whitespace-nowrap text-muted-foreground/80 transition-colors duration-(--duration-normal,200ms) hover:text-foreground"
            >
              {logo.icon && (
                <span aria-hidden className="[&_svg]:size-6">
                  {logo.icon}
                </span>
              )}
              <span className={cn('text-xl leading-none', logo.className)}>{logo.name}</span>
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  )
}

export { Logos01 }
