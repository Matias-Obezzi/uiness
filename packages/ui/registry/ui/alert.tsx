import { cva, type VariantProps } from 'class-variance-authority'
import { CircleAlertIcon, CircleCheckIcon, InfoIcon, TriangleAlertIcon } from 'lucide-react'
import type * as React from 'react'
import { cn } from '@/lib/utils'

const alertVariants = cva(
  'relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-lg border px-4 py-3 text-sm has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>svg]:gap-x-3 [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current has-[>svg:not([data-slot=alert-icon])]:*:data-[slot=alert-icon]:hidden',
  {
    variants: {
      variant: {
        default: 'bg-card text-card-foreground',
        info: 'border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-200',
        success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200',
        warning: 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200',
        destructive:
          'border-destructive/30 bg-destructive/10 text-destructive *:data-[slot=alert-description]:text-destructive/90',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

const variantIcons = {
  default: null,
  info: InfoIcon,
  success: CircleCheckIcon,
  warning: TriangleAlertIcon,
  destructive: CircleAlertIcon,
}

export interface AlertProps
  extends React.ComponentProps<'div'>,
    VariantProps<typeof alertVariants> {
  /**
   * Icon in the first column. Left out, each variant shows its own (none for `default`);
   * `null` shows none; anything else replaces it. An `<svg>` passed as a direct child also
   * replaces the automatic one, so alerts written with the icon inside keep a single icon.
   */
  icon?: React.ReactNode
}

function Alert({ className, variant, icon, children, ...props }: AlertProps) {
  const Auto = variantIcons[variant ?? 'default']
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {icon === undefined ? Auto && <Auto data-slot="alert-icon" /> : icon}
      {children}
    </div>
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-title"
      className={cn('col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight', className)}
      {...props}
    />
  )
}

function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        'col-start-2 grid justify-items-start gap-1 text-sm opacity-90 [&_p]:leading-relaxed',
        className,
      )}
      {...props}
    />
  )
}

export { Alert, AlertDescription, AlertTitle, alertVariants }
