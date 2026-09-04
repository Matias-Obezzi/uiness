'use client'

import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover'

export interface ComboboxOption {
  value: string
  label: string
  /** Extra words the option is matched by. */
  keywords?: string[]
  disabled?: boolean
  /** Options with the same group render under a heading. */
  group?: string
  /** Shown before the label, an icon or an avatar. */
  icon?: React.ReactNode
}

interface ComboboxBaseProps {
  options: ComboboxOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  /** Classes for the trigger button. */
  className?: string
  /** Classes for the popover panel. */
  contentClassName?: string
  align?: 'start' | 'center' | 'end'
  /** Clicking the selected option again clears it. Default true for single selection. */
  deselectable?: boolean
  /** Custom option rendering. */
  renderOption?: (option: ComboboxOption, selected: boolean) => React.ReactNode
  /** Custom trigger label. */
  renderValue?: (selected: ComboboxOption[]) => React.ReactNode
  id?: string
  name?: string
  'aria-label'?: string
  'aria-labelledby'?: string
}

export interface ComboboxSingleProps extends ComboboxBaseProps {
  multiple?: false
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (value: string | null) => void
}

export interface ComboboxMultipleProps extends ComboboxBaseProps {
  multiple: true
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
}

export type ComboboxProps = ComboboxSingleProps | ComboboxMultipleProps

function toArray(value: string | string[] | null | undefined): string[] {
  if (value === null || value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

function Combobox(props: ComboboxProps) {
  const {
    options,
    placeholder = 'Select…',
    searchPlaceholder = 'Search…',
    emptyText = 'No results.',
    disabled,
    className,
    contentClassName,
    align = 'start',
    deselectable = true,
    renderOption,
    renderValue,
    id,
    name,
    multiple,
  } = props
  const [open, setOpen] = React.useState(false)
  const [uncontrolled, setUncontrolled] = React.useState<string[]>(() =>
    toArray(props.defaultValue),
  )
  const controlled = props.value !== undefined
  const selected = controlled ? toArray(props.value) : uncontrolled

  const commit = (next: string[]) => {
    if (!controlled) setUncontrolled(next)
    if (props.multiple) props.onValueChange?.(next)
    else props.onValueChange?.(next[0] ?? null)
  }

  const pick = (value: string) => {
    if (multiple) {
      commit(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value])
      return
    }
    commit(selected[0] === value && deselectable ? [] : [value])
    setOpen(false)
  }

  const selectedOptions = selected
    .map((v) => options.find((o) => o.value === v))
    .filter((o): o is ComboboxOption => !!o)

  // A combobox does not take its name from its content, so fall back to the placeholder.
  const ariaLabel = props['aria-label'] ?? (props['aria-labelledby'] ? undefined : placeholder)

  const groups = React.useMemo(() => {
    const map = new Map<string | undefined, ComboboxOption[]>()
    for (const option of options) {
      const list = map.get(option.group) ?? []
      list.push(option)
      map.set(option.group, list)
    }
    return Array.from(map.entries())
  }, [options])

  const label = renderValue
    ? renderValue(selectedOptions)
    : selectedOptions.length === 0
      ? placeholder
      : selectedOptions.length <= 2
        ? selectedOptions.map((o) => o.label).join(', ')
        : `${selectedOptions[0]?.label}, ${selectedOptions[1]?.label} +${selectedOptions.length - 2}`

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {name &&
        (multiple ? (
          selected.map((v) => <input key={v} type="hidden" name={name} value={v} />)
        ) : (
          <input type="hidden" name={name} value={selected[0] ?? ''} />
        ))}
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          aria-labelledby={props['aria-labelledby']}
          disabled={disabled}
          data-slot="combobox-trigger"
          data-placeholder={selectedOptions.length === 0 ? '' : undefined}
          className={cn(
            'w-64 justify-between font-normal data-[placeholder]:text-muted-foreground',
            className,
          )}
        >
          <span className="flex min-w-0 items-center gap-2 truncate">
            {selectedOptions.length === 1 && selectedOptions[0]?.icon}
            <span className="truncate">{label}</span>
          </span>
          <ChevronsUpDownIcon className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        data-slot="combobox-content"
        className={cn('w-(--radix-popover-trigger-width) min-w-48 p-0', contentClassName)}
      >
        <Command label={placeholder}>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            {groups.map(([group, items]) => (
              <CommandGroup key={group ?? ''} heading={group}>
                {items.map((option) => {
                  const isSelected = selected.includes(option.value)
                  return (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      keywords={[option.value, ...(option.keywords ?? [])]}
                      disabled={option.disabled}
                      onSelect={() => pick(option.value)}
                      data-checked={isSelected ? '' : undefined}
                    >
                      {renderOption ? (
                        renderOption(option, isSelected)
                      ) : (
                        <>
                          {option.icon}
                          <span className="truncate">{option.label}</span>
                        </>
                      )}
                      <CheckIcon
                        className={cn('ml-auto text-foreground', !isSelected && 'opacity-0')}
                      />
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export { Combobox }
