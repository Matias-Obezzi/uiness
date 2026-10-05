'use client'

import { XIcon } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

interface ExpandableCardContextValue {
  open: boolean
  closing: boolean
  /** Fully open, the opening animation over. */
  settled: boolean
  setSettled: (settled: boolean) => void
  reduced: boolean
  triggerRef: React.RefObject<HTMLButtonElement | null>
  contentRef: React.RefObject<HTMLDivElement | null>
  overlayRef: React.RefObject<HTMLDivElement | null>
  bodyRef: React.RefObject<HTMLDivElement | null>
}

const ExpandableCardContext = React.createContext<ExpandableCardContextValue | null>(null)

function useExpandableCard(component: string) {
  const context = React.useContext(ExpandableCardContext)
  if (!context) throw new Error(`${component} must be used within <ExpandableCard>`)
  return context
}

/** A duration token from the theme in milliseconds, for animations run from script. */
function tokenMs(el: Element, name: string, fallback: number) {
  const value = Number.parseFloat(getComputedStyle(el).getPropertyValue(name))
  return Number.isNaN(value) ? fallback : value
}

function tokenEase(el: Element, name: string, fallback: string) {
  return getComputedStyle(el).getPropertyValue(name).trim() || fallback
}

/** The transform that puts `from`'s box over `to`'s, scaled from the top left corner. */
function flip(from: DOMRect, to: DOMRect) {
  const sx = from.width / to.width
  const sy = from.height / to.height
  return `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${sx}, ${sy})`
}

const canAnimate = (el: Element | null): el is HTMLElement =>
  el instanceof HTMLElement && typeof el.animate === 'function'

export interface ExpandableCardProps {
  /** Expanded, controlled. */
  open?: boolean
  /** Expanded at first. */
  defaultOpen?: boolean
  /** Called when it expands, and when it starts to fold back. */
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

/**
 * A card that grows out of its place in a grid into a larger view over the page, and folds back
 * into it when closed. The larger view is a dialog: focus moves into it, Escape and a click
 * outside close it, and focus returns to the card. With reduced motion it opens and closes at
 * once.
 */
function ExpandableCard({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  children,
}: ExpandableCardProps) {
  const reduced = useReducedMotion()
  const [uncontrolled, setUncontrolled] = React.useState(defaultOpen)
  const wanted = openProp ?? uncontrolled
  // The dialog stays mounted while it folds back, so `shown` trails `wanted` on the way out.
  const [shown, setShown] = React.useState(wanted)
  const [closing, setClosing] = React.useState(false)
  const [settled, setSettled] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const overlayRef = React.useRef<HTMLDivElement>(null)
  const bodyRef = React.useRef<HTMLDivElement>(null)

  const setOpen = (next: boolean) => {
    if (openProp === undefined) setUncontrolled(next)
    onOpenChange?.(next)
  }

  React.useEffect(() => {
    if (wanted) {
      // Opened again while folding back: drop the fold and stay open.
      for (const el of [contentRef.current, bodyRef.current, overlayRef.current]) {
        if (canAnimate(el)) for (const animation of el.getAnimations()) animation.cancel()
      }
      setClosing(false)
      setShown(true)
      return
    }
    if (!shown) return
    const content = contentRef.current
    const trigger = triggerRef.current
    if (reduced || !canAnimate(content) || !trigger) {
      setSettled(false)
      setShown(false)
      return
    }
    setClosing(true)
    for (const animation of content.getAnimations()) animation.cancel()
    const duration = tokenMs(content, '--duration-slow', 300)
    const easing = tokenEase(content, '--easing-standard', 'cubic-bezier(0.2, 0, 0, 1)')
    // The box shrinks back onto the card and fades at the end, uncovering the card itself,
    // which shows again from the start of the fold.
    const animation = content.animate(
      [
        { transform: 'none', opacity: 1 },
        { opacity: 1, offset: 0.6 },
        {
          transform: flip(trigger.getBoundingClientRect(), content.getBoundingClientRect()),
          opacity: 0,
        },
      ],
      { duration, easing, fill: 'forwards' },
    )
    bodyRef.current?.animate([{ opacity: 1 }, { opacity: 0, offset: 0.3 }, { opacity: 0 }], {
      duration,
      fill: 'forwards',
    })
    overlayRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration, fill: 'forwards' })
    let done = false
    const finish = () => {
      if (done) return
      done = true
      setClosing(false)
      setSettled(false)
      setShown(false)
    }
    animation.finished.then(finish, () => {})
    // If the animation never runs (a hidden tab), close anyway.
    const fallback = window.setTimeout(finish, duration + 100)
    return () => {
      done = true
      window.clearTimeout(fallback)
    }
  }, [wanted, shown, reduced])

  const context = React.useMemo(
    () => ({
      open: shown,
      closing,
      settled,
      setSettled,
      reduced,
      triggerRef,
      contentRef,
      overlayRef,
      bodyRef,
    }),
    [shown, closing, settled, reduced],
  )

  return (
    <ExpandableCardContext.Provider value={context}>
      <DialogPrimitive.Root
        open={shown}
        onOpenChange={(next) => {
          if (next !== wanted) setOpen(next)
        }}
      >
        {children}
      </DialogPrimitive.Root>
    </ExpandableCardContext.Provider>
  )
}

