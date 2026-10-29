'use client'

import { CheckIcon, ChevronRightIcon, CircleIcon, LoaderCircleIcon, XIcon } from 'lucide-react'
import * as React from 'react'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export type AgentStepStatus = 'pending' | 'running' | 'done' | 'error'

export interface AgentStep {
  id: string
  label: string
  status: AgentStepStatus
  /** A line under the label: what it found, or why it failed. */
  detail?: string
  /** Lines of its live log, newest last. */
  log?: string[]
}

export interface AgentStepsLabels {
  /** Names the list of steps. */
  steps: string
  /** The heading while it works, with the time so far. */
  working: (elapsed: string) => string
  /** The heading when it is over, with how long it took. */
  finished: (elapsed: string) => string
  /** Read out with each step's label. */
  status: Record<AgentStepStatus, string>
  log: string
}

export const defaultAgentStepsLabels: AgentStepsLabels = {
  steps: 'Steps',
  working: (elapsed) => `Working… ${elapsed}`,
  finished: (elapsed) => `Done in ${elapsed}`,
  status: { pending: 'To do', running: 'In progress', done: 'Done', error: 'Failed' },
  log: 'Log',
}

const elapsedText = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000))
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`
}

export interface AgentStepsProps extends Omit<React.ComponentProps<'section'>, 'children'> {
  steps: AgentStep[]
  /** When the run began, as `Date.now()`. The time counts up from it while a step runs. */
  startedAt?: number
  /** When it ended; leave out while it runs. */
  endedAt?: number
  /** Shown once every step is done: what came of it. */
  summary?: React.ReactNode
  labels?: Partial<AgentStepsLabels>
}

/**
 * An agent's progress as a list of steps: each one waits, runs with a spinner, then ticks or
 * fails. The running step shows its live log, the heading counts the time, and a summary takes
 * over once it is done. Screen readers hear each step as it starts and ends.
 */
function AgentSteps({
  steps,
  startedAt,
  endedAt,
  summary,
  labels: labelsProp,
  className,
  ...props
}: AgentStepsProps) {
  const labels = useLabels('agent-steps', defaultAgentStepsLabels, labelsProp)
  const running = steps.some((s) => s.status === 'running')
  const finished =
    steps.length > 0 && steps.every((s) => s.status === 'done' || s.status === 'error')
  const [now, setNow] = React.useState(() => Date.now())
  React.useEffect(() => {
    if (!running || endedAt) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [running, endedAt])
  const elapsed = startedAt === undefined ? undefined : elapsedText((endedAt ?? now) - startedAt)
  const current = steps.find((s) => s.status === 'running')

  return (
    <section
      data-slot="agent-steps"
      aria-label={labels.steps}
      className={cn('flex flex-col gap-3 rounded-xl border bg-card p-4 text-sm', className)}
      {...props}
    >
      {elapsed && (
        <p className="flex items-center gap-2 font-medium">
          {finished ? labels.finished(elapsed) : labels.working(elapsed)}
        </p>
      )}
      <ol className="flex flex-col">
        {steps.map((step, i) => (
          <li key={step.id} className="relative flex gap-3 pb-3 last:pb-0">
            {/* The line down to the next step. */}
            {i < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute top-6 bottom-0 left-[9px] w-px',
                  step.status === 'done' ? 'bg-primary/40' : 'bg-border',
                )}
              />
            )}
            <StatusIcon status={step.status} />
            <div className="min-w-0 flex-1 pt-px">
              <p
                className={cn(
                  step.status === 'pending' && 'text-muted-foreground',
                  step.status === 'running' && 'font-medium',
                )}
              >
                {step.label}
                <span className="sr-only">, {labels.status[step.status]}</span>
              </p>
              {step.detail && (
                <p
                  className={cn(
                    'mt-0.5 text-xs',
                    step.status === 'error' ? 'text-destructive' : 'text-muted-foreground',
                  )}
                >
                  {step.detail}
                </p>
              )}
              {step.log && step.log.length > 0 && (
                <details open={step.status === 'running'} className="group mt-1.5">
                  <summary className="relative flex w-fit cursor-pointer list-none items-center gap-1 rounded text-muted-foreground text-xs outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:after:absolute pointer-coarse:after:-inset-y-3 [&::-webkit-details-marker]:hidden">
                    <ChevronRightIcon
                      aria-hidden="true"
                      className="size-3 transition-transform group-open:rotate-90 motion-reduce:transition-none"
                    />
                    {labels.log}
                  </summary>
                  <pre className="mt-1.5 max-h-32 overflow-auto rounded-md bg-muted px-2.5 py-2 font-mono text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {step.log.join('\n')}
                  </pre>
                </details>
              )}
            </div>
          </li>
        ))}
      </ol>
      {finished && summary && <div className="border-t pt-3">{summary}</div>}
      <p className="sr-only" aria-live="polite">
        {current
          ? `${current.label}, ${labels.status.running}`
          : finished && elapsed
            ? labels.finished(elapsed)
            : ''}
      </p>
    </section>
  )
}

function StatusIcon({ status }: { status: AgentStepStatus }) {
  const common = 'relative z-10 flex size-[19px] shrink-0 items-center justify-center rounded-full'
  if (status === 'running')
    return (
      <span className={cn(common, 'bg-background text-primary')}>
        <LoaderCircleIcon
          aria-hidden="true"
          className="size-4 animate-spin motion-reduce:animate-none"
        />
      </span>
    )
  if (status === 'done')
    return (
      <span className={cn(common, 'bg-primary text-primary-foreground')}>
        <CheckIcon aria-hidden="true" className="size-3" strokeWidth={3} />
      </span>
    )
  if (status === 'error')
    return (
      <span className={cn(common, 'bg-destructive text-white')}>
        <XIcon aria-hidden="true" className="size-3" strokeWidth={3} />
      </span>
    )
  return (
    <span className={cn(common, 'bg-background text-border')}>
      <CircleIcon aria-hidden="true" className="size-[19px]" />
    </span>
  )
}

export { AgentSteps }
