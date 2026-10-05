'use client'

import { RadioGroup as RadioGroupPrimitive } from 'radix-ui'
import * as React from 'react'
import { cn } from '@/lib/utils'

interface ItemContextValue {
  titleId: string
  descriptionId: string
  priceId: string
  setHasTitle: (has: boolean) => void
  setHasDescription: (has: boolean) => void
  setHasPrice: (has: boolean) => void
}

const ItemContext = React.createContext<ItemContextValue | null>(null)

/**
 * Option cards that behave as one radio group: a single tab stop, arrow keys move and select,
 * and `name` posts the value with a form. One selection ring slides from card to card.
 */
function RadioCards({
  className,
  children,
  onValueChange,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const ringRef = React.useRef<HTMLSpanElement>(null)
  const placed = React.useRef(false)
  // Radix holds the value; this only re-renders the root so the ring can follow it.
  const [, bump] = React.useReducer((n: number) => n + 1, 0)

  const place = React.useCallback(() => {
    const root = rootRef.current
    const ring = ringRef.current
    if (!root || !ring) return
    const card = root.querySelector<HTMLElement>(
      ':scope > [data-slot=radio-cards-item][data-state=checked]',
    )
    if (!card) {
      ring.style.opacity = '0'
      placed.current = false
      return
    }
    // Jump into place the first time, slide after that.
    ring.style.transitionDuration = placed.current ? '' : '0ms'
    ring.style.transform = `translate(${card.offsetLeft}px, ${card.offsetTop}px)`
    ring.style.width = `${card.offsetWidth}px`
    ring.style.height = `${card.offsetHeight}px`
    ring.style.opacity = '1'
    placed.current = true
  }, [])

  React.useLayoutEffect(() => {
    place()
  })

  // Cards change size with the viewport and their content; the ring has to keep up.
  React.useEffect(() => {
    const root = rootRef.current
    if (!root || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => {
      const ring = ringRef.current
      if (ring) ring.style.transitionDuration = '0ms'
      place()
    })
    observer.observe(root)
    for (const card of root.querySelectorAll('[data-slot=radio-cards-item]')) observer.observe(card)
    return () => observer.disconnect()
  }, [place])

  return (
    <RadioGroupPrimitive.Root
      ref={rootRef}
      data-slot="radio-cards"
      onValueChange={(value) => {
        onValueChange?.(value)
        bump()
      }}
      className={cn(
        'relative grid grid-cols-[repeat(auto-fit,minmax(min(100%,11rem),1fr))] gap-3',
        className,
      )}
      {...props}
    >
      <span
        ref={ringRef}
        aria-hidden
        data-slot="radio-cards-ring"
        className="pointer-events-none absolute top-0 left-0 z-(--z-raised,10) rounded-xl border-2 border-primary opacity-0 transition-[transform,width,height,opacity] duration-(--duration-slow,300ms) ease-(--easing-emphasized,cubic-bezier(0.16,1,0.3,1)) motion-reduce:transition-none"
      />
      {children}
    </RadioGroupPrimitive.Root>
  )
}

export interface RadioCardsItemProps extends React.ComponentProps<typeof RadioGroupPrimitive.Item> {
  /** Show the round radio mark in the corner. Default true. */
  indicator?: boolean
}

/** One card. Put a `RadioCardsTitle` in it, and any of the other slots. */
function RadioCardsItem({ className, children, indicator = true, ...props }: RadioCardsItemProps) {
  const titleId = React.useId()
  const descriptionId = React.useId()
  const [hasTitle, setHasTitle] = React.useState(false)
  const priceId = React.useId()
  const [hasDescription, setHasDescription] = React.useState(false)
  const [hasPrice, setHasPrice] = React.useState(false)
  const context = React.useMemo(
    () => ({ titleId, descriptionId, priceId, setHasTitle, setHasDescription, setHasPrice }),
    [titleId, descriptionId, priceId],
  )
  const describedBy = [hasDescription && descriptionId, hasPrice && priceId].filter(Boolean)
  return (
    <ItemContext.Provider value={context}>
      <RadioGroupPrimitive.Item
        data-slot="radio-cards-item"
        // Named by its title and described by the rest, so the name stays short.
        aria-labelledby={hasTitle ? titleId : undefined}
        aria-describedby={describedBy.length ? describedBy.join(' ') : undefined}
        className={cn(
          'group/card relative flex min-w-0 flex-col items-start gap-1 rounded-xl border bg-card p-4 text-left text-card-foreground shadow-xs outline-none',
          'transition-[background-color,border-color,box-shadow] duration-(--duration-fast,150ms) motion-reduce:transition-none',
          'hover:bg-accent/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=checked]:border-transparent',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-card',
          'aria-invalid:border-destructive',
          indicator && 'pr-10',
          className,
        )}
        {...props}
      >
        {children}
        {indicator && (
          <span
            aria-hidden
            data-slot="radio-cards-indicator"
            className="absolute top-4 right-4 flex size-4 items-center justify-center rounded-full border border-input transition-colors duration-(--duration-fast,150ms) group-data-[state=checked]/card:border-primary group-data-[state=checked]/card:bg-primary motion-reduce:transition-none"
          >
            <span className="size-1.5 scale-0 rounded-full bg-primary-foreground transition-[scale] duration-(--duration-normal,200ms) ease-(--easing-emphasized,cubic-bezier(0.16,1,0.3,1)) group-data-[state=checked]/card:scale-100 motion-reduce:transition-none" />
          </span>
        )}
      </RadioGroupPrimitive.Item>
    </ItemContext.Provider>
  )
}

function useItem(part: string) {
  const ctx = React.useContext(ItemContext)
  if (!ctx) throw new Error(`${part} must be rendered inside <RadioCardsItem>`)
  return ctx
}

/** An icon above the title. */
function RadioCardsIcon({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      aria-hidden
      data-slot="radio-cards-icon"
      className={cn(
        'mb-2 flex size-9 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors group-data-[state=checked]/card:text-foreground [&_svg]:size-4',
        className,
      )}
      {...props}
    />
  )
}

/** The card's name. */
function RadioCardsTitle({ className, ...props }: React.ComponentProps<'span'>) {
  const { titleId, setHasTitle } = useItem('RadioCardsTitle')
  React.useLayoutEffect(() => {
    setHasTitle(true)
    return () => setHasTitle(false)
  }, [setHasTitle])
  return (
    <span
      id={titleId}
      data-slot="radio-cards-title"
      className={cn('font-medium text-sm leading-tight', className)}
      {...props}
    />
  )
}

/** A line or two under the title. */
function RadioCardsDescription({ className, ...props }: React.ComponentProps<'span'>) {
  const { descriptionId, setHasDescription } = useItem('RadioCardsDescription')
  React.useLayoutEffect(() => {
    setHasDescription(true)
    return () => setHasDescription(false)
  }, [setHasDescription])
  return (
    <span
      id={descriptionId}
      data-slot="radio-cards-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

/** A price or other figure, pushed to the bottom of the card. */
function RadioCardsPrice({ className, ...props }: React.ComponentProps<'span'>) {
  const { priceId, setHasPrice } = useItem('RadioCardsPrice')
  React.useLayoutEffect(() => {
    setHasPrice(true)
    return () => setHasPrice(false)
  }, [setHasPrice])
  return (
    <span
      id={priceId}
      data-slot="radio-cards-price"
      className={cn('mt-auto pt-2 font-semibold text-base tabular-nums', className)}
      {...props}
    />
  )
}

export {
  RadioCards,
  RadioCardsDescription,
  RadioCardsIcon,
  RadioCardsItem,
  RadioCardsPrice,
  RadioCardsTitle,
}
