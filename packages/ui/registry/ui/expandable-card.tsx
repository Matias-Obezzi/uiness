'use client'

import { XIcon } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface ExpandableCardLabels {
  /** Read out for the close button. */
  close: string
}

export const defaultExpandableCardLabels: ExpandableCardLabels = {
  close: 'Close',
}

/** Runs one opening or folding animation. Null when the browser cannot animate it. */
type Play = (opening: boolean) => Promise<boolean> | null

interface ExpandableCardContextValue {
  open: boolean
  closing: boolean
  reduced: boolean
  play: Play
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

/**
 * A duration token from the theme in milliseconds, for animations run from script. Minifiers
 * rewrite `300ms` as `.3s`, so both units are read.
 */
function tokenMs(el: Element, name: string, fallback: number) {
  const raw = getComputedStyle(el).getPropertyValue(name).trim()
  const n = Number.parseFloat(raw)
  if (Number.isNaN(n)) return fallback
  return raw.endsWith('ms') ? n : raw.endsWith('s') ? n * 1000 : fallback
}

/** An easing token from the theme. The Web Animations API takes the literal curve. */
function tokenEase(el: Element, name: string, fallback: string) {
  const value = getComputedStyle(el).getPropertyValue(name).trim()
  return value && !value.startsWith('var(') ? value : fallback
}

const canAnimate = (el: Element | null): el is HTMLElement =>
  el instanceof HTMLElement && typeof el.animate === 'function'

const px = (n: number) => `${n}px`

/**
 * The picture the card and the view share, which moves from one to the other: the first element
 * marked `data-expandable-card-media`, or else the first image or video.
 */
function findMedia(root: Element) {
  const el =
    root.querySelector('[data-expandable-card-media]') ??
    root.querySelector('img, video, picture, canvas')
  return el instanceof HTMLElement ? el : null
}

/** Everything in the view but the shared picture and the boxes that hold it. */
function fadersOf(content: HTMLElement, media: HTMLElement | null, ghost: HTMLElement | null) {
  const holds = new Set<Element>()
  for (let el: Element | null = media; el && el !== content; el = el.parentElement) holds.add(el)
  const out: HTMLElement[] = []
  const walk = (parent: Element) => {
    for (const child of parent.children) {
      if (child === ghost || !(child instanceof HTMLElement)) continue
      if (!holds.has(child)) out.push(child)
      else if (child !== media) walk(child)
    }
  }
  walk(content)
  return out
}

const INHERITED = [
  'color',
  'font-family',
  'font-size',
  'font-style',
  'font-weight',
  'letter-spacing',
  'line-height',
  'text-align',
  'text-transform',
  'word-spacing',
  'direction',
]

/**
 * A copy of the card laid over the view's top left corner while it moves, so the view starts out
 * looking exactly like the card. It keeps the card's text and lets the view show through
 * everywhere else, the shared picture included.
 */
function makeGhost(trigger: HTMLElement, content: HTMLElement, card: DOMRect) {
  const ghost = trigger.cloneNode(true) as HTMLElement
  for (const el of [ghost, ...ghost.querySelectorAll('[id]')]) el.removeAttribute('id')
  for (const name of [
    'data-hidden',
    'data-expanded',
    'data-state',
    'aria-controls',
    'aria-expanded',
    'aria-haspopup',
  ]) {
    ghost.removeAttribute(name)
  }
  ghost.setAttribute('aria-hidden', 'true')
  ghost.setAttribute('inert', '')
  ghost.tabIndex = -1
  ghost.dataset.slot = 'expandable-card-ghost'
  const css = getComputedStyle(content)
  const own = getComputedStyle(trigger)
  // What the card inherits from the page, which the view may set differently.
  for (const name of INHERITED) ghost.style.setProperty(name, own.getPropertyValue(name))
  Object.assign(ghost.style, {
    position: 'absolute',
    top: px(-Number.parseFloat(css.borderTopWidth) || 0),
    left: px(-Number.parseFloat(css.borderLeftWidth) || 0),
    width: px(card.width),
    height: px(card.height),
    margin: '0',
    zIndex: '1',
    pointerEvents: 'none',
    visibility: 'visible',
    background: 'transparent',
    borderColor: 'transparent',
    boxShadow: 'none',
    transform: 'none',
    transition: 'none',
  })
  const media = findMedia(ghost)
  if (media) media.style.visibility = 'hidden'
  content.append(ghost)
  return ghost
}

/** A box relative to the view's top left corner, or to the screen for the view itself. */
interface Box {
  x: number
  y: number
  w: number
  h: number
}

const boxOf = (rect: DOMRect, origin?: DOMRect): Box => ({
  x: rect.left - (origin?.left ?? 0),
  y: rect.top - (origin?.top ?? 0),
  w: rect.width,
  h: rect.height,
})

/** One end of the morph. */
interface Pose {
  box: Box
  radius: string
  shadow: string
  media: Box | null
  ghost: { opacity: string; transform: string }
  faders: { opacity: string; transform: string }[]
  overlay: string
}

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
 * outside close it, and focus returns to the card. With reduced motion the view fades in over
 * the card instead.
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
  const phase = React.useRef<'closed' | 'open' | 'closing'>(wanted ? 'open' : 'closed')
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const overlayRef = React.useRef<HTMLDivElement>(null)
  const bodyRef = React.useRef<HTMLDivElement>(null)
  const motion = React.useRef<{ run: number; animations: Animation[]; ghost: HTMLElement | null }>({
    run: 0,
    animations: [],
    ghost: null,
  })

