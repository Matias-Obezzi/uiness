'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { ChevronLeftIcon, ChevronRightIcon, PauseIcon, PlayIcon, XIcon } from 'lucide-react'
import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

const STORAGE_PREFIX = 'uiness-announcement:'

function readDismissed(key: string) {
  try {
    return window.localStorage.getItem(STORAGE_PREFIX + key) === '1'
  } catch {
    return false
  }
}

function writeDismissed(key: string) {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, '1')
  } catch {
    // Without storage the bar comes back on the next visit, which is fine.
  }
}

/** Splits milliseconds into days, hours, minutes and seconds. */
function parts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  }
}

const pad = (n: number) => String(n).padStart(2, '0')

const announcementBarVariants = cva('', {
  variants: {
    variant: {
      default: 'border-b bg-muted text-foreground',
      primary: 'bg-primary text-primary-foreground',
      gradient:
        'bg-[linear-gradient(90deg,var(--color-chart-1),var(--color-chart-4),var(--color-chart-2))] text-white',
    },
  },
  defaultVariants: { variant: 'default' },
})

export interface AnnouncementBarProps
  extends Omit<React.ComponentProps<'section'>, 'children'>,
    VariantProps<typeof announcementBarVariants> {
  /** One message, or several that take turns. */
  messages: React.ReactNode[]
  /** Milliseconds each message stays. Default 5000. */
  interval?: number
  /** A date to count down to, shown next to the message. */
  countdownTo?: Date | string | number
  /** Shown in place of the countdown once the date has passed. Nothing by default. */
  countdownDone?: React.ReactNode
  /** Called once when the countdown reaches zero. */
  onCountdownEnd?: () => void
  /** Show the close button. Default true. */
  dismissible?: boolean
  /** Remembers the dismissal in localStorage under this name, so the bar stays closed. */
  storageKey?: string
  /** Called after the bar has closed. */
  onDismiss?: () => void
  /** Names the region for assistive tech. Default "Announcements". */
  label?: string
}

/**
 * A banner across the top of the page. Several messages take turns, pausing on hover, on focus
 * and from their own button. It can count down to a date, and closing it folds its height away
 * and is remembered with `storageKey`.
 */
