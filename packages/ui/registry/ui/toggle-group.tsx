'use client'

import type { VariantProps } from 'class-variance-authority'
import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui'
import * as React from 'react'
import { cn } from '@/lib/utils'
import { toggleVariants } from '@/ui/toggle'

const ToggleGroupContext = React.createContext<VariantProps<typeof toggleVariants>>({})

/**
 * A row of toggles that share a look. `type="single"` behaves like a segmented control,
 * `type="multiple"` lets several be pressed at once.
 */
function ToggleGroup({
  className,
  variant,
  size,
  children,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> & VariantProps<typeof toggleVariants>) {
  const value = React.useMemo(() => ({ variant, size }), [variant, size])
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      className={cn(
        'group/toggle-group flex w-fit items-center rounded-lg data-[variant=outline]:shadow-xs',
        className,
      )}
      {...props}
    >
      <ToggleGroupContext.Provider value={value}>{children}</ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  )
}

function ToggleGroupItem({
  className,
  children,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> & VariantProps<typeof toggleVariants>) {
  const context = React.useContext(ToggleGroupContext)
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      data-variant={context.variant ?? variant}
      data-size={context.size ?? size}
      className={cn(
        toggleVariants({ variant: context.variant ?? variant, size: context.size ?? size }),
        // Items join into one control: square inner corners, one shared border.
        'min-w-0 flex-1 shrink-0 rounded-none shadow-none first:rounded-l-lg last:rounded-r-lg focus:z-10 focus-visible:z-10 data-[variant=outline]:border-l-0 data-[variant=outline]:first:border-l',
        className,
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
}

export { ToggleGroup, ToggleGroupItem }
