'use client'

import { StarIcon } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar'
import { Marquee } from '@/ui/marquee'

export interface Testimonial {
  quote: React.ReactNode
  name: string
  /** Job title and company, or whatever says who they are. */
  role?: string
  /** A photo. Without one the avatar shows their initials. */
  image?: { src: string; alt?: string }
  /** Stars out of five. Leave it out to show none. */
  rating?: number
}

export interface Testimonials01Props extends Omit<React.ComponentProps<'section'>, 'title'> {
  /** The small line above the heading. `null` hides it. */
  eyebrow?: React.ReactNode | null
  title?: React.ReactNode
  /** The lead under the heading. `null` hides it. */
  description?: React.ReactNode | null
  /** Split between two rows, alternating, so neighbours in the list end up in different rows. */
  testimonials?: Testimonial[]
  /** Seconds for one loop of a row. Default 60. */
  duration?: number
}

const defaultTestimonials: Testimonial[] = [
  {
    quote:
      'We replaced three internal tools in a week. The team stopped asking where things live and started shipping.',
    name: 'Maya Lindqvist',
    role: 'Head of Product, Cinderhouse',
    rating: 5,
  },
  {
    quote:
      'The first product where the defaults are better than what I would have built. I mostly delete code now.',
    name: 'Tomás Herrera',
    role: 'Staff Engineer, Wavelength',
    rating: 5,
  },
  {
    quote:
      'Onboarding took an afternoon. Our designers use it without asking an engineer for help.',
    name: 'Priya Raman',
    role: 'Design Lead, Fieldnote',
    rating: 5,
  },
  {
    quote:
      'Support answered in minutes, on a Sunday, with a fix. That is when we moved the whole company over.',
    name: 'Jonas Becker',
    role: 'CTO, Parcel & Co',
    rating: 5,
  },
  {
    quote: 'It feels fast in the way only well-made software does. Nothing gets in the way.',
    name: 'Aiko Tanaka',
    role: 'Founder, Kumo Studio',
    rating: 4,
  },
  {
    quote:
      'Our weekly report used to take a morning. Now it writes itself and people actually read it.',
    name: 'Daniel Osei',
    role: 'Operations, Brightline',
    rating: 5,
  },
  {
    quote:
      'I recommend it to every founder I advise. It is the boring, reliable choice, and it is lovely.',
    name: 'Sofia Marchetti',
    role: 'Partner, Seedwell',
    rating: 5,
  },
  {
    quote: 'We cut our release checklist in half. The other half is now a button.',
    name: 'Ethan Brooks',
    role: 'Engineering Manager, Tidal',
    rating: 5,
  },
]

/** "Maya Lindqvist" → "ML": first and last initials, one for a single name. */
function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const first = words[0]?.[0] ?? ''
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? '') : ''
  return (first + last).toUpperCase()
}

function Stars({ rating }: { rating: number }) {
  const value = Math.max(0, Math.min(5, Math.round(rating)))
  return (
    <div role="img" aria-label={`${value} out of 5 stars`} className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon
          key={i}
          aria-hidden
          className={cn(
            'size-4',
            i <= value
              ? 'fill-amber-400 text-amber-400'
              : 'fill-muted-foreground/20 text-muted-foreground/20',
          )}
        />
      ))}
    </div>
  )
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const { quote, name, role, image, rating } = testimonial
  return (
    <figure className="flex w-72 shrink-0 flex-col @md:w-80 gap-4 rounded-2xl border bg-card p-6 text-card-foreground shadow-xs transition-[border-color,box-shadow] duration-(--duration-normal,200ms) hover:border-foreground/15 hover:shadow-md">
      {rating != null && <Stars rating={rating} />}
      <blockquote className="flex-1 text-pretty text-body">
        <p>“{quote}”</p>
      </blockquote>
      <figcaption className="flex items-center gap-3">
        <Avatar className="size-10 ring-1 ring-border">
          {image && <AvatarImage src={image.src} alt={image.alt ?? name} />}
          <AvatarFallback className="bg-linear-to-br from-primary/15 to-primary/5 font-semibold text-foreground text-xs">
            {initials(name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="truncate font-medium text-sm">{name}</div>
          {role && <div className="truncate text-caption text-muted-foreground">{role}</div>}
        </div>
      </figcaption>
    </figure>
  )
}

/**
 * A wall of love: a heading over two rows of quote cards drifting in opposite directions.
 * A row pauses under the pointer so a quote can be read, and stands still with reduced motion.
 */
function Testimonials01({
  eyebrow = 'Testimonials',
  title = 'Loved by teams who ship',
  description = 'Thousands of teams run their week on it. Here is what a few of them say.',
  testimonials = defaultTestimonials,
  duration = 60,
  className,
  ...props
}: Testimonials01Props) {
  const headingId = React.useId()
  const rows = [
    testimonials.filter((_, i) => i % 2 === 0),
    testimonials.filter((_, i) => i % 2 === 1),
  ].filter((row) => row.length > 0)

  return (
    <section
      data-slot="block-testimonials-01"
      aria-labelledby={headingId}
      className={cn('@container relative w-full overflow-hidden', className)}
      {...props}
    >
      <div className="py-16 @3xl:py-24">
        <div className="mx-auto flex max-w-2xl flex-col items-center px-6 text-center">
          {eyebrow != null && (
            <p className="mb-3 text-eyebrow text-muted-foreground uppercase">{eyebrow}</p>
          )}
          <h2 id={headingId} className="text-balance text-title">
            {title}
          </h2>
          {description != null && (
            <p className="mt-4 text-pretty text-lead text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="mt-12 flex flex-col gap-4 @3xl:mt-16">
          {rows.map((row, i) => (
            <Marquee
              // biome-ignore lint/suspicious/noArrayIndexKey: the two rows are fixed
              key={i}
              reverse={i === 1}
              duration={duration}
              repeat={row.length < 4 ? 4 : 2}
              className="py-1"
            >
              {row.map((testimonial) => (
                <TestimonialCard key={testimonial.name} testimonial={testimonial} />
              ))}
            </Marquee>
          ))}
        </div>
      </div>
    </section>
  )
}

export { Testimonials01 }
