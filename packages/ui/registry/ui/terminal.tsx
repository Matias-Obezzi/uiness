'use client'

import { Check, LoaderCircle, RotateCcw } from 'lucide-react'
import * as React from 'react'
import { useInView } from '@/hooks/use-in-view'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

type StepState = 'pending' | 'active' | 'done'

interface TerminalContextValue {
  step: number
  playing: boolean
  reduced: boolean
  complete: (index: number) => void
}

const TerminalContext = React.createContext<TerminalContextValue | null>(null)
const StepContext = React.createContext(-1)

/** Where this child is in the sequence, and a way to hand over to the next one. */
function useStep(): [StepState, () => void, boolean] {
  const ctx = React.useContext(TerminalContext)
  const index = React.useContext(StepContext)
  const complete = React.useCallback(() => ctx?.complete(index), [ctx, index])
  // Outside a Terminal, or with reduced motion, everything is simply there.
  if (!ctx || index < 0) return ['done', complete, true]
  const state = ctx.step > index ? 'done' : ctx.step === index && ctx.playing ? 'active' : 'pending'
  return [state, complete, ctx.reduced]
}

/** Run `fn` after `ms` while `when` holds. */
function useTimeout(when: boolean, ms: number, fn: () => void) {
  const fnRef = React.useRef(fn)
  fnRef.current = fn
  React.useEffect(() => {
    if (!when) return
    const timer = setTimeout(() => fnRef.current(), ms)
    return () => clearTimeout(timer)
  }, [when, ms])
}

export interface TerminalProps extends React.ComponentProps<'div'> {
  /** Text in the title bar. */
  title?: string
  /** Start over after the last line. Default false. */
  loop?: boolean
  /** Milliseconds to wait before looping. Default 3000. */
  loopDelay?: number
  /** Show a replay button in the title bar once it has finished. Default true. */
  replay?: boolean
  /** Wait for it to scroll into view before playing. Default true. */
  whenVisible?: boolean
}

/**
 * A terminal window that plays its children in order: `TerminalTyping` types a command,
 * `TerminalLine` and `TerminalSpinner` print output. Starts when it scrolls into view and
 * shows the whole session at once with reduced motion.
 */
