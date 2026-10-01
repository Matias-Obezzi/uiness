'use client'

import { ChevronDownIcon } from 'lucide-react'
import { Accordion as AccordionPrimitive } from 'radix-ui'
import * as React from 'react'
import { useUntilFound } from '@/hooks/use-until-found'
import { cn } from '@/lib/utils'

interface AccordionContextValue {
  value: string[]
  disabled?: boolean
  open: (item: string) => void
}

interface AccordionItemContextValue {
  open: boolean
  disabled?: boolean
  triggerId: string
  contentId: string
  /** Opens this item through the accordion's value. */
  openItem: () => void
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null)
const AccordionItemContext = React.createContext<AccordionItemContextValue | null>(null)

function useAccordionItem(component: string) {
  const context = React.useContext(AccordionItemContext)
  if (!context) throw new Error(`${component} must be used within <AccordionItem>`)
  return context
}

type AccordionProps = React.ComponentProps<typeof AccordionPrimitive.Root>
type AccordionSingleProps = Extract<AccordionProps, { type: 'single' }>
type AccordionMultipleProps = Extract<AccordionProps, { type: 'multiple' }>

/**
 * Radix handles the keyboard, the ARIA and the `collapsible` rule, but it drops the content
 * of closed items. The content here is ours and stays in the page, so the value lives here
 * too and Radix follows it: that way a match from find in page opens an item the same way a
 * click does, `onValueChange` included.
 */
function Accordion(props: AccordionProps) {
  return props.type === 'multiple' ? (
    <AccordionMultiple {...props} />
  ) : (
    <AccordionSingle {...props} />
  )
}

function AccordionSingle({
  value: valueProp,
  defaultValue = '',
  onValueChange,
  disabled,
  ...props
}: AccordionSingleProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue)
  const value = valueProp ?? uncontrolled

  const setValue = React.useCallback(
    (next: string) => {
      if (valueProp === undefined) setUncontrolled(next)
      if (next !== value) onValueChange?.(next)
    },
    [valueProp, value, onValueChange],
  )

  const context = React.useMemo(
    () => ({ value: value ? [value] : [], disabled, open: setValue }),
    [value, disabled, setValue],
  )

  return (
    <AccordionContext.Provider value={context}>
      <AccordionPrimitive.Root
        data-slot="accordion"
        disabled={disabled}
        {...props}
        value={value}
        onValueChange={setValue}
      />
    </AccordionContext.Provider>
  )
}

function AccordionMultiple({
  value: valueProp,
  defaultValue = [],
  onValueChange,
  disabled,
  ...props
}: AccordionMultipleProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue)
  const value = valueProp ?? uncontrolled

  const setValue = React.useCallback(
    (next: string[]) => {
      if (valueProp === undefined) setUncontrolled(next)
      onValueChange?.(next)
    },
    [valueProp, onValueChange],
  )

  const context = React.useMemo(
    () => ({
      value,
      disabled,
      open: (item: string) => {
        if (!value.includes(item)) setValue([...value, item])
      },
    }),
    [value, disabled, setValue],
  )

  return (
    <AccordionContext.Provider value={context}>
      <AccordionPrimitive.Root
        data-slot="accordion"
        disabled={disabled}
        {...props}
        value={value}
        onValueChange={setValue}
      />
    </AccordionContext.Provider>
  )
}

function AccordionItem({
  className,
  value,
  disabled,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  const accordion = React.useContext(AccordionContext)
  if (!accordion) throw new Error('AccordionItem must be used within <Accordion>')
  const triggerId = React.useId()
  const contentId = React.useId()

  const open = accordion.value.includes(value)
  const itemDisabled = accordion.disabled || disabled
  const openAccordionItem = accordion.open
  const item = React.useMemo(
    () => ({
      open,
      disabled: itemDisabled,
      triggerId,
      contentId,
      openItem: () => openAccordionItem(value),
    }),
    [open, itemDisabled, triggerId, contentId, openAccordionItem, value],
  )

  return (
    <AccordionItemContext.Provider value={item}>
      <AccordionPrimitive.Item
        data-slot="accordion-item"
        value={value}
        disabled={disabled}
        className={cn('border-b last:border-b-0', className)}
        {...props}
      />
    </AccordionItemContext.Provider>
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  const { triggerId, contentId } = useAccordionItem('AccordionTrigger')
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        // Our ids, so the content (which Radix does not render) can point back at the trigger.
        id={triggerId}
        aria-controls={contentId}
        className={cn(
          'flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left font-medium text-sm outline-none transition-all hover:underline focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180',
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon className="pointer-events-none size-4 shrink-0 translate-y-0.5 text-muted-foreground transition-transform duration-(--duration-normal,200ms) ease-(--easing-standard,cubic-bezier(0.2,0,0,1))" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

/**
 * Closed content stays in the page with `hidden="until-found"`: search engines read it and the
 * browser's find in page opens the item on a match. Content of disabled items is plainly
 * hidden instead.
 */
function AccordionContent({ className, children, ref, ...props }: React.ComponentProps<'div'>) {
  const { open, disabled, triggerId, contentId, openItem } = useAccordionItem('AccordionContent')
  const panelRef = useUntilFound(open, disabled ? undefined : openItem, ref)

  return (
    // biome-ignore lint/a11y/useSemanticElements: a div like the Radix content it replaces, so refs and styles written for that carry over
    <div
      data-slot="accordion-content"
      data-state={open ? 'open' : 'closed'}
      data-disabled={disabled ? '' : undefined}
      role="region"
      id={contentId}
      aria-labelledby={triggerId}
      hidden={!open}
      // Same height animation as the collapsible: one grid row going from 0fr to 1fr, with
      // the hiding properties as discrete transitions so the content shows while it closes.
      className="grid text-sm transition-[grid-template-rows,content-visibility,display] transition-discrete duration-(--duration-normal,200ms) ease-(--easing-standard,cubic-bezier(0.2,0,0,1)) data-[state=closed]:grid-rows-[0fr] data-[state=open]:grid-rows-[1fr] motion-reduce:transition-none"
      {...props}
      ref={panelRef}
    >
      <div className="min-h-0 overflow-hidden">
        <div className={cn('pt-0 pb-4', className)}>{children}</div>
      </div>
    </div>
  )
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger }
