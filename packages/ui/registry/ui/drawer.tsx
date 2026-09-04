'use client'

import { XIcon } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import * as React from 'react'
import { cn } from '@/lib/utils'

export type DrawerSide = 'top' | 'bottom' | 'left' | 'right'

const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)'
const DRAG_THRESHOLD = 6
const CLOSE_RATIO = 0.4
const CLOSE_VELOCITY = 0.6 // px per ms

const reducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

interface DrawerContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const DrawerContext = React.createContext<DrawerContextValue | null>(null)

interface DrawerContentContextValue {
  side: DrawerSide
  snapPoints?: number[]
  activeSnap: number
  setActiveSnap: (index: number) => void
}

const DrawerContentContext = React.createContext<DrawerContentContextValue | null>(null)

function useDrawerContent() {
  const ctx = React.useContext(DrawerContentContext)
  if (!ctx) throw new Error('Drawer parts must be rendered inside <DrawerContent>')
  return ctx
}

export interface DrawerProps
  extends Omit<React.ComponentProps<typeof DialogPrimitive.Root>, 'modal'> {}

function Drawer({ open: openProp, defaultOpen, onOpenChange, ...props }: DrawerProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultOpen ?? false)
  const controlled = openProp !== undefined
  const open = controlled ? openProp : uncontrolled
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!controlled) setUncontrolled(next)
      onOpenChange?.(next)
    },
    [controlled, onOpenChange],
  )
  const value = React.useMemo(() => ({ open, setOpen }), [open, setOpen])
  return (
    <DrawerContext.Provider value={value}>
      <DialogPrimitive.Root data-slot="drawer" open={open} onOpenChange={setOpen} {...props} />
    </DrawerContext.Provider>
  )
}

function DrawerTrigger(props: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

function DrawerPortal(props: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="drawer-portal" {...props} />
}

function DrawerClose(props: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="drawer-close" {...props} />
}

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn(
        'fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className,
      )}
      {...props}
    />
  )
}

const sideClasses: Record<DrawerSide, string> = {
  bottom:
    'inset-x-0 bottom-0 rounded-t-2xl border-t pb-[env(safe-area-inset-bottom)] data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
  top: 'inset-x-0 top-0 rounded-b-2xl border-b pt-[env(safe-area-inset-top)] data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
  left: 'inset-y-0 left-0 h-dvh w-3/4 max-w-sm border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
  right:
    'inset-y-0 right-0 h-dvh w-3/4 max-w-sm border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
}

/** Cap for a drawer that sizes itself to its content. Snap points replace it. */
const loose: Record<DrawerSide, string> = {
  bottom: 'max-h-[calc(100dvh-3rem)]',
  top: 'max-h-[calc(100dvh-3rem)]',
  left: '',
  right: '',
}

const axisOf = (side: DrawerSide) => (side === 'top' || side === 'bottom' ? 'y' : 'x')
/** +1 when moving along the positive axis closes the drawer. */
const signOf = (side: DrawerSide) => (side === 'bottom' || side === 'right' ? 1 : -1)

function translate(side: DrawerSide, offset: number) {
  if (offset === 0) return ''
  const value = `${offset * signOf(side)}px`
  return axisOf(side) === 'y' ? `translate3d(0, ${value}, 0)` : `translate3d(${value}, 0, 0)`
}

/** Resolve a snap point to pixels: fractions of the viewport up to 1, pixels above. */
function snapToPx(point: number, side: DrawerSide) {
  if (typeof window === 'undefined') return point
  const viewport = axisOf(side) === 'y' ? window.innerHeight : window.innerWidth
  return point <= 1 ? point * viewport : point
}

function isScrollable(el: HTMLElement, axis: 'x' | 'y') {
  const style = getComputedStyle(el)
  const overflow = axis === 'y' ? style.overflowY : style.overflowX
  const can = axis === 'y' ? el.scrollHeight > el.clientHeight : el.scrollWidth > el.clientWidth
  return can && (overflow === 'auto' || overflow === 'scroll')
}

function scrollableBetween(target: HTMLElement, root: HTMLElement, axis: 'x' | 'y') {
  let el: HTMLElement | null = target
  while (el && el !== root) {
    if (isScrollable(el, axis)) return el
    el = el.parentElement
  }
  return null
}

const NO_DRAG = 'input, textarea, select, [contenteditable], [data-no-drag]'

