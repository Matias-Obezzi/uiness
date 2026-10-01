'use client'

import { XIcon } from 'lucide-react'
import { Popover as PopoverPrimitive, Portal } from 'radix-ui'
import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/ui/button'
import { Popover, PopoverAnchor, PopoverContent } from '@/ui/popover'

export interface TourStep {
  /** Stable key, also accepted by `startAt`. */
  id: string
  /**
   * The element to highlight: a selector such as `[data-tour="search"]`, or a function that
   * returns the element. Leave it out for a step centered on the screen, like a welcome.
   */
  target?: string | (() => Element | null)
  title: React.ReactNode
  content?: React.ReactNode
  /** Preferred side of the target for the card. It flips when there is no room. */
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  /** Return false to leave the step out, for instance when the user is not an admin. */
  when?: () => boolean
  /** Overrides the tour's `padding` for this step. */
  padding?: number
  /** Overrides the tour's `allowInteraction` for this step. */
  allowInteraction?: boolean
}

/** Named tours, declared once on the provider. */
export type Tours = Record<string, TourStep[]>

/** Declares the tours the app knows about. Only here for type inference. */
export function defineTours<T extends Tours>(tours: T): T {
  return tours
}

export interface TourEvent {
  /** Name of the tour, when it was started by name. */
  tour?: string
  step: TourStep
  /** Position among the steps that are shown, from 0. */
  index: number
  total: number
}

export interface TourEvents {
  /** A step was shown, the first one included. */
  onStepChange?: (event: TourEvent) => void
  /** Done was pressed on the last step. */
  onComplete?: (event: TourEvent) => void
  /** Closed before the end: the close button, Escape, or `skip()`. */
  onSkip?: (event: TourEvent) => void
}

export interface TourOptions extends TourEvents {
  /** Step to open on: a position among the shown steps, or a step id. */
  startAt?: number | string
  /** Leave out steps whose target is not in the page. Off, they show centered. */
  skipMissing?: boolean
  /** Let clicks reach the highlighted element. Everything else stays blocked. */
  allowInteraction?: boolean
  /** Space between the target and the edge of the highlight, in pixels. */
  padding?: number
}

export interface TourLabels {
  next?: string
  back?: string
  done?: string
  /** Accessible name of the close button. */
  skip?: string
  /** The step counter, `2 of 5` by default. */
  progress?: (current: number, total: number) => string
}

interface Run {
  tour?: string
  steps: TourStep[]
  options: TourOptions
  step: TourStep
  /** Index of `step` in `steps`, not among the shown ones. */
  current: number
  /** The steps shown at the time of the last move, for the counter. */
  shown: TourStep[]
  /** Changes on every start, so the same step in a new run counts as new. */
  key: number
}

export interface TourControls {
  /** Starts a tour declared on the provider by name, or one given as steps. */
  start: (tour: string | TourStep[], options?: TourOptions) => void
  next: () => void
  prev: () => void
  /** Ends the tour without firing any event, for instance on a route change. */
  stop: () => void
  /** Ends the tour as the close button does, firing `onSkip`. */
  skip: () => void
  active: boolean
  /** Name of the running tour, when it was started by name. */
  tour?: string
  step: TourStep | null
  /** Position of the current step among the shown ones, from 0. */
  index: number
  total: number
}

const TourContext = React.createContext<TourControls | null>(null)

/** Starts, moves and stops tours, and says where the current one is. */
function useTour(): TourControls {
  const value = React.useContext(TourContext)
  if (!value) throw new Error('useTour must be used inside <TourProvider>.')
  return value
}

const DEFAULT_PADDING = 8

function resolveTarget(step: TourStep): Element | null {
  if (!step.target) return null
  if (typeof step.target === 'function') return step.target()
  try {
    return document.querySelector(step.target)
  } catch {
    return null
  }
}

/** In the page and drawn: an element under `display: none` counts as missing. */
function isPresent(element: Element | null) {
  if (!element) return false
  return typeof element.checkVisibility === 'function' ? element.checkVisibility() : true
}

function isShown(step: TourStep, skipMissing: boolean) {
  if (step.when && !step.when()) return false
  return !skipMissing || !step.target || isPresent(resolveTarget(step))
}

type Box = { top: number; left: number; width: number; height: number }

function toRect({ top, left, width, height }: Box) {
  return {
    x: left,
    y: top,
    top,
    left,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON() {},
  } as DOMRect
}