  const setOpen = (next: boolean) => {
    if (openProp === undefined) setUncontrolled(next)
    onOpenChange?.(next)
  }

  const play = React.useCallback<Play>(
    (opening) => {
      const state = motion.current
      const run = ++state.run
      const content = contentRef.current
      const trigger = triggerRef.current
      const body = bodyRef.current
      const overlay = overlayRef.current
      const stop = () => {
        for (const animation of state.animations) animation.cancel()
        state.animations = []
        state.ghost?.remove()
        state.ghost = null
      }
      if (!canAnimate(content) || !body) {
        stop()
        return null
      }
      // Already moving: whatever is on screen now is where the next animation starts.
      const moving = state.animations.length > 0
      const animations: Animation[] = []
      const animate = (
        el: Element | null,
        frames: Keyframe[],
        options: KeyframeAnimationOptions,
      ) => {
        if (canAnimate(el)) animations.push(el.animate(frames, { fill: 'both', ...options }))
      }
      const finish = (duration: number) =>
        new Promise<boolean>((resolve) => {
          state.animations = animations
          // If the animations never run (a hidden tab), settle anyway.
          const fallback = window.setTimeout(() => resolve(state.run === run), duration + 150)
          Promise.all(animations.map((a) => a.finished))
            .then(
              () => resolve(state.run === run),
              () => resolve(false),
            )
            .finally(() => window.clearTimeout(fallback))
        }).then((done) => {
          // Open, the view goes back to its own styles; folded, it holds the card's pose until
          // it unmounts, so the card can take over in the same frame.
          if (done && opening) stop()
          return done
        })

      const card = trigger?.getBoundingClientRect()
      if (reduced || !trigger || !card || card.width === 0 || card.height === 0) {
        // Reduced motion: the view and the backdrop fade over the card, which stays in place.
        const from = moving ? getComputedStyle(content).opacity : opening ? '0' : '1'
        const fromOverlay = moving && overlay ? getComputedStyle(overlay).opacity : from
        stop()
        const to = opening ? '1' : '0'
        const duration = tokenMs(content, '--duration-normal', 200)
        animate(content, [{ opacity: from }, { opacity: to }], { duration, easing: 'linear' })
        animate(overlay, [{ opacity: fromOverlay }, { opacity: to }], {
          duration,
          easing: 'linear',
        })
        return finish(duration)
      }

      // Where everything is now, read before anything is cancelled.
      let now: Pose | null = null
      let ghost = state.ghost
      const viewMedia = findMedia(body)
      const cardMedia = findMedia(trigger)
      const shared = viewMedia && cardMedia ? viewMedia : null
      const faders = fadersOf(content, shared, ghost)
      if (moving) {
        const rect = content.getBoundingClientRect()
        const css = getComputedStyle(content)
        const ghostCss = ghost ? getComputedStyle(ghost) : null
        now = {
          box: boxOf(rect),
          radius: css.borderRadius,
          shadow: css.boxShadow,
          media: shared ? boxOf(shared.getBoundingClientRect(), rect) : null,
          ghost: {
            opacity: ghostCss?.opacity ?? (opening ? '1' : '0'),
            transform: ghostCss?.transform ?? 'none',
          },
          faders: faders.map((el) => {
            const fader = getComputedStyle(el)
            return { opacity: fader.opacity, transform: fader.transform }
          }),
          overlay: overlay ? getComputedStyle(overlay).opacity : '1',
        }
      }
      for (const animation of state.animations) animation.cancel()
      state.animations = []

      // Both ends, measured in place: the card wherever it is now, the view where it lands.
      const view = content.getBoundingClientRect()
      const bodyRect = body.getBoundingClientRect()
      const viewCss = getComputedStyle(content)
      const cardCss = getComputedStyle(trigger)
      const viewMediaRect = shared?.getBoundingClientRect()
      const cardMediaRect = shared ? cardMedia?.getBoundingClientRect() : undefined
      // The card's text rides just under the picture as it grows.
      const drop =
        viewMediaRect && cardMediaRect
          ? viewMediaRect.bottom - view.top - (cardMediaRect.bottom - card.top)
          : 0
      const cardPose: Pose = {
        box: boxOf(card),
        radius: cardCss.borderRadius,
        shadow: cardCss.boxShadow,
        media: cardMediaRect ? boxOf(cardMediaRect, card) : null,
        ghost: { opacity: '1', transform: 'none' },
        faders: faders.map(() => ({ opacity: '0', transform: 'translateY(0.75rem)' })),
        overlay: '0',
      }
      const viewPose: Pose = {
        box: boxOf(view),
        radius: viewCss.borderRadius,
        shadow: viewCss.boxShadow,
        media: viewMediaRect ? boxOf(viewMediaRect, view) : null,
        ghost: { opacity: '0', transform: `translateY(${px(drop)})` },
        faders: faders.map(() => ({ opacity: '1', transform: 'none' })),
        overlay: '1',
      }
      const from = now ?? (opening ? cardPose : viewPose)
      const to = opening ? viewPose : cardPose

      ghost ??= makeGhost(trigger, content, card)
      state.ghost = ghost

      // A little longer than the theme's slow step, so the growth reads as one movement.
      const duration = tokenMs(content, '--duration-slow', 300) * (opening ? 1.4 : 1.2)
      const easing = tokenEase(content, '--easing-standard', 'cubic-bezier(0.2, 0, 0, 1)')
      const fade = easing
      const timing = { duration, easing }

      // The surface itself: its real box, border, corners and shadow, from one place to the
      // other. Size changes rather than a scale, so nothing inside is stretched.
      const surface = (pose: Pose): Keyframe => ({
        top: px(pose.box.y),
        left: px(pose.box.x),
        width: px(pose.box.w),
        height: px(pose.box.h),
        right: 'auto',
        bottom: 'auto',
        margin: '0',
        maxWidth: 'none',
        maxHeight: 'none',
        borderRadius: pose.radius,
        boxShadow: pose.shadow,
      })
      animate(content, [surface(from), surface(to)], timing)
      // The contents keep their final layout throughout, and the surface crops them.
      const fixed = { width: px(bodyRect.width), height: px(bodyRect.height), flex: 'none' }
      animate(body, [fixed, fixed], { duration })

      // The shared picture: from its place in the card to its place in the view, resized rather
      // than scaled so it crops as it does at either end.
      const end = viewPose.media
      if (shared && end && from.media && to.media) {
        const media = (box: Box): Keyframe => ({
          transform: `translate(${px(box.x - end.x)}, ${px(box.y - end.y)})`,
          width: px(box.w),
          height: px(box.h),
          maxWidth: 'none',
          flexShrink: '0',
        })
        animate(shared, [media(from.media), media(to.media)], timing)
      }

      // The card's own text fades out early on the way out, and back in late on the way home.
      animate(
        ghost,
        [{ transform: from.ghost.transform }, { transform: to.ghost.transform }],
        timing,
      )
      const ghostFade: Keyframe[] = now
        ? [{ opacity: from.ghost.opacity }, { opacity: to.ghost.opacity }]
        : opening
          ? [{ opacity: 1 }, { opacity: 0, offset: 0.5 }, { opacity: 0 }]
          : [
              { opacity: 0 },
              { opacity: 0, offset: 0.2 },
              { opacity: 1, offset: 0.7 },
              { opacity: 1 },
            ]
      animate(ghost, ghostFade, { duration, easing: 'linear' })

      // What only the view has comes in once the surface has room for it, and leaves first. It
      // starts while the card's text is still fading, so there is always text on the surface.
      faders.forEach((el, i) => {
        const a = from.faders[i]
        const b = to.faders[i]
        if (!a || !b) return
        const frames: Keyframe[] = now
          ? [a, b]
          : opening
            ? [a, { ...a, offset: 0.15, easing: fade }, b]
            : [a, { ...b, offset: 0.25 }, b]
        animate(el, frames, { duration, easing: now ? fade : 'linear' })
      })

      animate(overlay, [{ opacity: from.overlay }, { opacity: to.overlay }], timing)
      return finish(duration)
    },
    [reduced],
  )

