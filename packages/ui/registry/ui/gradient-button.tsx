import { cva, type VariantProps } from 'class-variance-authority'
import type * as React from 'react'
import { cn } from '@/lib/utils'

const gradientButtonVariants = cva(
  [
    'relative isolate inline-flex h-10 shrink-0 overflow-hidden whitespace-nowrap rounded-xl p-px font-semibold text-sm text-white outline-none',
    // A gradient border: the outer gradient shows through the 1px left around the fill.
    'bg-linear-to-b shadow-[0_1px_2px_rgb(0_0_0/0.2),0_6px_16px_-6px_var(--gb-glow)]',
    'transition-[transform,box-shadow,filter] duration-(--duration-fast,150ms) hover:brightness-110 active:scale-[0.97] active:shadow-[0_1px_1px_rgb(0_0_0/0.2)] motion-reduce:transition-none motion-reduce:active:scale-100',
    'focus-visible:ring-[3px] focus-visible:ring-(--gb-glow) disabled:pointer-events-none disabled:opacity-50 pointer-coarse:h-11',
    '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        emerald:
          'from-emerald-300 to-emerald-800 [--gb-from:var(--color-emerald-500)] [--gb-glow:rgb(16_185_129/0.55)] [--gb-to:var(--color-emerald-700)]',
        purple:
          'from-violet-300 to-violet-900 [--gb-from:var(--color-violet-500)] [--gb-glow:rgb(139_92_246/0.55)] [--gb-to:var(--color-violet-700)]',
        orange:
          'from-amber-200 to-orange-800 [--gb-from:var(--color-orange-500)] [--gb-glow:rgb(249_115_22/0.55)] [--gb-to:var(--color-orange-700)]',
      },
    },
    defaultVariants: { variant: 'purple' },
  },
)

export interface GradientButtonProps
  extends React.ComponentProps<'button'>,
    VariantProps<typeof gradientButtonVariants> {}

/**
 * A layered gradient button: a gradient border, a fill that runs from light to deep, a soft
 * glow inside along the top, a coloured shadow under it, and a press that sinks it. Emerald,
 * purple or orange; an icon sits beside the text.
 */
function GradientButton({ variant, className, children, ...props }: GradientButtonProps) {
  return (
    <button
      type="button"
      data-slot="gradient-button"
      className={cn(gradientButtonVariants({ variant }), className)}
      {...props}
    >
      <span className="flex h-full w-full items-center justify-center gap-2 rounded-[calc(0.75rem-1px)] bg-linear-to-b from-(--gb-from) to-(--gb-to) px-5 shadow-[inset_0_1px_0_rgb(255_255_255/0.35),inset_0_10px_16px_-10px_rgb(255_255_255/0.55)] [text-shadow:0_1px_1px_rgb(0_0_0/0.25)]">
        {children}
      </span>
    </button>
  )
}

export { GradientButton, gradientButtonVariants }