function grow(rect: Box, by: number): Box {
  return {
    top: rect.top - by,
    left: rect.left - by,
    width: rect.width + by * 2,
    height: rect.height + by * 2,
  }
}

function sameBox(a: Box | null, b: Box) {
  return (
    a !== null &&
    a.top === b.top &&
    a.left === b.left &&
    a.width === b.width &&
    a.height === b.height
  )
}

function inView(rect: Box) {
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.top + rect.height <= window.innerHeight &&
    rect.left + rect.width <= window.innerWidth
  )
}

/** The element's box in the viewport, kept current through scrolling and resizing. */
function useBox(element: Element | null) {
  const [box, setBox] = React.useState<Box | null>(null)
  React.useLayoutEffect(() => {
    if (!element) {
      setBox(null)
      return
    }
    let frame = 0
    const measure = () => {
      frame = 0
      const { top, left, width, height } = element.getBoundingClientRect()
      const next = { top, left, width, height }
      setBox((prev) => (sameBox(prev, next) ? prev : next))
    }
    // Scroll fires many times a frame; measuring once per frame is enough.
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener('scroll', schedule, { capture: true, passive: true })
    window.addEventListener('resize', schedule)
    const observer = new ResizeObserver(schedule)
    observer.observe(element)
    observer.observe(document.body)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule, { capture: true })
      window.removeEventListener('resize', schedule)
      observer.disconnect()
    }
  }, [element])
  return box
}

export interface TourProviderProps extends TourEvents {
  /** The tours the app knows about, by name. */
  tours?: Tours
  /** Leave out steps whose target is not in the page. Off, they show centered. */
  skipMissing?: boolean
  /** Let clicks reach the highlighted element. Everything else stays blocked. */
  allowInteraction?: boolean
  /** Space between the target and the edge of the highlight, in pixels. */
  padding?: number
  /** Corner radius of the highlight, in pixels. */
  radius?: number
  /** Draw an arrow from the card to the target. */
  arrow?: boolean
  /** Text of the buttons and the counter. */
  labels?: TourLabels
  /** Class for the card. */
  className?: string
  /** Class for the highlight, which draws the dimmed page with its shadow. */
  spotlightClassName?: string
  children?: React.ReactNode
}

/**
 * Holds the named tours and draws the one tour that runs at a time: a dimmed page with a
 * cutout around the target, and a card next to it. Mount it once near the root, then start
 * a tour from anywhere with `useTour().start('name')`.
 */
