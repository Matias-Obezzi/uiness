'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { TweetCard, type TweetCardProps } from '@/components/ui/tweet-card'
import { cn } from '@/lib/utils'

export type Testimonial = Omit<TweetCardProps, keyof React.ComponentProps<'article'>> & {
  id: string
}

export interface Testimonials02Labels {
  showMore: string
  showLess: string
}

export interface Testimonials02Props extends Omit<React.ComponentProps<'section'>, 'title'> {
  /** The small line above the heading. `null` hides it. */
  eyebrow?: React.ReactNode
  title?: React.ReactNode
  description?: React.ReactNode
  /** The posts, in the order they fill the columns. */
  posts?: Testimonial[]
  /** How many show before "Show more". Default 6. `0` shows them all. */
  initial?: number
  labels?: Partial<Testimonials02Labels>
}

const defaultLabels: Testimonials02Labels = { showMore: 'Show more', showLess: 'Show less' }

const avatar = (n: number) => `/img/gallery-${n}-tiny.png`

const defaultPosts: Testimonial[] = [
  {
    id: '1',
    author: { name: 'Ana Ruiz', handle: 'anaruiz', avatar: avatar(1), verified: true },
    text: 'Moved the whole team to @weekly last month. Monday planning went from an hour to ten minutes. Not exaggerating.',
    createdAt: '2026-09-12T10:00:00Z',
    metrics: { replies: 12, reposts: 31, likes: 402 },
  },
  {
    id: '2',
    author: { name: 'Tom Becker', handle: 'tbecker', avatar: avatar(2) },
    text: 'The offline mode is the real deal. Planned my whole trip on a plane and it all synced when I landed.',
    createdAt: '2026-09-20T15:30:00Z',
    metrics: { replies: 4, reposts: 9, likes: 188 },
  },
  {
    id: '3',
    author: { name: 'Priya Natarajan', handle: 'priyan', avatar: avatar(3), verified: true },
    text: 'Rare to find a tool that is fast AND quiet. No badges screaming at me, just the week, laid out. #productivity',
    createdAt: '2026-08-30T08:10:00Z',
    metrics: { replies: 21, reposts: 54, likes: 1290 },
  },
  {
    id: '4',
    author: { name: 'Leo Martins', handle: 'leomartins', avatar: avatar(4) },
    text: 'Keyboard shortcuts for everything. I have not touched my mouse in this app for weeks.',
    createdAt: '2026-09-02T19:45:00Z',
    metrics: { replies: 2, reposts: 6, likes: 97 },
  },
  {
    id: '5',
    author: { name: 'Sara Okafor', handle: 'sokafor', avatar: avatar(5) },
    text: 'We tried four planners this year. This is the one the whole team actually opens every morning.',
    createdAt: '2026-09-25T07:20:00Z',
    metrics: { replies: 8, reposts: 17, likes: 341 },
  },
  {
    id: '6',
    author: { name: 'Kenji Watanabe', handle: 'kenjiw', avatar: avatar(6), verified: true },
    text: 'The shared view with our clients replaced a weekly status email. Nobody misses the email.',
    createdAt: '2026-09-18T12:00:00Z',
    metrics: { replies: 6, reposts: 22, likes: 515 },
  },
  {
    id: '7',
    author: { name: 'Mia Larsen', handle: 'mialarsen', avatar: avatar(1) },
    text: 'Small thing, but the way it suggests a slot for a task based on how long it took last time? Magic.',
    createdAt: '2026-09-27T16:40:00Z',
    metrics: { replies: 3, reposts: 5, likes: 143 },
  },
  {
    id: '8',
    author: { name: 'Diego Ferreira', handle: 'diegof', avatar: avatar(2) },
    text: 'Support answered in four minutes on a Sunday. Then shipped the fix on Tuesday. Customer for life.',
    createdAt: '2026-09-29T21:05:00Z',
    metrics: { replies: 9, reposts: 28, likes: 610 },
  },
]

/**
 * Posts from customers in a masonry wall: one column when narrow, up to three with room. The
 * wall stops after a few with a fade and a button that shows the rest; posts keep their
 * reading order down each column.
 */
function Testimonials02({
  eyebrow = 'Wall of love',
  title = 'People talk about their week',
  description = 'Unedited posts from teams who plan with us.',
  posts = defaultPosts,
  initial = 6,
  labels: labelsProp,
  className,
  ...props
}: Testimonials02Props) {
  const labels = { ...defaultLabels, ...labelsProp }
  const headingId = React.useId()
  const wallId = React.useId()
  const [expanded, setExpanded] = React.useState(false)
  const folds = initial > 0 && posts.length > initial
  const shown = folds && !expanded ? posts.slice(0, initial) : posts

  return (
    <section
      data-slot="block-testimonials-02"
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

        <div className="relative mt-12">
          <ul
            id={wallId}
            className="columns-1 gap-4 @2xl:columns-2 @4xl:columns-3 [&>li]:mb-4 [&>li]:break-inside-avoid"
          >
            {shown.map(({ id, ...post }) => (
              <li key={id}>
                <TweetCard {...post} className="w-full max-w-none" />
              </li>
            ))}
          </ul>
          {folds && !expanded && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-background to-transparent"
            />
          )}
        </div>

        {folds && (
          <div className="mt-6 flex justify-center">
            <Button
              variant="outline"
              aria-expanded={expanded}
              aria-controls={wallId}
              onClick={() => setExpanded((open) => !open)}
            >
              {expanded ? labels.showLess : labels.showMore}
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}

export { Testimonials02 }
