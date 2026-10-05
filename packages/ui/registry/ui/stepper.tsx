'use client'

import { CheckIcon, XIcon } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'

export type StepStatus = 'complete' | 'current' | 'upcoming' | 'error'

interface StepperContextValue {
  value: number
  count: number
  orientation: 'horizontal' | 'vertical'
  clickable: 'complete' | 'all' | false
  onValueChange?: (value: number) => void
}

const StepperContext = React.createContext<StepperContextValue | null>(null)
const StepIndexContext = React.createContext(0)

function useStepper() {
  const context = React.useContext(StepperContext)
  if (!context) throw new Error('StepperItem must be used within <Stepper>')
  return context
}

export interface StepperStep {
  /** The name of the step. */
  title: React.ReactNode
  /** A line under the title. */
  description?: React.ReactNode
  /** Marks the step as failed. */
  error?: boolean
  /** Replaces the number in the circle while the step is not done. */
  icon?: React.ReactNode
}

export interface StepperProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** The current step, from 0. Steps before it are done. Equal to the number of steps when all are. */
  value: number
  /** Called with the step a person clicked, when steps are clickable. */
  onValueChange?: (value: number) => void
  /** `horizontal` lays the steps in a row, `vertical` in a column with room for content. Default `horizontal`. */
  orientation?: 'horizontal' | 'vertical'
  /**
   * Which steps are buttons that go back to them: `complete` for the done ones, `all` for every
   * step, `false` for none. Needs `onValueChange`. Default `complete`.
   */
  clickable?: 'complete' | 'all' | false
  /** The steps as data, instead of `StepperItem` children. */
  steps?: StepperStep[]
  /** `StepperItem` elements, one per step. */
  children?: React.ReactNode
}

/**
 * Where someone is in a flow of several steps. Done steps show a check, the current one is
 * marked for assistive tech, and the line to each step fills as it is reached.
 */
function Stepper({
  value,
  onValueChange,
  orientation = 'horizontal',
  clickable = 'complete',
  steps,
  children,
  className,
  ...props
}: StepperProps) {
  const items = steps
    ? steps.map((step, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: steps are positions in a flow
        <StepperItem key={i} {...step} />
      ))
    : React.Children.toArray(children).filter(React.isValidElement)

  const context = React.useMemo(
    () => ({ value, count: items.length, orientation, clickable, onValueChange }),
    [value, items.length, orientation, clickable, onValueChange],
  )

  const horizontal = orientation === 'horizontal'
  const shown = Math.min(value, items.length - 1)
  const currentTitle = (items[shown]?.props as StepperItemProps | undefined)?.title

  return (
    <StepperContext.Provider value={context}>
      <div
        data-slot="stepper"
        data-orientation={orientation}
        className={cn(horizontal && '@container w-full', className)}
        {...props}
      >
        <ol
          data-slot="stepper-list"
          data-orientation={orientation}
          className={cn('flex', horizontal ? 'items-start' : 'flex-col')}
        >
          {items.map((item, i) => (
            <StepIndexContext.Provider key={item.key ?? i} value={i}>
              {item}
            </StepIndexContext.Provider>
          ))}
        </ol>
        {horizontal && items.length > 0 && (
          // A narrow row has no room for titles, so the current one is spelled out under it.
          // The list already says it to assistive tech.
          <p
            aria-hidden="true"
            className="mt-3 flex min-w-0 items-baseline gap-2 text-sm @xl:hidden"
          >
            <span className="truncate font-medium">{currentTitle}</span>
            <span className="shrink-0 text-muted-foreground text-xs tabular-nums">
              Step {shown + 1} of {items.length}
            </span>
          </p>
        )}
      </div>
    </StepperContext.Provider>
  )
}

export interface StepperItemProps extends Omit<React.ComponentProps<'li'>, 'title'>, StepperStep {
  /** Overrides the status worked out from the stepper's `value`. */
  status?: StepStatus
  /** Content shown under a vertical step, such as the form for the current step. */
  children?: React.ReactNode
}

const statusLabel: Record<StepStatus, string> = {
  complete: 'completed',
  current: 'current step',
  upcoming: 'not started',
  error: 'has an error',
}