function animateTo(el: HTMLElement, transform: string, duration: number) {
  return new Promise<void>((resolve) => {
    if (typeof el.animate !== 'function' || reducedMotion() || duration === 0) {
      el.style.transform = transform
      resolve()
      return
    }
    const current = getComputedStyle(el).transform
    const animation = el.animate(
      [{ transform: current === 'none' ? 'none' : current }, { transform: transform || 'none' }],
      { duration, easing: EASE, fill: 'forwards' },
    )
    let done = false
    const finish = () => {
      if (done) return
      done = true
      el.style.transform = transform
      animation.cancel()
      resolve()
    }
    animation.onfinish = finish
    animation.oncancel = finish
    setTimeout(finish, duration + 50)
  })
}

export interface DrawerContentProps extends React.ComponentProps<typeof DialogPrimitive.Content> {
  /** Edge the drawer comes from. Default bottom. */
  side?: DrawerSide
  /**
   * Sizes the drawer can rest at, along its axis. Fractions of the viewport up to 1, pixels above.
   * The last one is the full size. Only makes sense for top and bottom drawers.
   */
  snapPoints?: number[]
  /** Index into `snapPoints` the drawer opens at. Default 0. */
  defaultSnapPoint?: number
  /** Controlled active snap point index. */
  activeSnapPoint?: number
  onActiveSnapPointChange?: (index: number) => void
  /** Let the user drag or swipe it closed, and close from the overlay and Escape. Default true. */
  dismissible?: boolean
  /** Show the drag handle. Default true for bottom drawers. */
  handle?: boolean
  /** Show the close button in the corner. Default true for side and top drawers. */
  showCloseButton?: boolean
  /** Render the overlay. Default true. */
  overlay?: boolean
}

