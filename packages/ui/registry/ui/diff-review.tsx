'use client'

import { CheckIcon, ChevronRightIcon, LoaderCircleIcon, Undo2Icon, XIcon } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { diffLines } from '@/components/ui/code-comparison'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export type FileDecision = 'accepted' | 'rejected'

export interface FileEdit {
  path: string
  before: string
  /** The file as the agent has written it so far. */
  after: string
  /** Still being written: it can't be decided yet. */
  streaming?: boolean
}

export interface DiffReviewLabels {
  /** Names the list of files. */
  files: string
  accept: string
  reject: string
  undo: string
  acceptAll: string
  /** Lines added and removed, read out for each file. */
  changes: (added: number, removed: number) => string
  writing: string
  decision: Record<FileDecision, string>
}

export const defaultDiffReviewLabels: DiffReviewLabels = {
  files: 'Changed files',
  accept: 'Accept',
  reject: 'Reject',
  undo: 'Undo',
  acceptAll: 'Accept all',
  changes: (added, removed) => `${added} added, ${removed} removed`,
  writing: 'Writing…',
  decision: { accepted: 'Accepted', rejected: 'Rejected' },
}

export interface DiffReviewProps extends Omit<React.ComponentProps<'section'>, 'children'> {
  files: FileEdit[]
  /** Each file's decision, when you keep them. */
  decisions?: Record<string, FileDecision | undefined>
  /** Called with a file's new decision, or `undefined` when it is undone. */
  onDecision?: (path: string, decision: FileDecision | undefined) => void
  labels?: Partial<DiffReviewLabels>
}

/**
 * A coding agent's edits, file by file. Each file opens to its diff as it streams in, and once
 * written can be accepted or rejected, and undone. Accept all takes every file still undecided.
 */
function DiffReview({
  files,
  decisions: decisionsProp,
  onDecision,
  labels: labelsProp,
  className,
  ...props
}: DiffReviewProps) {
  const labels = useLabels('diff-review', defaultDiffReviewLabels, labelsProp)
  const [own, setOwn] = React.useState<Record<string, FileDecision | undefined>>({})
  const decisions = decisionsProp ?? own
  const decide = (path: string, decision: FileDecision | undefined) => {
    if (decisionsProp === undefined) setOwn((prev) => ({ ...prev, [path]: decision }))
    onDecision?.(path, decision)
  }
  const open = files.filter((f) => !f.streaming && !decisions[f.path])
  // Files fold once decided, unless opened or closed by hand.
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({})
  const baseId = React.useId()

  return (
    <section
      data-slot="diff-review"
      aria-label={labels.files}
      className={cn('flex flex-col gap-2 text-sm', className)}
      {...props}
    >
      {files.map((file) => {
        // A new file has no lines before, not one empty line.
        const diff = diffLines(file.before, file.after).filter(
          (l) => !(file.before === '' && l.type === 'removed' && l.content === ''),
        )
        const added = diff.filter((l) => l.type === 'added').length
        const removed = diff.filter((l) => l.type === 'removed').length
        const decision = decisions[file.path]
        const isOpen = expanded[file.path] ?? !decision
        const bodyId = `${baseId}-${file.path}`
        return (
          <div
            key={file.path}
            className={cn(
              'overflow-hidden rounded-xl border bg-card',
              decision === 'rejected' && 'opacity-60',
            )}
          >
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-2 py-1.5">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={bodyId}
                onClick={() => setExpanded((prev) => ({ ...prev, [file.path]: !isOpen }))}
                className="flex min-w-0 flex-1 basis-56 items-center gap-2 rounded-md px-1 py-1 text-left outline-none hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:min-h-11"
              >
                <ChevronRightIcon
                  aria-hidden="true"
                  className={cn(
                    'size-3.5 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none',
                    isOpen && 'rotate-90',
                  )}
                />
                <code
                  className={cn(
                    'min-w-0 flex-1 truncate font-mono text-xs',
                    decision === 'rejected' && 'line-through',
                  )}
                >
                  {file.path}
                </code>
                <span className="font-mono text-xs tabular-nums">
                  <span aria-hidden="true">
                    <span className="text-emerald-700 dark:text-emerald-400">+{added}</span>{' '}
                    <span className="text-destructive">−{removed}</span>
                  </span>
                  <span className="sr-only">, {labels.changes(added, removed)}</span>
                </span>
              </button>
              {file.streaming ? (
                <span className="ml-auto flex items-center gap-1 text-muted-foreground text-xs">
                  <LoaderCircleIcon
                    aria-hidden="true"
                    className="size-3.5 animate-spin motion-reduce:animate-none"
                  />
                  {labels.writing}
                </span>
              ) : decision ? (
                <span className="ml-auto flex items-center gap-1.5 text-xs">
                  <span
                    className={
                      decision === 'accepted'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-muted-foreground'
                    }
                  >
                    {labels.decision[decision]}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2"
                    onClick={() => {
                      decide(file.path, undefined)
                    }}
                  >
                    <Undo2Icon aria-hidden="true" />
                    {labels.undo}
                  </Button>
                </span>
              ) : (
                <span className="ml-auto flex gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2"
                    onClick={() => {
                      decide(file.path, 'rejected')
                    }}
                  >
                    <XIcon aria-hidden="true" />
                    {labels.reject}
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => {
                      decide(file.path, 'accepted')
                    }}
                  >
                    <CheckIcon aria-hidden="true" />
                    {labels.accept}
                  </Button>
                </span>
              )}
            </div>
            <pre
              id={bodyId}
              hidden={!isOpen}
              className="max-h-72 overflow-auto border-t py-1.5 font-mono text-xs leading-5"
            >
              {diff.map((line, i) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: lines are positional
                  key={i}
                  className={cn(
                    'flex gap-3 px-3',
                    line.type === 'added' &&
                      'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300',
                    line.type === 'removed' && 'bg-destructive/10 text-destructive',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="w-3 shrink-0 select-none text-muted-foreground"
                  >
                    {line.type === 'added' ? '+' : line.type === 'removed' ? '−' : ' '}
                  </span>
                  {line.type !== 'unchanged' && (
                    <span className="sr-only">{line.type === 'added' ? '+' : '−'}</span>
                  )}
                  <span className="whitespace-pre">{line.content || ' '}</span>
                </div>
              ))}
            </pre>
          </div>
        )
      })}
      {open.length > 1 && (
        <Button
          size="sm"
          className="self-end"
          onClick={() => {
            for (const file of open) decide(file.path, 'accepted')
          }}
        >
          <CheckIcon aria-hidden="true" />
          {labels.acceptAll}
        </Button>
      )}
    </section>
  )
}

export { DiffReview }