function StepperItem({
  title,
  description,
  error,
  icon,
  status: statusProp,
  className,
  children,
  ...props
}: StepperItemProps) {
  const { value, count, orientation, clickable, onValueChange } = useStepper()
  const index = React.useContext(StepIndexContext)
  const status: StepStatus =
    statusProp ??
    (error ? 'error' : index < value ? 'complete' : index === value ? 'current' : 'upcoming')
  const last = index === count - 1
  // The line after this step fills once the next step is reached.
  const filled = index < value
  const interactive =
    onValueChange !== undefined &&
    index !== value &&
    (clickable === 'all' || (clickable === 'complete' && status === 'complete'))
  const horizontal = orientation === 'horizontal'

  const indicator = (
    <span
      data-slot="stepper-indicator"
      data-status={status}
      className={cn(
        'relative z-(--z-raised,10) flex size-8 shrink-0 items-center justify-center rounded-full border-2 font-medium text-sm tabular-nums transition-[background-color,border-color,color] duration-(--duration-slow,300ms) motion-reduce:transition-none [&_svg]:size-4',
        'data-[status=upcoming]:border-border data-[status=upcoming]:bg-background data-[status=upcoming]:text-muted-foreground',
        'data-[status=current]:border-primary data-[status=current]:bg-background data-[status=current]:text-foreground',
        'data-[status=complete]:border-primary data-[status=complete]:bg-primary data-[status=complete]:text-primary-foreground',
        'data-[status=error]:border-destructive data-[status=error]:bg-destructive data-[status=error]:text-white',
      )}
    >
      {status === 'complete' ? (
        <CheckIcon strokeWidth={3} />
      ) : status === 'error' ? (
        <XIcon strokeWidth={3} />
      ) : (
        (icon ?? index + 1)
      )}
    </span>
  )

  const text = (
    <span
      className={cn(
        'flex min-w-0 flex-col',
        horizontal && 'text-left',
        // Narrow rows show only the circles; the stepper spells out the current step below.
        horizontal && 'hidden @xl:flex',
      )}
    >
      <span
        data-slot="stepper-title"
        className={cn(
          'font-medium text-sm leading-tight',
          horizontal && 'truncate',
          status === 'upcoming' ? 'text-muted-foreground' : 'text-foreground',
          status === 'error' && 'text-destructive',
        )}
      >
        {title}
      </span>
      {description && (
        <span
          data-slot="stepper-description"
          className={cn('mt-0.5 text-muted-foreground text-xs', horizontal && 'hidden @3xl:block')}
        >
          {description}
        </span>
      )}
    </span>
  )

  const head = (
    <>
      {indicator}
      {text}
      <span className="sr-only">, {statusLabel[status]}</span>
    </>
  )

  const headClass = cn(
    'flex min-w-0 items-center gap-3 rounded-lg text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
    !horizontal && 'items-start',
    interactive && 'cursor-pointer [&:hover_[data-slot=stepper-title]]:underline',
  )

  const line = !last && (
    <span
      aria-hidden="true"
      data-slot="stepper-line"
      className={cn(
        'relative overflow-hidden rounded-full bg-border',
        horizontal
          ? 'mx-3 mt-4 h-0.5 min-w-4 flex-1'
          : 'absolute top-10 bottom-1 left-[15px] w-0.5',
      )}
    >
      <span
        className={cn(
          'absolute inset-0 bg-primary transition-transform duration-(--duration-slower,500ms) ease-(--easing-emphasized,cubic-bezier(0.16,1,0.3,1)) motion-reduce:transition-none',
          horizontal ? 'origin-left' : 'origin-top',
          filled ? 'scale-100' : horizontal ? 'scale-x-0' : 'scale-y-0',
        )}
      />
    </span>
  )

  return (
    <li
      data-slot="stepper-item"
      data-status={status}
      aria-current={status === 'current' ? 'step' : undefined}
      className={cn(
        'relative flex',
        horizontal ? 'min-w-0 items-start' : 'gap-3 pb-8 last:pb-0',
        horizontal && !last && 'flex-1',
        className,
      )}
      {...props}
    >
      {horizontal ? (
        <>
          {interactive ? (
            <button type="button" className={headClass} onClick={() => onValueChange?.(index)}>
              {head}
            </button>
          ) : (
            <div className={headClass}>{head}</div>
          )}
          {line}
        </>
      ) : (
        <>
          {line}
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            {interactive ? (
              <button type="button" className={headClass} onClick={() => onValueChange?.(index)}>
                {head}
              </button>
            ) : (
              <div className={headClass}>{head}</div>
            )}
            {children && <div className="ps-11">{children}</div>}
          </div>
        </>
      )}
    </li>
  )
}

export { Stepper, StepperItem }