function DrawerContent({
  side = 'bottom',
  snapPoints,
  defaultSnapPoint = 0,
  activeSnapPoint,
  onActiveSnapPointChange,
  dismissible = true,
  handle = side === 'bottom',
  showCloseButton = side !== 'bottom',
  overlay = true,
  ref: forwardedRef,
  className,
  style,
  children,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onEscapeKeyDown,
  onPointerDownOutside,
  onInteractOutside,
  ...props
}: DrawerContentProps) {
  const drawer = React.useContext(DrawerContext)
  if (!drawer) throw new Error('<DrawerContent> must be rendered inside <Drawer>')
  const { setOpen } = drawer

  // A state backed ref: the content mounts in a portal a commit later, and the snap placement
  // effect has to run once the element is really there.
  const ref = React.useRef<HTMLDivElement | null>(null)
  const [element, setElement] = React.useState<HTMLDivElement | null>(null)
  const setRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      ref.current = node
      setElement(node)
      if (typeof forwardedRef === 'function') forwardedRef(node)
      else if (forwardedRef) forwardedRef.current = node
    },
    [forwardedRef],
  )
  const [uncontrolledSnap, setUncontrolledSnap] = React.useState(defaultSnapPoint)
  const activeSnap = activeSnapPoint ?? uncontrolledSnap
  const setActiveSnap = React.useCallback(
    (index: number) => {
      if (activeSnapPoint === undefined) setUncontrolledSnap(index)
      onActiveSnapPointChange?.(index)
    },
    [activeSnapPoint, onActiveSnapPointChange],
  )

  const axis = axisOf(side)
  const snaps = snapPoints ?? []
  const hasSnaps = snaps.length > 0
  const maxSnap = snaps[snaps.length - 1] ?? 1
  const fullSize = () => {
    const rect = ref.current?.getBoundingClientRect()
    const measured = rect ? (axis === 'y' ? rect.height : rect.width) : 0
    if (measured > 0) return measured
    return hasSnaps ? snapToPx(maxSnap, side) : 0
  }
  /** Resting translation for a snap point, from the fully open position. */
  const restOffset = (index: number) =>
    hasSnaps ? Math.max(0, fullSize() - snapToPx(snaps[index] ?? maxSnap, side)) : 0

  // Start at the default snap point every time the drawer opens.
  const { open } = drawer
  React.useEffect(() => {
    if (!open && activeSnapPoint === undefined) setUncontrolledSnap(defaultSnapPoint)
  }, [open, activeSnapPoint, defaultSnapPoint])

  // Move to the active snap point when it changes. The first placement is instant, the enter
  // animation slides from off screen to it.
  const placed = React.useRef(false)
  // biome-ignore lint/correctness/useExhaustiveDependencies: restOffset reads live layout, only react to open and snap changes
  React.useLayoutEffect(() => {
    const el = element
    if (!open || !el || !hasSnaps) {
      placed.current = false
      return
    }
    const target = translate(side, restOffset(activeSnap))
    if (placed.current) animateTo(el, target, 300)
    else el.style.transform = target
    placed.current = true
  }, [open, element, activeSnap, hasSnaps, side])

  const drag = React.useRef<{
    pointerId: number
    start: number
    startOffset: number
    other: number
    dragging: boolean
    last: number
    lastTime: number
    velocity: number
    scroller: HTMLElement | null
    ignore: boolean
  } | null>(null)

  const coord = (e: React.PointerEvent) => (axis === 'y' ? e.clientY : e.clientX)
  const otherCoord = (e: React.PointerEvent) => (axis === 'y' ? e.clientX : e.clientY)

  const handleDown = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerDown?.(e)
    if (e.defaultPrevented || e.button !== 0) return
    const el = ref.current
    if (!el || (!dismissible && !hasSnaps)) return
    const target = e.target as HTMLElement
    drag.current = {
      pointerId: e.pointerId,
      start: coord(e),
      startOffset: restOffset(activeSnap),
      other: otherCoord(e),
      dragging: false,
      last: coord(e),
      lastTime: e.timeStamp,
      velocity: 0,
      scroller: scrollableBetween(target, el, axis),
      ignore: !!target.closest(NO_DRAG),
    }
  }

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(e)
    const d = drag.current
    const el = ref.current
    if (!d || !el || d.ignore || d.pointerId !== e.pointerId) return
    const delta = (coord(e) - d.start) * signOf(side)
    if (!d.dragging) {
      const along = Math.abs(delta)
      const across = Math.abs(otherCoord(e) - d.other)
      if (along < DRAG_THRESHOLD && across < DRAG_THRESHOLD) return
      if (across > along) {
        drag.current = null
        return
      }
      const scroller = d.scroller
      if (scroller) {
        const atStart = axis === 'y' ? scroller.scrollTop <= 0 : scroller.scrollLeft <= 0
        const atEnd =
          axis === 'y'
            ? scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1
            : scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 1
        // Closing direction needs the scroller at its start, opening direction at its end.
        const closing = delta > 0
        const forwardIsClosing = signOf(side) === 1
        const scrollerCanTake = closing
          ? forwardIsClosing
            ? !atStart
            : !atEnd
          : forwardIsClosing
            ? !atEnd
            : !atStart
        if (scrollerCanTake) {
          drag.current = null
          return
        }
      }
      d.dragging = true
      el.setPointerCapture(e.pointerId)
      el.setAttribute('data-dragging', '')
      d.start = coord(e)
    }
    let offset = d.startOffset + (coord(e) - d.start) * signOf(side)
    if (offset < 0) offset = -((-offset) ** 0.7) // rubber band past fully open
    if (!dismissible) offset = Math.min(offset, restOffset(0))
    el.style.transform = translate(side, offset)
    const now = e.timeStamp
    const dt = now - d.lastTime
    if (dt > 0) {
      d.velocity = ((coord(e) - d.last) * signOf(side)) / dt
      d.last = coord(e)
      d.lastTime = now
    }
  }

  const settle = async (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    const el = ref.current
    drag.current = null
    if (!d || !el || !d.dragging) return
    el.removeAttribute('data-dragging')
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)
    const offset = d.startOffset + (coord(e) - d.start) * signOf(side)
    const size = fullSize()
    const projected = offset + d.velocity * 120

    if (hasSnaps) {
      const candidates = snaps.map((_, i) => ({ index: i, at: restOffset(i) }))
      if (dismissible) candidates.push({ index: -1, at: size })
      let best = { index: activeSnap, at: restOffset(activeSnap) }
      for (const c of candidates) {
        if (Math.abs(c.at - projected) < Math.abs(best.at - projected)) best = c
      }
      if (best.index === -1) {
        await animateTo(el, translate(side, size), 250)
        el.style.animation = 'none'
        setOpen(false)
        return
      }
      if (best.index === activeSnap) await animateTo(el, translate(side, best.at), 300)
      else setActiveSnap(best.index)
      return
    }

    const shouldClose =
      dismissible &&
      (projected > size * CLOSE_RATIO || (d.velocity > CLOSE_VELOCITY && offset > DRAG_THRESHOLD))
    if (shouldClose) {
      await animateTo(el, translate(side, size), 250)
      el.style.animation = 'none'
      setOpen(false)
    } else {
      await animateTo(el, '', 350)
    }
  }

  const contentValue = React.useMemo<DrawerContentContextValue>(
    () => ({ side, snapPoints, activeSnap, setActiveSnap }),
    [side, snapPoints, activeSnap, setActiveSnap],
  )

  const maxSize = maxSnap <= 1 ? `${maxSnap * 100}${axis === 'y' ? 'dvh' : 'vw'}` : maxSnap
  const sizeStyle: React.CSSProperties = hasSnaps
    ? axis === 'y'
      ? { height: maxSize }
      : { width: maxSize }
    : {}

  return (
    <DrawerContentContext.Provider value={contentValue}>
      <DrawerPortal>
        {overlay && <DrawerOverlay />}
        <DialogPrimitive.Content
          ref={setRef}
          data-slot="drawer-content"
          data-side={side}
          className={cn(
            'fixed z-50 flex touch-none flex-col bg-background shadow-lg outline-none duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] data-[state=closed]:animate-out data-[state=open]:animate-in motion-reduce:animate-none',
            sideClasses[side],
            !hasSnaps && loose[side],
            className,
          )}
          style={{ ...sizeStyle, ...style }}
          onPointerDown={handleDown}
          onPointerMove={handleMove}
          onPointerUp={(e) => {
            onPointerUp?.(e)
            void settle(e)
          }}
          onPointerCancel={(e) => {
            onPointerCancel?.(e)
            void settle(e)
          }}
          onEscapeKeyDown={(e) => {
            onEscapeKeyDown?.(e)
            if (!dismissible) e.preventDefault()
          }}
          onPointerDownOutside={(e) => {
            onPointerDownOutside?.(e)
            if (!dismissible) e.preventDefault()
          }}
          onInteractOutside={(e) => {
            onInteractOutside?.(e)
            if (!dismissible) e.preventDefault()
          }}
          {...props}
        >
          {handle && <DrawerHandle />}
          {children}
          {showCloseButton && (
            <DialogPrimitive.Close
              data-slot="drawer-close"
              className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 [&_svg]:size-4"
            >
              <XIcon />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Content>
      </DrawerPortal>
    </DrawerContentContext.Provider>
  )
}

/** Drag handle. Clicking it cycles through the snap points. */
function DrawerHandle({ className, ...props }: React.ComponentProps<'button'>) {
  const { snapPoints, activeSnap, setActiveSnap } = useDrawerContent()
  return (
    <button
      type="button"
      data-slot="drawer-handle"
      aria-label={snapPoints ? 'Resize drawer' : 'Drag to close'}
      tabIndex={-1}
      onClick={() => {
        if (!snapPoints?.length) return
        setActiveSnap((activeSnap + 1) % snapPoints.length)
      }}
      className={cn(
        'mx-auto my-3 h-1.5 w-12 shrink-0 cursor-grab rounded-full bg-muted-foreground/30 active:cursor-grabbing',
        className,
      )}
      {...props}
    />
  )
}

function DrawerHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-header"
      className={cn('flex shrink-0 flex-col gap-1.5 px-6 pt-2 pb-4', className)}
      {...props}
    />
  )
}

/** Scrollable middle part. Dragging from inside it works when it is scrolled to the start. */
function DrawerBody({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-body"
      className={cn(
        'min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-6',
        className,
      )}
      {...props}
    />
  )
}

function DrawerFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn('mt-auto flex shrink-0 flex-col gap-2 px-6 py-4', className)}
      {...props}
    />
  )
}

function DrawerTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="drawer-title"
      className={cn('font-semibold text-lg leading-none', className)}
      {...props}
    />
  )
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="drawer-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

/** Read and change the active snap point from inside the drawer. */
function useDrawerSnap() {
  const { snapPoints, activeSnap, setActiveSnap } = useDrawerContent()
  return { snapPoints, activeSnap, setActiveSnap }
}

export {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHandle,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
  useDrawerSnap,
}
