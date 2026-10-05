import { cva, type VariantProps } from 'class-variance-authority'
import type * as React from 'react'
import { cn } from '@/lib/utils'

export type EmptyStateIllustrationName = 'no-results' | 'no-files' | 'inbox-zero' | 'error'

/*
 * The drawings use the theme: `fill-muted` and `stroke-border` for the shapes, the foreground
 * for details and a single accent, so they follow light, dark and any custom palette.
 */
const shape = 'fill-muted stroke-border'
const detail = 'stroke-muted-foreground/60'

const drawings: Record<EmptyStateIllustrationName, React.ReactNode> = {
  'no-results': (
    <>
      <rect x="18" y="20" width="62" height="64" rx="8" className={shape} strokeWidth="2" />
      <path
        d="M30 36h38M30 47h30M30 58h20"
        className={detail}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle
        cx="82"
        cy="62"
        r="17"
        className="fill-background stroke-foreground/70"
        strokeWidth="4"
      />
      <path
        d="M94 74l12 12"
        className="stroke-foreground/70"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M76.5 56.5l11 11M87.5 56.5l-11 11"
        className="stroke-muted-foreground"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </>
  ),
  'no-files': (
    <>
      <path
        d="M14 34a6 6 0 0 1 6-6h22l8 8h50a6 6 0 0 1 6 6v40a6 6 0 0 1-6 6H20a6 6 0 0 1-6-6V34Z"
        className={shape}
        strokeWidth="2"
      />
      <rect
        x="34"
        y="14"
        width="40"
        height="48"
        rx="5"
        className="fill-background stroke-border"
        strokeWidth="2"
        transform="rotate(-8 54 38)"
      />
      <path
        d="M42 28h20M42 37h16"
        className={detail}
        strokeWidth="3"
        strokeLinecap="round"
        transform="rotate(-8 54 38)"
      />
      <path
        d="M14 48a6 6 0 0 1 6-6h80a6 6 0 0 1 6 6v34a6 6 0 0 1-6 6H20a6 6 0 0 1-6-6V48Z"
        className="fill-card stroke-border"
        strokeWidth="2"
      />
      <path
        d="M50 64h20"
        className="stroke-muted-foreground"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </>
  ),
  'inbox-zero': (
    <>
      <path
        d="M20 54l12-28a6 6 0 0 1 5.5-4h45a6 6 0 0 1 5.5 4l12 28v26a6 6 0 0 1-6 6H26a6 6 0 0 1-6-6V54Z"
        className={shape}
        strokeWidth="2"
      />
      <path
        d="M20 54h24l4 9h24l4-9h24"
        className="fill-none stroke-border"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle
        cx="60"
        cy="38"
        r="13"
        className="fill-background stroke-foreground/70"
        strokeWidth="3"
      />
      <path
        d="M54 38.5l4.5 4.5 8-9"
        className="fill-none stroke-foreground/70"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M30 14l2 5M90 14l-2 5M60 6v6"
        className={detail}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </>
  ),
  error: (
    <>
      <path
        d="M33 76a17 17 0 0 1-2-34 22 22 0 0 1 42-6 16 16 0 0 1 16 4 18 18 0 0 1 4 36H33Z"
        className={shape}
        strokeWidth="2"
      />
      <path d="M60 46v14" className="stroke-destructive" strokeWidth="5" strokeLinecap="round" />
      <circle cx="60" cy="68" r="3" className="fill-destructive" />
      <path
        d="M44 86l-4 8M60 86v8M76 86l4 8"
        className={detail}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </>
  ),
}

export interface EmptyStateIllustrationProps extends React.ComponentProps<'svg'> {
  /** Which drawing. */
  name: EmptyStateIllustrationName
}

/** A small drawing in the theme's colors, decorative. */
function EmptyStateIllustration({ name, className, ...props }: EmptyStateIllustrationProps) {
  return (
    <svg
      viewBox="0 0 120 100"
      fill="none"
      aria-hidden="true"
      data-slot="empty-state-illustration"
      data-name={name}
      className={cn('h-auto w-32', className)}
      {...props}
    >
      {drawings[name]}
    </svg>
  )
}

const emptyStateVariants = cva(
  'flex w-full flex-col items-center justify-center text-balance text-center',
  {
    variants: {
      size: {
        sm: 'gap-2 px-4 py-6 [&_[data-slot=empty-state-illustration]]:w-20',
        md: 'gap-3 px-6 py-10',
        lg: 'gap-4 px-8 py-16 [&_[data-slot=empty-state-illustration]]:w-44',
      },
      variant: {
        plain: '',
        dashed: 'rounded-xl border border-dashed',
        card: 'rounded-xl border bg-card text-card-foreground shadow-sm',
      },
    },
    defaultVariants: { size: 'md', variant: 'plain' },
  },
)

export interface EmptyStateProps
  extends Omit<React.ComponentProps<'div'>, 'title'>,
    VariantProps<typeof emptyStateVariants> {
  /** A built-in drawing by name, or your own illustration. */
  illustration?: EmptyStateIllustrationName | React.ReactNode
  /** A small icon in a tinted circle, used when there is no `illustration`. */
  icon?: React.ReactNode
  /** What is empty, in a few words. */
  title?: React.ReactNode
  /** Why it is empty, or what to do next. */
  description?: React.ReactNode
  /** Buttons or links for the next step. */
  actions?: React.ReactNode
  /** The element for the title, to fit the page's outline. Default `h3`. */
  titleAs?: 'h2' | 'h3' | 'h4' | 'p'
}

const builtIn = (value: unknown): value is EmptyStateIllustrationName =>
  typeof value === 'string' && value in drawings

/**
 * What to show when there is nothing to show: a drawing or an icon, a title, a line of
 * explanation and the next step. Extra children go under the actions.
 */
function EmptyState({
  illustration,
  icon,
  title,
  description,
  actions,
  titleAs: Title = 'h3',
  size,
  variant,
  className,
  children,
  ...props
}: EmptyStateProps) {
  const iconSize =
    size === 'sm'
      ? 'size-10 [&_svg]:size-5'
      : size === 'lg'
        ? 'size-14 [&_svg]:size-7'
        : 'size-12 [&_svg]:size-6'
  return (
    <div
      data-slot="empty-state"
      className={cn(emptyStateVariants({ size, variant }), className)}
      {...props}
    >
      {illustration ? (
        builtIn(illustration) ? (
          <EmptyStateIllustration name={illustration} />
        ) : (
          <div data-slot="empty-state-media" aria-hidden="true">
            {illustration}
          </div>
        )
      ) : icon ? (
        <div
          data-slot="empty-state-icon"
          aria-hidden="true"
          className={cn(
            'mb-1 flex items-center justify-center rounded-full bg-muted text-muted-foreground',
            iconSize,
          )}
        >
          {icon}
        </div>
      ) : null}
      {(title || description) && (
        <div className="flex max-w-sm flex-col gap-1.5">
          {title && (
            <Title
              data-slot="empty-state-title"
              className={cn('font-semibold', size === 'lg' ? 'text-lg' : 'text-base')}
            >
              {title}
            </Title>
          )}
          {description && (
            <p data-slot="empty-state-description" className="text-muted-foreground text-sm">
              {description}
            </p>
          )}
        </div>
      )}
      {actions && (
        <div
          data-slot="empty-state-actions"
          className="mt-2 flex flex-wrap items-center justify-center gap-2"
        >
          {actions}
        </div>
      )}
      {children}
    </div>
  )
}

export { EmptyState, EmptyStateIllustration, emptyStateVariants }