  React.useEffect(() => {
    if (wanted) {
      if (phase.current === 'closed') {
        phase.current = 'open'
        setShown(true)
      } else if (phase.current === 'closing') {
        // Opened again while folding back: grow again from wherever it is.
        phase.current = 'open'
        setClosing(false)
        play(true)
      }
      return
    }
    if (phase.current !== 'open') return
    phase.current = 'closing'
    const done = () => {
      if (phase.current !== 'closing') return
      phase.current = 'closed'
      motion.current.animations = []
      motion.current.ghost = null
      setClosing(false)
      setShown(false)
    }
    const folding = play(false)
    if (!folding) {
      done()
      return
    }
    setClosing(true)
    folding.then((finished) => {
      if (finished) done()
    })
  }, [wanted, play])

  const context = React.useMemo(
    () => ({
      open: shown,
      closing,
      reduced,
      play,
      triggerRef,
      contentRef,
      overlayRef,
      bodyRef,
    }),
    [shown, closing, reduced, play],
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
  const { open, reduced, triggerRef } = useExpandableCard('ExpandableCardTrigger')
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
      data-hidden={(open && !reduced) || undefined}
      className={cn(
        'flex flex-col overflow-hidden rounded-xl border bg-card text-left text-card-foreground shadow-sm outline-none transition-[box-shadow,transform] duration-(--duration-fast,150ms) hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[0.99] motion-reduce:transition-none',
        // The card becomes the larger view, so there is only ever one of it: it hides from the
        // first frame of the growth until the view has folded all the way back onto it.
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
  /** Words to use instead of the English ones. A `LabelsProvider` sets them for the whole app. */
  labels?: Partial<ExpandableCardLabels>
}

/** The larger view. Give it an `ExpandableCardTitle` so it is named for assistive tech. */
function ExpandableCardContent({
  className,
  overlayClassName,
  showCloseButton = true,
  labels: labelsProp,
  onOpenAutoFocus,
  children,
  ...props
}: ExpandableCardContentProps) {
  const labels = useLabels('expandable-card', defaultExpandableCardLabels, labelsProp)
  const { closing, play, contentRef, overlayRef, bodyRef } =
    useExpandableCard('ExpandableCardContent')

  // A callback ref rather than an effect: the portal mounts its children a render after the
  // content, so this is the first moment the view exists, and it runs before the first paint.
  const grown = React.useRef<HTMLDivElement | null>(null)
  const setContent = React.useCallback(
    (node: HTMLDivElement | null) => {
      contentRef.current = node
      // Radix composes refs anew on each render, so this runs again for the same view; only a
      // new view, a new opening, grows.
      if (!node || grown.current === node) return
      grown.current = node
      play(true)
    },
    [play, contentRef],
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
          // Centered with margins rather than a translate, so the animation can move the view by
          // its own box from the card's place to this one.
          'fixed inset-0 z-(--z-overlay,50) m-auto flex h-fit max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-2xl outline-none data-[closing]:pointer-events-none',
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
            <span className="sr-only">{labels.close}</span>
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