export interface ExpandableCardTriggerProps
  extends React.ComponentProps<typeof DialogPrimitive.Trigger> {}

/**
 * The card in the grid. It is a button that opens the larger view, so keep its contents to text
 * and images, or use `asChild` with your own element.
 */
function ExpandableCardTrigger({ className, ref, ...props }: ExpandableCardTriggerProps) {
  const { open, closing, settled, triggerRef } = useExpandableCard('ExpandableCardTrigger')
  const setRef = React.useCallback(
    (node: HTMLButtonElement | null) => {
      triggerRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    },
    [ref, triggerRef],
  )
  return (
    <DialogPrimitive.Trigger
      ref={setRef}
      data-slot="expandable-card-trigger"
      data-expanded={open || undefined}
      data-hidden={(open && settled && !closing) || undefined}
      className={cn(
        'flex flex-col overflow-hidden rounded-xl border bg-card text-left text-card-foreground shadow-sm outline-none transition-[box-shadow,transform] duration-(--duration-fast,150ms) hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[0.99] motion-reduce:transition-none',
        // The card hands its place over to the larger view while that is open. It stays
        // visible under the growing view, and back from the moment the view folds.
        'data-[hidden]:invisible',
        className,
      )}
      {...props}
    />
  )
}

export interface ExpandableCardContentProps
  extends React.ComponentProps<typeof DialogPrimitive.Content> {
  /** Show the close button in the corner. Default true. */
  showCloseButton?: boolean
  /** Classes for the dimmed backdrop. */
  overlayClassName?: string
}

/** The larger view. Give it an `ExpandableCardTitle` so it is named for assistive tech. */
function ExpandableCardContent({
  className,
  overlayClassName,
  showCloseButton = true,
  onOpenAutoFocus,
  children,
  ...props
}: ExpandableCardContentProps) {
  const { closing, reduced, triggerRef, contentRef, overlayRef, bodyRef, setSettled } =
    useExpandableCard('ExpandableCardContent')

  // A callback ref rather than an effect: the portal mounts its children a render after the
  // content, so this is the first moment the box exists, and it runs before the first paint.
  const grown = React.useRef<HTMLDivElement | null>(null)
  const setContent = React.useCallback(
    (node: HTMLDivElement | null) => {
      contentRef.current = node
      // Radix composes refs anew on each render, so this runs again for the same box; only a
      // new box, a new opening, grows.
      if (!node || grown.current === node) return
      grown.current = node
      const trigger = triggerRef.current
      if (reduced || !canAnimate(node) || !trigger) {
        setSettled(true)
        return
      }
      const from = trigger.getBoundingClientRect()
      const to = node.getBoundingClientRect()
      if (from.width === 0 || to.width === 0) {
        setSettled(true)
        return
      }
      const duration = tokenMs(node, '--duration-slow', 300)
      const easing = tokenEase(node, '--easing-emphasized', 'cubic-bezier(0.16, 1, 0.3, 1)')
      // The box starts as the card, fading in over it, and grows into place.
      const grow = node.animate(
        [
          { transform: flip(from, to), opacity: 0 },
          { opacity: 1, offset: 0.25 },
          { transform: 'none', opacity: 1 },
        ],
        { duration, easing },
      )
      // The contents would stretch with the box, so they wait until it has nearly arrived.
      bodyRef.current?.animate([{ opacity: 0 }, { opacity: 0, offset: 0.4 }, { opacity: 1 }], {
        duration,
      })
      overlayRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration })
      grow.finished.then(
        () => setSettled(true),
        () => {},
      )
    },
    [reduced, contentRef, triggerRef, bodyRef, overlayRef, setSettled],
  )

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        ref={overlayRef}
        data-slot="expandable-card-overlay"
        className={cn(
          'fixed inset-0 z-(--z-overlay,50) bg-black/50 backdrop-blur-[2px]',
          overlayClassName,
        )}
      />
      <DialogPrimitive.Content
        ref={setContent}
        data-slot="expandable-card-content"
        data-closing={closing || undefined}
        className={cn(
          // Centered with margins rather than a translate, so the box's own transform is free
          // for the animation.
          'fixed inset-0 z-(--z-overlay,50) m-auto flex h-fit max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl origin-top-left flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-2xl outline-none data-[closing]:pointer-events-none',
          className,
        )}
        onOpenAutoFocus={(event) => {
          onOpenAutoFocus?.(event)
          if (event.defaultPrevented) return
          // Focus the view itself, so its title is read first and Enter cannot press a button
          // inside by accident.
          event.preventDefault()
          contentRef.current?.focus()
        }}
        {...props}
      >
        <div ref={bodyRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {children}
        </div>
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="expandable-card-close"
            className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm outline-none backdrop-blur transition-colors hover:bg-background focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:size-4"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

function ExpandableCardTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="expandable-card-title"
      className={cn('font-semibold text-xl leading-tight tracking-tight', className)}
      {...props}
    />
  )
}

function ExpandableCardDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="expandable-card-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

function ExpandableCardClose(props: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="expandable-card-close" {...props} />
}

export {
  ExpandableCard,
  ExpandableCardClose,
  ExpandableCardContent,
  ExpandableCardDescription,
  ExpandableCardTitle,
  ExpandableCardTrigger,
}