function TourProvider({
  tours,
  skipMissing = true,
  allowInteraction = false,
  padding = DEFAULT_PADDING,
  radius = 10,
  arrow = true,
  labels,
  className,
  spotlightClassName,
  onStepChange,
  onComplete,
  onSkip,
  children,
}: TourProviderProps) {
  const [run, setRun] = React.useState<Run | null>(null)
  // Read by callbacks fired between renders, so two quick presses never act on a stale step.
  const runRef = React.useRef<Run | null>(null)
  const config = { tours, skipMissing, onStepChange, onComplete, onSkip }
  const configRef = React.useRef(config)
  configRef.current = config
  const returnFocus = React.useRef<HTMLElement | null>(null)
  const runs = React.useRef(0)

  const commit = React.useCallback((next: Run | null) => {
    runRef.current = next
    setRun(next)
  }, [])

  const eventFor = React.useCallback((r: Run): TourEvent => {
    return { tour: r.tour, step: r.step, index: r.shown.indexOf(r.step), total: r.shown.length }
  }, [])

  const moveTo = React.useCallback(
    (r: Run, current: number, step: TourStep) => {
      const missing = r.options.skipMissing ?? configRef.current.skipMissing
      const shown = r.steps.filter((s) => s === step || isShown(s, missing))
      const next = { ...r, step, current, shown }
      commit(next)
      const event = eventFor(next)
      next.options.onStepChange?.(event)
      configRef.current.onStepChange?.(event)
    },
    [commit, eventFor],
  )

  const end = React.useCallback(
    (reason: 'complete' | 'skip' | 'stop') => {
      const r = runRef.current
      if (!r) return
      commit(null)
      // Focus goes back once the card is gone; without a card on screen, right away.
      if (!document.querySelector('[data-slot=tour-card]')) {
        returnFocus.current?.focus({ preventScroll: true })
      }
      if (reason === 'stop') return
      const event = eventFor(r)
      if (reason === 'complete') {
        r.options.onComplete?.(event)
        configRef.current.onComplete?.(event)
      } else {
        r.options.onSkip?.(event)
        configRef.current.onSkip?.(event)
      }
    },
    [commit, eventFor],
  )

  const start = React.useCallback(
    (tour: string | TourStep[], options: TourOptions = {}) => {
      const steps = typeof tour === 'string' ? configRef.current.tours?.[tour] : tour
      if (!steps) {
        console.warn(`Tour "${tour}" is not declared on <TourProvider tours>.`)
        return
      }
      const missing = options.skipMissing ?? configRef.current.skipMissing
      const shown = steps.filter((s) => isShown(s, missing))
      const at =
        typeof options.startAt === 'string'
          ? Math.max(
              0,
              shown.findIndex((s) => s.id === options.startAt),
            )
          : Math.min(Math.max(options.startAt ?? 0, 0), shown.length - 1)
      const first = shown[at]
      if (!first) return
      if (!runRef.current) {
        const active = document.activeElement
        returnFocus.current = active instanceof HTMLElement ? active : null
      }
      runs.current += 1
      const current = steps.indexOf(first)
      moveTo(
        {
          tour: typeof tour === 'string' ? tour : undefined,
          steps,
          options,
          step: first,
          current,
          shown,
          key: runs.current,
        },
        current,
        first,
      )
    },
    [moveTo],
  )

  const move = React.useCallback(
    (direction: 1 | -1) => {
      const r = runRef.current
      if (!r) return
      // Checked again on every move: a target can appear or go away while the tour runs.
      const missing = r.options.skipMissing ?? configRef.current.skipMissing
      for (let i = r.current + direction; i >= 0 && i < r.steps.length; i += direction) {
        const candidate = r.steps[i]
        if (candidate && isShown(candidate, missing)) return moveTo(r, i, candidate)
      }
      if (direction === 1) end('complete')
    },
    [moveTo, end],
  )

  const next = React.useCallback(() => move(1), [move])
  const prev = React.useCallback(() => move(-1), [move])
  const stop = React.useCallback(() => end('stop'), [end])
  const skip = React.useCallback(() => end('skip'), [end])

  const step = run ? run.step : null
  const index = run ? run.shown.indexOf(run.step) : -1
  const total = run ? run.shown.length : 0

  const value = React.useMemo<TourControls>(
    () => ({
      start,
      next,
      prev,
      stop,
      skip,
      active: run !== null,
      tour: run?.tour,
      step,
      index,
      total,
    }),
    [start, next, prev, stop, skip, run, step, index, total],
  )

  return (
    <TourContext.Provider value={value}>
      {children}
      {run && step && (
        <TourLayer
          key={run.key}
          stepKey={`${run.key}:${run.current}`}
          step={step}
          index={index}
          total={total}
          padding={step.padding ?? run.options.padding ?? padding}
          radius={radius}
          allowInteraction={
            step.allowInteraction ?? run.options.allowInteraction ?? allowInteraction
          }
          arrow={arrow}
          labels={labels}
          className={className}
          spotlightClassName={spotlightClassName}
          onNext={next}
          onPrev={prev}
          onSkip={skip}
          onCardClosed={() => {
            if (!runRef.current) returnFocus.current?.focus({ preventScroll: true })
          }}
        />
      )}
    </TourContext.Provider>
  )
}

interface TourLayerProps {
  stepKey: string
  step: TourStep
  index: number
  total: number
  padding: number
  radius: number
  allowInteraction: boolean
  arrow: boolean
  labels?: TourLabels
  className?: string
  spotlightClassName?: string
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
  onCardClosed: () => void
}

/** How long the highlight takes to glide to the next target. */
const GLIDE = 350

