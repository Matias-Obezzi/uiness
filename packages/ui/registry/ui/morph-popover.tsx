'use client'

import { CheckIcon, XIcon } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface MorphPopoverLabels {
  close: string
  submit: string
  sending: string
  done: string
}

export const defaultMorphPopoverLabels: MorphPopoverLabels = {
  close: 'Close',
  submit: 'Send',
  sending: 'Sending…',
  done: 'Sent',
}

/** How long the confirmation shows before it turns back into the button. */
const CONFIRM_MS = 1800

type Phase = 'closed' | 'open' | 'sending' | 'done'

export interface MorphPopoverProps
  extends Omit<React.ComponentProps<'div'>, 'children' | 'onSubmit'> {
  /** The button's text, and the form's title once open. */
  label: string
  icon?: React.ReactNode
  /** The form's fields. */
  children: React.ReactNode
  /** Receives the form's data. Return a promise to show it sending. */
  onSubmit: (data: FormData) => unknown
  /** Shown once sent. Default "Sent". */
  confirmation?: React.ReactNode
  labels?: Partial<MorphPopoverLabels>
}

/**
 * A button that grows into the form it opens: its label slides up to become the form's title,
 * and once sent the form shrinks into a confirmation before turning back into the button.
 * Escape or a press outside closes it, and focus goes back to the button.
 */
function MorphPopover({
  label,
  icon,
  children,
  onSubmit,
  confirmation,
  labels: labelsProp,
  className,
  ...props
}: MorphPopoverProps) {
  const labels = useLabels('morph-popover', defaultMorphPopoverLabels, labelsProp)
  const reduced = useReducedMotion()
  const [phase, setPhase] = React.useState<Phase>('closed')
  const [size, setSize] = React.useState<{ w: number; h: number } | null>(null)
  // How far the form moves sideways to stay on screen, as it grows from the button.
  const [shift, setShift] = React.useState(0)
  const wrapper = React.useRef<HTMLDivElement>(null)
  const shell = React.useRef<HTMLDivElement>(null)
  const inner = React.useRef<HTMLDivElement>(null)
  const button = React.useRef<HTMLButtonElement>(null)
  const titleId = React.useId()
  const timer = React.useRef(0)

  // The shell takes the size of what it holds, and animates between sizes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: each phase holds something of another size
  React.useLayoutEffect(() => {
    const el = inner.current
    if (!el) return
    const measure = () => {
      setSize({ w: el.offsetWidth, h: el.offsetHeight })
      const left = wrapper.current?.getBoundingClientRect().left ?? 0
      const room = document.documentElement.clientWidth - 16
      setShift(Math.max(16 - left, Math.min(0, room - (left + el.offsetWidth))))
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [phase])

  const close = React.useCallback(() => {
    window.clearTimeout(timer.current)
    setPhase('closed')
    requestAnimationFrame(() => button.current?.focus())
  }, [])

  React.useEffect(() => {
    if (phase !== 'open') return
    inner.current?.querySelector<HTMLElement>('input, textarea, select')?.focus()
    const outside = (event: PointerEvent) => {
      if (!shell.current?.contains(event.target as Node)) close()
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [phase, close])
  React.useEffect(() => () => window.clearTimeout(timer.current), [])

  const open = phase !== 'closed'

  return (
    <div
      ref={wrapper}
      data-slot="morph-popover"
      className={cn('relative inline-block', className)}
      {...props}
    >
      {/* Keeps the button's room in the layout while the form floats over the page. */}
      <span
        aria-hidden="true"
        className="invisible inline-flex h-10 items-center gap-2 px-4 font-medium text-sm [&_svg]:size-4"
      >
        {icon}
        {label}
      </span>
      <div
        ref={shell}
        className={cn(
          'absolute top-0 left-0 z-20 overflow-hidden border bg-popover text-popover-foreground',
          open ? 'rounded-2xl shadow-xl' : 'rounded-[20px] shadow-xs',
          !reduced &&
            'transition-[width,height,left,border-radius,box-shadow] duration-(--duration-slow,300ms) ease-(--easing-emphasized,cubic-bezier(0.16,1,0.3,1))',
        )}
        style={size ? { width: size.w, height: size.h, left: shift } : undefined}
      >
        <div ref={inner} className="w-max">
          {phase === 'closed' && (
            <button
              ref={button}
              type="button"
              aria-expanded={false}
              onClick={() => setPhase('open')}
              className="inline-flex h-10 items-center gap-2 rounded-full px-4 font-medium text-sm outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:size-4"
            >
              {icon}
              {label}
            </button>
          )}
          {(phase === 'open' || phase === 'sending') && (
            <form
              aria-labelledby={titleId}
              onKeyDown={(event) => {
                if (event.key !== 'Escape') return
                event.stopPropagation()
                close()
              }}
              className="flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-3 p-4"
              onSubmit={async (event) => {
                event.preventDefault()
                setPhase('sending')
                try {
                  await onSubmit(new FormData(event.currentTarget))
                  setPhase('done')
                  timer.current = window.setTimeout(close, CONFIRM_MS)
                } catch {
                  setPhase('open')
                }
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <h3
                  id={titleId}
                  className="flex items-center gap-2 font-semibold animate-in fade-in slide-in-from-bottom-2 duration-(--duration-slow,300ms) motion-reduce:animate-none [&_svg]:size-4"
                >
                  {icon}
                  {label}
                </h3>
                <button
                  type="button"
                  aria-label={labels.close}
                  onClick={close}
                  className="relative flex size-7 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:after:absolute pointer-coarse:after:-inset-2"
                >
                  <XIcon aria-hidden="true" className="size-4" />
                </button>
              </div>
              <fieldset
                disabled={phase === 'sending'}
                className="flex min-w-0 flex-col gap-3 animate-in fade-in duration-(--duration-slow,300ms) motion-reduce:animate-none"
              >
                {children}
              </fieldset>
              <Button type="submit" size="sm" className="self-end" disabled={phase === 'sending'}>
                {phase === 'sending' ? labels.sending : labels.submit}
              </Button>
            </form>
          )}
          {phase === 'done' && (
            <p
              role="status"
              className="flex h-10 items-center gap-2 px-4 font-medium text-emerald-700 text-sm dark:text-emerald-400 animate-in fade-in motion-reduce:animate-none"
            >
              <CheckIcon aria-hidden="true" className="size-4" />
              {confirmation ?? labels.done}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export { MorphPopover }
