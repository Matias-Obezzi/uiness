'use client'

import * as React from 'react'
import { Slider } from '@/components/ui/slider'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface LaneEvent {
  id: string
  /** The tool call, such as `search("pricing")`. */
  label: string
  /** Milliseconds from the start of the run. */
  start: number
  /** Leave out while it runs. */
  end?: number
  failed?: boolean
}

export interface AgentLane {
  id: string
  name: string
  /** The lead agent hands work out; the others are its sub-agents. */
  lead?: boolean
  events: LaneEvent[]
}

export interface AgentLanesLabels {
  /** Names the scrubber. */
  scrub: string
  /** Heads what was running at the scrubbed moment. */
  runningAt: (time: string) => string
  idle: string
  live: string
}

export const defaultAgentLanesLabels: AgentLanesLabels = {
  scrub: 'Run time',
  runningAt: (time) => `Running at ${time}`,
  idle: 'Nothing running',
  live: 'Live',
}

const seconds = (ms: number) => `${(ms / 1000).toFixed(1)}s`

export interface AgentLanesProps extends Omit<React.ComponentProps<'section'>, 'children'> {
  lanes: AgentLane[]
  /** How long the run has gone on, in milliseconds. */
  duration: number
  labels?: Partial<AgentLanesLabels>
}

/**
 * A lead agent and the sub-agents it hands work to, side by side: each gets a lane of its tool
 * calls on one timeline. Scrub back through the run to see what each was doing at any moment;
 * let go at the end and it follows the run live.
 */
function AgentLanes({ lanes, duration, labels: labelsProp, className, ...props }: AgentLanesProps) {
  const labels = useLabels('agent-lanes', defaultAgentLanesLabels, labelsProp)
  // Null follows the end of the run.
  const [scrubbed, setScrubbed] = React.useState<number | null>(null)
  const total = Math.max(duration, 1)
  const at = scrubbed === null ? duration : Math.min(scrubbed, duration)
  const live = scrubbed === null || scrubbed >= duration
  const share = (ms: number) => `${(Math.min(ms, total) / total) * 100}%`
  const running = lanes.flatMap((lane) =>
    lane.events
      .filter((e) => e.start <= at && (e.end === undefined || e.end > at))
      .map((e) => ({ lane, event: e })),
  )

  return (
    <section
      data-slot="agent-lanes"
      className={cn('flex flex-col gap-3 text-sm', className)}
      {...props}
    >
      <div className="flex flex-col gap-2">
        {lanes.map((lane) => (
          <div
            key={lane.id}
            className={cn('grid grid-cols-[6rem_1fr] items-center gap-3', !lane.lead && 'pl-3')}
          >
            <p
              className={cn(
                'truncate text-xs',
                lane.lead ? 'font-semibold' : 'text-muted-foreground',
              )}
            >
              {lane.name}
            </p>
            <div className="relative h-6 rounded-md bg-muted/60">
              {lane.events
                .filter((e) => e.start <= at)
                .map((e) => {
                  const end = e.end === undefined || e.end > at ? at : e.end
                  const active = e.end === undefined || e.end > at
                  return (
                    <span
                      key={e.id}
                      title={e.label}
                      className={cn(
                        'absolute inset-y-1 min-w-1 rounded-sm',
                        e.failed ? 'bg-destructive/70' : lane.lead ? 'bg-primary' : 'bg-primary/60',
                        active && 'animate-pulse motion-reduce:animate-none',
                      )}
                      style={{
                        left: share(e.start),
                        width: `calc(${share(end)} - ${share(e.start)})`,
                      }}
                    />
                  )
                })}
              <span
                aria-hidden="true"
                className="absolute inset-y-0 w-px bg-foreground/50"
                style={{ left: share(at) }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Slider
          aria-label={labels.scrub}
          min={0}
          max={total}
          step={100}
          value={[at]}
          onValueChange={([value]) =>
            setScrubbed(value === undefined || value >= duration ? null : value)
          }
          className="flex-1"
        />
        <span className="w-12 shrink-0 text-right font-mono text-muted-foreground text-xs tabular-nums">
          {live ? labels.live : seconds(at)}
        </span>
      </div>

      <div className="rounded-lg border bg-card p-3" aria-live={live ? 'off' : 'polite'}>
        <p className="mb-1.5 text-muted-foreground text-xs">{labels.runningAt(seconds(at))}</p>
        {running.length ? (
          <ul className="flex flex-col gap-1">
            {running.map(({ lane, event }) => (
              <li key={event.id} className="flex gap-2 text-xs">
                <span className="w-24 shrink-0 truncate text-muted-foreground">{lane.name}</span>
                <code className="min-w-0 truncate font-mono">{event.label}</code>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs">{labels.idle}</p>
        )}
      </div>
    </section>
  )
}

export { AgentLanes }
