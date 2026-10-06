import { cva, type VariantProps } from 'class-variance-authority'
import { CircleAlertIcon, CircleCheckIcon, InfoIcon, TriangleAlertIcon } from 'lucide-react'
import type * as React from 'react'
import { cn } from '@/lib/utils'

// The text is always foreground: amber, sky or red text on a pale tint of itself falls under the
// 4.5:1 that small text needs. The variant shows in the icon, the border and the tint.
const alertVariants = cva(
  'relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-lg border px-4 py-3 text-sm has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>svg]:gap-x-3 [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current has-[>svg:not([data-slot=alert-icon])]:*:data-[slot=alert-icon]:hidden',
  {
    variants: {
      variant: {
        default: 'bg-card text-card-foreground',
        info: 'border-sky-500/30 bg-sky-500/10 text-foreground [&>svg]:text-sky-700 dark:[&>svg]:text-sky-400',
        success:
          'border-emerald-500/30 bg-emerald-500/10 text-foreground [&>svg]:text-emerald-700 dark:[&>svg]:text-emerald-400',
        warning:
          'border-amber-500/30 bg-amber-500/10 text-foreground [&>svg]:text-amber-700 dark:[&>svg]:text-amber-400',
        destructive:
          'border-destructive/30 bg-destructive/10 text-foreground [&>svg]:text-destructive',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

/** Only what needs attention now interrupts a screen reader; the rest waits its turn. */
const variantRoles = {
  default: 'status',
  info: 'status',
  success: 'status',
  warning: 'alert',
  destructive: 'alert',
} as const

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
  /**
   * `alert` for `warning` and `destructive`, which interrupt a screen reader; `status` for the
   * rest, read when it is free. Pass another role to change it, `none` for no live region.
   */
  role?: React.AriaRole
}

function Alert({ className, variant, icon, children, ...props }: AlertProps) {
  const Auto = variantIcons[variant ?? 'default']
  const role = 'role' in props ? props.role : variantRoles[variant ?? 'default']
  return (
    <div
      data-slot="alert"
      data-variant={variant ?? 'default'}
      className={cn(alertVariants({ variant }), className)}
      {...props}
      role={role}
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
