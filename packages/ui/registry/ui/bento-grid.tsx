import type * as React from 'react'
import { cn } from '@/lib/utils'

function BentoGrid({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="bento-grid"
      className={cn(
        'grid auto-rows-[minmax(11rem,auto)] grid-cols-1 gap-4 md:grid-cols-3',
        className,
      )}
      {...props}
    />
  )
}

const spanClasses = { 1: 'md:col-span-1', 2: 'md:col-span-2', 3: 'md:col-span-3' } as const
const rowClasses = { 1: 'md:row-span-1', 2: 'md:row-span-2', 3: 'md:row-span-3' } as const

export interface BentoCardProps extends Omit<React.ComponentProps<'div'>, 'title'> {
  title?: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
  /** Visual at the top of the card: an image, a chart, a pattern. Lifts on hover. */
  header?: React.ReactNode
  /** Columns the card takes on wide screens. Default 1. */
  span?: 1 | 2 | 3
  /** Rows the card takes on wide screens. Default 1. */
  rows?: 1 | 2 | 3
  /** Makes the whole card a link. */
  href?: string
}

/**
 * A card for the bento grid: a header visual, then icon, title and description that
 * nudge up on hover.
 */
function BentoCard({
  title,
  description,
  icon,
  header,
  span = 1,
  rows = 1,
  href,
  className,
  children,
  ...props
}: BentoCardProps) {
  const body = (
    <>
      {header && (
        <div
          data-slot="bento-header"
          className="min-h-24 flex-1 overflow-hidden rounded-lg transition-transform duration-300 group-hover/bento:scale-[1.02] motion-reduce:transition-none"
        >
          {header}
        </div>
      )}
      <div
        data-slot="bento-body"
        className="transition-transform duration-300 group-hover/bento:-translate-y-0.5 motion-reduce:transition-none"
      >
        {icon && (
          <div className="mb-2 text-muted-foreground [&_svg]:size-5" data-slot="bento-icon">
            {icon}
          </div>
        )}
        {title && (
          <h3 data-slot="bento-title" className="font-semibold leading-tight">
            {title}
          </h3>
        )}
        {description && (
          <p data-slot="bento-description" className="mt-1 text-muted-foreground text-sm">
            {description}
          </p>
        )}
        {children}
      </div>
    </>
  )
  const classes = cn(
    'group/bento relative flex flex-col justify-between gap-4 overflow-hidden rounded-xl border bg-card p-4 text-card-foreground shadow-xs transition-shadow duration-300 hover:shadow-lg',
    spanClasses[span],
    rowClasses[rows],
    className,
  )
  if (href) {
    return (
      <a
        href={href}
        data-slot="bento-card"
        className={cn(classes, 'outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50')}
      >
        {body}
      </a>
    )
  }
  return (
    <div data-slot="bento-card" className={classes} {...props}>
      {body}
    </div>
  )
}

export { BentoCard, BentoGrid }