function AnnouncementBar({
  messages,
  interval = 5000,
  countdownTo,
  countdownDone,
  onCountdownEnd,
  dismissible = true,
  storageKey,
  onDismiss,
  label = 'Announcements',
  variant,
  className,
  ...props
}: AnnouncementBarProps) {
  const reduced = useReducedMotion()
  const [index, setIndex] = React.useState(0)
  const [paused, setPaused] = React.useState(false)
  const [hovered, setHovered] = React.useState(false)
  const [focused, setFocused] = React.useState(false)
  const [state, setState] = React.useState<'open' | 'closing' | 'closed'>('open')
  const count = messages.length
  const rotating = count > 1 && !paused && !hovered && !focused && state === 'open'
  const current = count > 0 ? index % count : 0

  // Read after mount so the server and the first client render agree. In a layout effect, so a
  // remembered dismissal hides the bar before it paints.
  React.useLayoutEffect(() => {
    if (storageKey && readDismissed(storageKey)) setState('closed')
  }, [storageKey])

  // biome-ignore lint/correctness/useExhaustiveDependencies: stepping to a message by hand restarts its time
  React.useEffect(() => {
    if (!rotating) return
    const timer = window.setTimeout(() => setIndex((i) => (i + 1) % count), interval)
    return () => window.clearTimeout(timer)
  }, [rotating, count, interval, index])

  const onDismissRef = React.useRef(onDismiss)
  onDismissRef.current = onDismiss
  const closingRef = React.useRef(false)
  const finishClosing = React.useCallback(() => {
    if (!closingRef.current) return
    closingRef.current = false
    setState('closed')
    onDismissRef.current?.()
  }, [])

  // The fold ends on transitionend; this covers a transition that never runs.
  React.useEffect(() => {
    if (state !== 'closing') return
    const timer = window.setTimeout(finishClosing, 1000)
    return () => window.clearTimeout(timer)
  }, [state, finishClosing])

  const dismiss = () => {
    if (storageKey) writeDismissed(storageKey)
    closingRef.current = true
    if (reduced) finishClosing()
    else setState('closing')
  }

  if (state === 'closed' || count === 0) return null

  const step = (by: number) => setIndex((i) => (((i + by) % count) + count) % count)

  return (
    <section
      data-slot="announcement-bar"
      aria-label={label}
      data-state={state}
      className={cn(
        'grid grid-rows-[1fr] overflow-hidden transition-[grid-template-rows] duration-(--duration-slow,300ms) ease-(--easing-standard,cubic-bezier(0.2,0,0,1)) data-[state=closing]:grid-rows-[0fr] motion-reduce:transition-none',
        announcementBarVariants({ variant }),
        className,
      )}
      onTransitionEnd={(event) => {
        if (event.target === event.currentTarget) finishClosing()
      }}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') setHovered(true)
      }}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false)
      }}
      {...props}
    >
      <div className="min-h-0">
        <div className="flex min-h-10 items-center gap-1 px-2 py-1.5 text-sm sm:px-4">
          {count > 1 && (
            <BarButton label="Previous message" onClick={() => step(-1)} className="max-sm:hidden">
              <ChevronLeftIcon />
            </BarButton>
          )}
          <div
            className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-x-3 gap-y-1 px-1 text-center"
            // Announce changes only when they come from the person, not from the timer.
            aria-live={rotating ? 'off' : 'polite'}
            aria-atomic="true"
          >
            <p
              key={current}
              data-slot="announcement-bar-message"
              className="min-w-0 text-balance duration-(--duration-slow,300ms) ease-(--easing-emphasized,cubic-bezier(0.16,1,0.3,1)) motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:animate-in [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-4"
            >
              {count > 1 && (
                <span className="sr-only">
                  {current + 1} of {count}:{' '}
                </span>
              )}
              {messages[current]}
            </p>
            {countdownTo !== undefined && (
              <Countdown to={countdownTo} done={countdownDone} onEnd={onCountdownEnd} />
            )}
          </div>
          {count > 1 && (
            <>
              <BarButton label="Next message" onClick={() => step(1)} className="max-sm:hidden">
                <ChevronRightIcon />
              </BarButton>
              <BarButton
                label={paused ? 'Play messages' : 'Pause messages'}
                onClick={() => setPaused((p) => !p)}
              >
                {paused ? <PlayIcon /> : <PauseIcon />}
              </BarButton>
            </>
          )}
          {dismissible && (
            <BarButton label="Dismiss" onClick={dismiss}>
              <XIcon />
            </BarButton>
          )}
        </div>
      </div>
    </section>
  )
}

function BarButton({
  label,
  className,
  ...props
}: React.ComponentProps<'button'> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        'flex size-7 shrink-0 items-center justify-center rounded-md opacity-70 outline-none transition-[opacity,background-color] hover:bg-current/10 hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-[3px] focus-visible:ring-current/40 [&_svg]:size-4',
        className,
      )}
      {...props}
    />
  )
}

function Countdown({
  to,
  done,
  onEnd,
}: {
  to: Date | string | number
  done?: React.ReactNode
  onEnd?: () => void
}) {
  const target = new Date(to).getTime()
  // Nothing time based on the server, so the markup matches when the page hydrates.
  const [now, setNow] = React.useState<number | null>(null)
  const ended = React.useRef(false)
  const onEndRef = React.useRef(onEnd)
  onEndRef.current = onEnd

  React.useEffect(() => {
    ended.current = false
    const tick = () => {
      const time = Date.now()
      setNow(time)
      if (time >= target) {
        if (!ended.current) onEndRef.current?.()
        ended.current = true
        window.clearInterval(timer)
      }
    }
    const timer = window.setInterval(tick, 1000)
    tick()
    return () => window.clearInterval(timer)
  }, [target])

  if (now === null || Number.isNaN(target)) return null
  if (now >= target) return done ? <span data-slot="announcement-bar-countdown">{done}</span> : null

  const { days, hours, minutes, seconds } = parts(target - now)
  const unit = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
  const spoken = [
    days > 0 && unit(days, 'day'),
    hours > 0 && unit(hours, 'hour'),
    unit(minutes, 'minute'),
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span
      role="timer"
      data-slot="announcement-bar-countdown"
      aria-label={`Ends in ${spoken}`}
      className="inline-flex shrink-0 items-center gap-1 rounded-md bg-current/10 px-2 py-0.5 font-medium font-mono text-xs tabular-nums"
    >
      {days > 0 && <span>{days}d</span>}
      <span>
        {pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </span>
    </span>
  )
}

export { AnnouncementBar, announcementBarVariants }
