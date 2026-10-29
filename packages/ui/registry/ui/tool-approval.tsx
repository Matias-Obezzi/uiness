'use client'

import {
  CheckIcon,
  ChevronRightIcon,
  LoaderCircleIcon,
  ShieldAlertIcon,
  WrenchIcon,
  XIcon,
} from 'lucide-react'
import type * as React from 'react'
import { Button } from '@/components/ui/button'
import { HoldToConfirm } from '@/components/ui/hold-to-confirm'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export type ToolCallStatus = 'pending' | 'running' | 'done' | 'denied' | 'error'

export interface ToolCall {
  id: string
  /** The tool's name, such as `delete_file`. */
  name: string
  /** What it was called with: an object is shown as JSON. */
  args?: unknown
  /** Can't be taken back: approving it takes a press and hold. */
  destructive?: boolean
  status: ToolCallStatus
  /** What it returned, shown in the trace once it ran. */
  output?: React.ReactNode
}

export interface ToolApprovalLabels {
  /** Names the list. */
  calls: string
  /** The question over a call waiting for a decision. */
  ask: (name: string) => string
  approve: string
  deny: string
  /** Under a destructive call. */
  destructive: string
  status: Record<ToolCallStatus, string>
}

export const defaultToolApprovalLabels: ToolApprovalLabels = {
  calls: 'Tool calls',
  ask: (name) => `Allow ${name}?`,
  approve: 'Approve',
  deny: 'Deny',
  destructive: 'This can’t be undone. Hold to approve.',
  status: {
    pending: 'Waiting',
    running: 'Running',
    done: 'Done',
    denied: 'Denied',
    error: 'Failed',
  },
}

const showArgs = (args: unknown) =>
  typeof args === 'string' ? args : JSON.stringify(args, null, 2)

export interface ToolApprovalProps extends Omit<React.ComponentProps<'section'>, 'children'> {
  calls: ToolCall[]
  onApprove: (id: string) => void
  onDeny: (id: string) => void
  labels?: Partial<ToolApprovalLabels>
}

/**
 * The tool calls an agent wants to make, for a person to approve or deny. A call waiting for a
 * decision shows its arguments; a destructive one needs a press and hold to approve. Decided
 * calls fold into a trace, each one opening to its arguments and output.
 */
function ToolApproval({
  calls,
  onApprove,
  onDeny,
  labels: labelsProp,
  className,
  ...props
}: ToolApprovalProps) {
  const labels = useLabels('tool-approval', defaultToolApprovalLabels, labelsProp)
  return (
    <section
      data-slot="tool-approval"
      aria-label={labels.calls}
      className={cn('flex flex-col gap-2 text-sm', className)}
      {...props}
    >
      {calls.map((call) =>
        call.status === 'pending' ? (
          <fieldset
            key={call.id}
            aria-label={labels.ask(call.name)}
            className={cn(
              'flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-3.5',
              call.destructive && 'border-destructive/40',
            )}
          >
            <p className="flex items-center gap-2 font-medium">
              {call.destructive ? (
                <ShieldAlertIcon aria-hidden="true" className="size-4 text-destructive" />
              ) : (
                <WrenchIcon aria-hidden="true" className="size-4 text-muted-foreground" />
              )}
              {labels.ask(call.name)}
            </p>
            {call.args !== undefined && <Args args={call.args} />}
            {call.destructive && (
              <p className="text-muted-foreground text-xs">{labels.destructive}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => onDeny(call.id)}>
                {labels.deny}
              </Button>
              {call.destructive ? (
                <HoldToConfirm size="sm" onConfirm={() => onApprove(call.id)} resetAfter={false}>
                  {labels.approve}
                </HoldToConfirm>
              ) : (
                <Button size="sm" onClick={() => onApprove(call.id)}>
                  {labels.approve}
                </Button>
              )}
            </div>
          </fieldset>
        ) : (
          <details key={call.id} className="group rounded-lg border bg-muted/30">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-3 py-2 outline-none hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:min-h-11 [&::-webkit-details-marker]:hidden">
              <ChevronRightIcon
                aria-hidden="true"
                className="size-3.5 shrink-0 text-muted-foreground transition-transform group-open:rotate-90 motion-reduce:transition-none"
              />
              <code className="min-w-0 flex-1 truncate font-mono text-xs">{call.name}</code>
              <TraceStatus status={call.status} label={labels.status[call.status]} />
            </summary>
            <div className="flex flex-col gap-2 border-t px-3 py-2.5">
              {call.args !== undefined && <Args args={call.args} />}
              {call.output !== undefined && (
                <div className="rounded-md bg-background px-2.5 py-2 font-mono text-xs whitespace-pre-wrap">
                  {call.output}
                </div>
              )}
            </div>
          </details>
        ),
      )}
    </section>
  )
}

function Args({ args }: { args: unknown }) {
  return (
    <pre className="max-h-40 overflow-auto rounded-md bg-muted px-2.5 py-2 font-mono text-xs leading-relaxed">
      {showArgs(args)}
    </pre>
  )
}

function TraceStatus({ status, label }: { status: ToolCallStatus; label: string }) {
  const icon =
    status === 'running' ? (
      <LoaderCircleIcon className="size-3.5 animate-spin motion-reduce:animate-none" />
    ) : status === 'done' ? (
      <CheckIcon className="size-3.5" />
    ) : (
      <XIcon className="size-3.5" />
    )
  return (
    <span
      className={cn(
        'flex shrink-0 items-center gap-1 text-xs',
        status === 'done' && 'text-muted-foreground',
        (status === 'denied' || status === 'error') && 'text-destructive',
      )}
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </span>
  )
}

export { ToolApproval }
