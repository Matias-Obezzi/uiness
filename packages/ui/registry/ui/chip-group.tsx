'use client'

import { CheckIcon } from 'lucide-react'
import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui'
import * as React from 'react'
import { cn } from '@/lib/utils'

type ChipSize = 'sm' | 'default'

const ChipGroupContext = React.createContext<{ size: ChipSize }>({ size: 'default' })

interface ChipGroupBaseProps
  extends Omit<React.ComponentProps<'div'>, 'defaultValue' | 'dir' | 'onChange'> {
  /** Chip height and text size. */
  size?: ChipSize
  /** Turn every chip off. */
  disabled?: boolean
  /** Arrow keys wrap from the last chip to the first. Default true. */
  loop?: boolean
  /** Which arrow keys move between chips. Both pairs work when unset. */
  orientation?: 'horizontal' | 'vertical'
  /** Renders a hidden input per picked chip, for native form posts. */
  name?: string
}

export interface ChipGroupSingleProps extends ChipGroupBaseProps {
  /** One chip at a time, like a radio group that can also be cleared. */
  type: 'single'
  value?: string
  defaultValue?: string
  /** Called with the picked chip, or "" when it was turned off. */
  onValueChange?: (value: string) => void
}

export interface ChipGroupMultipleProps extends ChipGroupBaseProps {
  /** Any number of chips at a time. */
  type: 'multiple'
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
}

export type ChipGroupProps = ChipGroupSingleProps | ChipGroupMultipleProps

/**
 * Filter chips. Picking one fills it and slides a check in; arrow keys move between them and
 * Space or Enter toggles. `type="single"` keeps one at a time.
 */
function ChipGroup(props: ChipGroupProps) {
  const {
    type,
    value: valueProp,
    defaultValue,
    onValueChange,
    size = 'default',
    name,
    className,
    children,
    ...rest
  } = props
  const [uncontrolled, setUncontrolled] = React.useState<string | string[]>(
    defaultValue ?? (type === 'multiple' ? [] : ''),
  )
  const value = valueProp ?? uncontrolled
  const picked = Array.isArray(value) ? value : value ? [value] : []

  const handleChange = (next: string | string[]) => {
    if (valueProp === undefined) setUncontrolled(next)
    ;(onValueChange as ((v: string | string[]) => void) | undefined)?.(next)
  }

  const context = React.useMemo(() => ({ size }), [size])

  const root = {
    'data-slot': 'chip-group',
    'data-size': size,
    // A row of filters is a group of pressed buttons, not a toolbar of commands.
    ...(type === 'multiple' ? { role: 'group' } : {}),
    className: cn('flex flex-wrap items-center gap-2', className),
    ...rest,
  }

  return (
    <ChipGroupContext.Provider value={context}>
      {type === 'multiple' ? (
        <ToggleGroupPrimitive.Root
          type="multiple"
          value={picked}
          onValueChange={handleChange}
          {...root}
        >
          {children}
        </ToggleGroupPrimitive.Root>
      ) : (
        <ToggleGroupPrimitive.Root
          type="single"
          value={picked[0] ?? ''}
          onValueChange={handleChange}
          {...root}
        >
          {children}
        </ToggleGroupPrimitive.Root>
      )}
      {name && picked.map((v) => <input key={v} type="hidden" name={name} value={v} />)}
    </ChipGroupContext.Provider>
  )
}

export interface ChipGroupItemProps extends React.ComponentProps<typeof ToggleGroupPrimitive.Item> {
  /** Shown before the label. The check slides in beside it when picked. */
  icon?: React.ReactNode
}

const ease = 'ease-(--easing-emphasized,cubic-bezier(0.16,1,0.3,1))'

function ChipGroupItem({ className, icon, children, ...props }: ChipGroupItemProps) {
  const { size } = React.useContext(ChipGroupContext)
  return (
    <ToggleGroupPrimitive.Item
      data-slot="chip-group-item"
      data-size={size}
      className={cn(
        'group/chip relative isolate inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-input bg-transparent font-medium text-foreground shadow-xs outline-none',
        'transition-[color,border-color,box-shadow] duration-(--duration-normal,200ms) motion-reduce:transition-none',
        'hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50',
        'data-[state=on]:border-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-transparent',
        'h-8 px-3 text-sm data-[size=sm]:h-7 data-[size=sm]:px-2.5 data-[size=sm]:text-xs',
        '[&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0',
        className,
      )}
      {...props}
    >
      {/* The fill grows out from the middle, behind the label. */}
      <span
        aria-hidden
        className={cn(
          '-z-10 absolute inset-0 scale-75 rounded-[inherit] bg-primary opacity-0 transition-[scale,opacity] duration-(--duration-normal,200ms) motion-reduce:transition-none',
          'group-data-[state=on]/chip:scale-100 group-data-[state=on]/chip:opacity-100',
          ease,
        )}
      />
      {/* A grid column that opens from 0 to the icon's width, so the label slides over. */}
      <span
        aria-hidden
        className={cn(
          'grid grid-cols-[0fr] transition-[grid-template-columns] duration-(--duration-normal,200ms) motion-reduce:transition-none',
          'group-data-[state=on]/chip:grid-cols-[1fr]',
          ease,
        )}
      >
        <span className="overflow-hidden">
          <CheckIcon
            strokeWidth={3}
            className={cn(
              'mr-1.5 -translate-x-1.5 opacity-0 transition-[translate,opacity] duration-(--duration-normal,200ms) motion-reduce:transition-none',
              'group-data-[state=on]/chip:translate-x-0 group-data-[state=on]/chip:opacity-100',
              ease,
            )}
          />
        </span>
      </span>
      {icon && (
        <span aria-hidden className="mr-1.5 flex">
          {icon}
        </span>
      )}
      {children}
    </ToggleGroupPrimitive.Item>
  )
}

export { ChipGroup, ChipGroupItem }