function Terminal({
  title,
  loop = false,
  loopDelay = 3000,
  replay = true,
  whenVisible = true,
  className,
  children,
  ...props
}: TerminalProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const body = React.useRef<HTMLDivElement>(null)
  const inView = useInView(ref)
  const reduced = useReducedMotion()
  const steps = React.Children.toArray(children)
  const count = steps.length
  const [step, setStep] = React.useState(0)
  const [run, setRun] = React.useState(0)
  const playing = !whenVisible || inView
  const shown = reduced ? count : step
  const finished = shown >= count

  const complete = React.useCallback(
    (index: number) => setStep((s) => (s === index ? index + 1 : s)),
    [],
  )

  const restart = React.useCallback(() => {
    setStep(0)
    setRun((r) => r + 1)
  }, [])

  useTimeout(finished && loop && playing && !reduced, loopDelay, restart)

  // Keep the newest line in sight when the window is shorter than the session.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs for every new step
  React.useEffect(() => {
    const el = body.current
    if (el && el.scrollHeight > el.clientHeight) el.scrollTop = el.scrollHeight
  }, [shown])

  const value = React.useMemo(
    () => ({ step: shown, playing, reduced, complete }),
    [shown, playing, reduced, complete],
  )

  return (
    <div
      ref={ref}
      data-slot="terminal"
      data-state={finished ? 'done' : 'playing'}
      className={cn(
        'w-full max-w-xl overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm',
        className,
      )}
      {...props}
    >
      <div
        data-slot="terminal-header"
        className="relative flex h-10 items-center gap-2 border-b px-4"
      >
        <span aria-hidden className="flex gap-1.5">
          <span className="size-3 rounded-full bg-muted-foreground/25" />
          <span className="size-3 rounded-full bg-muted-foreground/25" />
          <span className="size-3 rounded-full bg-muted-foreground/25" />
        </span>
        {title && (
          <span className="absolute inset-x-16 truncate text-center text-muted-foreground text-xs">
            {title}
          </span>
        )}
        {replay && !reduced && (
          <button
            type="button"
            aria-label="Replay"
            data-slot="terminal-replay"
            onClick={restart}
            className={cn(
              'ml-auto grid size-6 place-items-center rounded-md text-muted-foreground transition-opacity duration-(--duration-slow,300ms) hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
              finished ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
            tabIndex={finished ? undefined : -1}
          >
            <RotateCcw className="size-3.5" />
          </button>
        )}
      </div>
      <TerminalContext.Provider value={value}>
        <div
          ref={body}
          key={run}
          data-slot="terminal-body"
          className="flex min-h-48 flex-col gap-1 overflow-y-auto p-4 font-mono text-sm leading-relaxed"
        >
          {steps.map((child, i) => (
            <StepContext.Provider
              key={React.isValidElement(child) && child.key != null ? child.key : i}
              value={i}
            >
              {child}
            </StepContext.Provider>
          ))}
        </div>
      </TerminalContext.Provider>
    </div>
  )
}

export interface TerminalTypingProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** The command. */
  children: string
  /** What comes before it. Default '$'. */
  prompt?: React.ReactNode
  /** Milliseconds per character. Default 45. */
  speed?: number
  /** Milliseconds to wait before typing starts. Default 400. */
  delay?: number
}

/** A command typed one character at a time. Screen readers get it in full. */
function TerminalTyping({
  children: text,
  prompt = '$',
  speed = 45,
  delay = 400,
  className,
  ...props
}: TerminalTypingProps) {
  const [state, complete, reduced] = useStep()
  const [length, setLength] = React.useState(0)
  const [started, setStarted] = React.useState(false)
  const active = state === 'active'

  useTimeout(active && !started, delay, () => setStarted(true))

  React.useEffect(() => {
    if (!active || !started) return
    if (length >= text.length) {
      complete()
      return
    }
    const timer = setTimeout(() => setLength((l) => l + 1), speed)
    return () => clearTimeout(timer)
  }, [active, started, length, text.length, speed, complete])

  if (state === 'pending') return null
  const typed = state === 'done' || reduced ? text : text.slice(0, length)

  return (
    <div data-slot="terminal-typing" className={cn('flex gap-2', className)} {...props}>
      {prompt != null && (
        <span aria-hidden className="shrink-0 select-none text-muted-foreground">
          {prompt}
        </span>
      )}
      <span className="min-w-0 break-all">
        <span className="sr-only">{text}</span>
        <span aria-hidden>{typed}</span>
        {active && (
          <span
            aria-hidden
            data-slot="terminal-cursor"
            className={cn(
              'ml-px inline-block h-[1.1em] w-[0.55em] translate-y-[0.2em] bg-current',
              !started && 'animate-[blink_1s_steps(2)_infinite]',
            )}
          />
        )}
      </span>
    </div>
  )
}

export interface TerminalLineProps extends React.ComponentProps<'div'> {
  /** Milliseconds after the step before it before this line prints. Default 150. */
  delay?: number
}

/** A line of output that fades in after the step before it. */
function TerminalLine({ delay = 150, className, style, ...props }: TerminalLineProps) {
  const [state, complete, reduced] = useStep()
  useTimeout(state === 'active', delay, complete)
  if (state !== 'done') return null
  return (
    <div
      data-slot="terminal-line"
      className={cn('motion-reduce:animate-none', className)}
      style={reduced ? style : { animation: 'terminal-line-in 300ms ease-out both', ...style }}
      {...props}
    />
  )
}

export interface TerminalSpinnerProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** What it says while it works. */
  children: React.ReactNode
  /** What it says once done. Default the same as `children`. */
  done?: React.ReactNode
  /** Milliseconds it spins for. Default 1200. */
  duration?: number
  /** Icon once done. Default a check mark. */
  icon?: React.ReactNode
}

/** A step that spins for a while, then turns into a check mark. */
function TerminalSpinner({
  children,
  done,
  duration = 1200,
  icon,
  className,
  style,
  ...props
}: TerminalSpinnerProps) {
  const [state, complete, reduced] = useStep()
  useTimeout(state === 'active', duration, complete)
  if (state === 'pending') return null
  const finished = state === 'done'
  return (
    <div
      data-slot="terminal-spinner"
      data-state={finished ? 'done' : 'working'}
      className={cn(
        'flex items-center gap-2 motion-reduce:animate-none',
        !finished && 'text-muted-foreground',
        className,
      )}
      style={reduced ? style : { animation: 'terminal-line-in 300ms ease-out both', ...style }}
      {...props}
    >
      <span aria-hidden className="grid size-4 shrink-0 place-items-center">
        {finished ? (
          (icon ?? <Check className="size-4" />)
        ) : (
          <LoaderCircle className="size-3.5 animate-spin motion-reduce:animate-none" />
        )}
      </span>
      <span>{finished ? (done ?? children) : children}</span>
    </div>
  )
}

export { Terminal, TerminalLine, TerminalSpinner, TerminalTyping }