function TourLayer({
  stepKey,
  step,
  index,
  total,
  padding,
  radius,
  allowInteraction,
  arrow,
  labels,
  className,
  spotlightClassName,
  onNext,
  onPrev,
  onSkip,
  onCardClosed,
}: TourLayerProps) {
  const reduced = useReducedMotion()
  // biome-ignore lint/correctness/useExhaustiveDependencies: looked up again for every step, not on every render
  const element = React.useMemo(() => resolveTarget(step), [stepKey])
  const box = useBox(element)
  const hole = box ? grow(box, padding) : null

  // The card waits until the target has stopped moving, so it does not chase a scroll, and
  // after the first step until the highlight has mostly arrived.
  const [readyFor, setReadyFor] = React.useState<string | null>(null)
  const ready = readyFor === stepKey
  const moves = React.useRef(0)
  React.useEffect(() => {
    const wait = moves.current++ > 0 && !reduced ? GLIDE * 0.6 : 0
    if (element && !inView(grow(element.getBoundingClientRect(), padding))) {
      element.scrollIntoView({
        block: 'center',
        inline: 'center',
        behavior: reduced ? 'auto' : 'smooth',
      })
    }
    const startedAt = performance.now()
    let last: DOMRect | null = null
    let still = 0
    let frame = requestAnimationFrame(function check() {
      const elapsed = performance.now() - startedAt
      if (element) {
        const rect = element.getBoundingClientRect()
        still = last && rect.top === last.top && rect.left === last.left ? still + 1 : 0
        last = rect
      } else {
        still = 3
      }
      if ((still >= 3 && elapsed >= wait) || elapsed > 1000) setReadyFor(stepKey)
      else frame = requestAnimationFrame(check)
    })
    return () => cancelAnimationFrame(frame)
  }, [element, stepKey, padding, reduced])

  // The highlight glides only between steps. Left on, it would trail behind every scroll.
  const first = React.useRef(true)
  const [gliding, setGliding] = React.useState(false)
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs on each new step
  React.useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    setGliding(true)
  }, [stepKey])
  React.useEffect(() => {
    if (!gliding || !ready) return
    const timer = setTimeout(() => setGliding(false), GLIDE)
    return () => clearTimeout(timer)
  }, [gliding, ready])

  const anchor = React.useMemo(
    () => ({
      current: element
        ? {
            getBoundingClientRect: () => toRect(grow(element.getBoundingClientRect(), padding)),
            // Lets the positioning follow scrolling inside the target's own containers.
            contextElement: element,
          }
        : {
            getBoundingClientRect: () =>
              toRect({
                top: window.innerHeight / 2,
                left: window.innerWidth / 2,
                width: 0,
                height: 0,
              }),
          },
    }),
    [element, padding],
  )

  const titleId = React.useId()
  const contentId = React.useId()
  const primary = React.useRef<HTMLButtonElement>(null)
  const last = index === total - 1
  const centered = !element

  return (
    <>
      <Portal.Root>
        <div
          data-slot="tour-overlay"
          aria-hidden="true"
          // A click on the dimmed page would otherwise pull focus out of the card.
          onMouseDown={(event) => event.preventDefault()}
          className="pointer-events-none fixed inset-0 z-(--z-overlay,50) fade-in-0 animate-in duration-(--duration-normal,200ms) motion-reduce:animate-none"
        >
          <div
            data-slot="tour-spotlight"
            data-gliding={gliding && !reduced ? '' : undefined}
            className={cn(
              'absolute shadow-[0_0_0_1px_rgb(255_255_255/0.15),0_0_0_200vmax_rgb(0_0_0/0.5)] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.22),0_0_0_200vmax_rgb(0_0_0/0.72)] data-gliding:transition-[top,left,width,height] data-gliding:duration-(--glide) data-gliding:ease-(--easing-emphasized,cubic-bezier(0.16,1,0.3,1))',
              spotlightClassName,
            )}
            style={
              {
                '--glide': `${GLIDE}ms`,
                top: hole ? hole.top : '50%',
                left: hole ? hole.left : '50%',
                width: hole ? hole.width : 0,
                height: hole ? hole.height : 0,
                borderRadius: hole ? radius : 0,
              } as React.CSSProperties
            }
          />
          {allowInteraction && hole ? (
            // Four bands around the cutout: clicks inside it reach the target.
            <>
              <div
                className="pointer-events-auto absolute inset-x-0 top-0"
                style={{ height: Math.max(hole.top, 0) }}
              />
              <div
                className="pointer-events-auto absolute inset-x-0 bottom-0"
                style={{ top: hole.top + hole.height }}
              />
              <div
                className="pointer-events-auto absolute left-0"
                style={{ top: hole.top, height: hole.height, width: Math.max(hole.left, 0) }}
              />
              <div
                className="pointer-events-auto absolute right-0"
                style={{ top: hole.top, height: hole.height, left: hole.left + hole.width }}
              />
            </>
          ) : (
            <div data-slot="tour-blocker" className="pointer-events-auto absolute inset-0" />
          )}
        </div>
      </Portal.Root>
      <Popover open onOpenChange={(open) => !open && onSkip()} modal={false}>
        <PopoverAnchor virtualRef={anchor} />
        {ready && (
          <PopoverContent
            key={stepKey}
            data-slot="tour-card"
            data-centered={centered ? '' : undefined}
            aria-labelledby={titleId}
            aria-describedby={step.content ? contentId : undefined}
            side={centered ? 'bottom' : step.side}
            align={centered ? 'center' : (step.align ?? 'center')}
            sideOffset={centered ? 0 : 12}
            collisionPadding={12}
            avoidCollisions={!centered}
            className={cn(
              'w-80 max-w-[calc(100vw-2rem)] p-0 shadow-lg motion-reduce:animate-none! data-centered:-translate-y-1/2',
              className,
            )}
            onOpenAutoFocus={(event) => {
              event.preventDefault()
              primary.current?.focus({ preventScroll: true })
            }}
            onCloseAutoFocus={(event) => {
              // Between steps the next card takes focus; after the last one, it goes back.
              event.preventDefault()
              onCardClosed()
            }}
            // The overlay is not "outside": clicking it must not end the tour.
            onInteractOutside={(event) => event.preventDefault()}
            onKeyDown={(event) => {
              const target = event.target as HTMLElement
              if (target.closest('input, textarea, select, [contenteditable="true"]')) return
              if (event.key === 'ArrowRight') {
                event.preventDefault()
                onNext()
              } else if (event.key === 'ArrowLeft') {
                event.preventDefault()
                onPrev()
              }
            }}
          >
            <div className="p-4 pr-10">
              <h2 id={titleId} className="font-semibold leading-snug">
                {step.title}
              </h2>
              {step.content && (
                <div id={contentId} className="mt-1.5 text-muted-foreground text-sm">
                  {step.content}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 px-4 pb-4">
              <span
                data-slot="tour-progress"
                className="text-muted-foreground text-xs tabular-nums"
              >
                {labels?.progress?.(index + 1, total) ?? `${index + 1} of ${total}`}
              </span>
              <div className="flex gap-2">
                {index > 0 && (
                  <Button variant="outline" size="sm" onClick={onPrev}>
                    {labels?.back ?? 'Back'}
                  </Button>
                )}
                <Button ref={primary} size="sm" onClick={onNext}>
                  {last ? (labels?.done ?? 'Done') : (labels?.next ?? 'Next')}
                </Button>
              </div>
            </div>
            <button
              type="button"
              onClick={onSkip}
              aria-label={labels?.skip ?? 'Skip tour'}
              className="absolute top-3 right-3 rounded-sm p-0.5 text-muted-foreground opacity-70 outline-none transition-opacity hover:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:size-4"
            >
              <XIcon />
            </button>
            {arrow && !centered && (
              <PopoverPrimitive.Arrow asChild width={16} height={8}>
                {/* Its own shape so the two slanted sides carry the card's border. */}
                <svg
                  width={16}
                  height={8}
                  viewBox="0 0 16 8"
                  aria-hidden="true"
                  className="-mt-px block overflow-visible"
                >
                  <path d="M0 0 L8 8 L16 0" className="fill-popover stroke-border" />
                </svg>
              </PopoverPrimitive.Arrow>
            )}
          </PopoverContent>
        )}
      </Popover>
    </>
  )
}

export interface TourProps
  extends TourEvents,
    Omit<TourProviderProps, 'tours' | 'children' | keyof TourEvents> {
  steps: TourStep[]
  /** Runs the tour while true. */
  open: boolean
  /** Called with false when the tour ends by itself: completed or skipped. */
  onOpenChange?: (open: boolean) => void
  /** Step to open on: a position among the shown steps, or a step id. */
  startAt?: number | string
}

/** A single tour driven by `open`, for when there is no provider to start it from. */
function Tour({
  steps,
  open,
  onOpenChange,
  startAt,
  onStepChange,
  onComplete,
  onSkip,
  ...props
}: TourProps) {
  return (
    <TourProvider
      {...props}
      onStepChange={onStepChange}
      onComplete={(event) => {
        onComplete?.(event)
        onOpenChange?.(false)
      }}
      onSkip={(event) => {
        onSkip?.(event)
        onOpenChange?.(false)
      }}
    >
      <TourDriver steps={steps} open={open} startAt={startAt} />
    </TourProvider>
  )
}

function TourDriver({
  steps,
  open,
  startAt,
}: {
  steps: TourStep[]
  open: boolean
  startAt?: number | string
}) {
  const { start, stop } = useTour()
  const stepsRef = React.useRef(steps)
  stepsRef.current = steps
  const startAtRef = React.useRef(startAt)
  startAtRef.current = startAt
  React.useEffect(() => {
    if (!open) return
    start(stepsRef.current, { startAt: startAtRef.current })
    return stop
  }, [open, start, stop])
  return null
}

export { Tour, TourProvider, useTour }
