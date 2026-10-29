'use client'

import { CheckIcon, RotateCcwIcon, SparklesIcon, XIcon } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface WordChange {
  type: 'same' | 'added' | 'removed'
  text: string
}

/** The words of `before` and `after`, each kept, added or removed, spaces included. */
export function diffWords(before: string, after: string): WordChange[] {
  const a = before.split(/(\s+)/).filter(Boolean)
  const b = after.split(/(\s+)/).filter(Boolean)
  // shortcut: an LCS table, fine for a selection; Myers for whole documents.
  const table = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      (table[i] as number[])[j] =
        a[i] === b[j]
          ? ((table[i + 1] as number[])[j + 1] as number) + 1
          : Math.max(
              (table[i + 1] as number[])[j] as number,
              (table[i] as number[])[j + 1] as number,
            )
  const out: WordChange[] = []
  const push = (type: WordChange['type'], text: string) => {
    const last = out.at(-1)
    if (last?.type === type) last.text += text
    else out.push({ type, text })
  }
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      push('same', a[i] as string)
      i++
      j++
    } else if (
      ((table[i + 1] as number[])[j] as number) >= ((table[i] as number[])[j + 1] as number)
    )
      push('removed', a[i++] as string)
    else push('added', b[j++] as string)
  }
  while (i < a.length) push('removed', a[i++] as string)
  while (j < b.length) push('added', b[j++] as string)
  return out
}

export interface RewriteSelectionLabels {
  /** Names the text box. */
  text: string
  /** Names the instruction field. */
  instruction: string
  placeholder: string
  rewrite: string
  accept: string
  discard: string
  retry: string
  writing: string
  /** Read out before the changes. */
  review: string
  added: string
  removed: string
}

export const defaultRewriteSelectionLabels: RewriteSelectionLabels = {
  text: 'Text. Select words to rewrite them.',
  instruction: 'How to rewrite the selection',
  placeholder: 'Rewrite the selection…',
  rewrite: 'Rewrite',
  accept: 'Accept',
  discard: 'Discard',
  retry: 'Try again',
  writing: 'Rewriting…',
  review: 'Review the rewrite',
  added: 'added',
  removed: 'removed',
}

type Phase =
  | { phase: 'edit' }
  | { phase: 'writing' | 'review'; start: number; end: number; instruction: string; result: string }

export interface RewriteSelectionProps
  extends Omit<React.ComponentProps<'div'>, 'children' | 'defaultValue'> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** Rewrites `text` as asked: return the new text, or stream it in pieces. */
  rewrite: (text: string, instruction: string) => string | Promise<string> | AsyncIterable<string>
  /** Instructions offered as chips, such as "Shorter" or "More formal". */
  suggestions?: string[]
  labels?: Partial<RewriteSelectionLabels>
}

/**
 * A text to edit where any selection can be rewritten by AI. Select some words, say how, and
 * the rewrite streams in place as a word-level diff, struck out and added, to accept, discard
 * or try again.
 */
function RewriteSelection({
  value,
  defaultValue = '',
  onValueChange,
  rewrite,
  suggestions = [],
  labels: labelsProp,
  className,
  ...props
}: RewriteSelectionProps) {
  const labels = useLabels('rewrite-selection', defaultRewriteSelectionLabels, labelsProp)
  const [own, setOwn] = React.useState(defaultValue)
  const text = value ?? own
  const [selection, setSelection] = React.useState<[number, number]>([0, 0])
  const [instruction, setInstruction] = React.useState('')
  const [state, setState] = React.useState<Phase>({ phase: 'edit' })
  const run = React.useRef(0)
  const field = React.useRef<HTMLTextAreaElement>(null)

  const set = (next: string) => {
    if (value === undefined) setOwn(next)
    onValueChange?.(next)
  }

  const go = async (start: number, end: number, how: string) => {
    if (!how.trim() || end <= start) return
    const id = ++run.current
    const base = { start, end, instruction: how }
    setState({ phase: 'writing', ...base, result: '' })
    const answer = rewrite(text.slice(start, end), how)
    let result = ''
    if (typeof answer === 'object' && answer !== null && Symbol.asyncIterator in answer) {
      for await (const piece of answer) {
        if (id !== run.current) return
        result += piece
        setState({ phase: 'writing', ...base, result })
      }
    } else result = await answer
    if (id === run.current) setState({ phase: 'review', ...base, result })
  }

  const [start, end] = selection
  const selected = state.phase === 'edit' && end > start

  if (state.phase !== 'edit') {
    const changes = diffWords(text.slice(state.start, state.end), state.result)
    return (
      <div
        data-slot="rewrite-selection"
        className={cn('flex flex-col gap-2', className)}
        {...props}
      >
        <div
          aria-busy={state.phase === 'writing'}
          className="min-h-16 whitespace-pre-wrap rounded-lg border bg-background px-3 py-2 text-base md:text-sm"
        >
          <span className="sr-only">{labels.review}: </span>
          {text.slice(0, state.start)}
          {changes.map((change, i) =>
            change.type === 'same' ? (
              // biome-ignore lint/suspicious/noArrayIndexKey: changes are positional
              <React.Fragment key={i}>{change.text}</React.Fragment>
            ) : change.type === 'removed' ? (
              // biome-ignore lint/suspicious/noArrayIndexKey: changes are positional
              <del key={i} className="bg-destructive/10 text-destructive decoration-destructive/60">
                <span className="sr-only">[{labels.removed}: </span>
                {change.text}
                <span className="sr-only">]</span>
              </del>
            ) : (
              <ins
                // biome-ignore lint/suspicious/noArrayIndexKey: changes are positional
                key={i}
                className="bg-emerald-500/15 text-emerald-800 no-underline dark:text-emerald-300"
              >
                <span className="sr-only">[{labels.added}: </span>
                {change.text}
                <span className="sr-only">]</span>
              </ins>
            ),
          )}
          {text.slice(state.end)}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {state.phase === 'writing' ? (
            <p role="status" className="mr-auto text-muted-foreground text-sm">
              {labels.writing}
            </p>
          ) : null}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              run.current++
              setState({ phase: 'edit' })
            }}
          >
            <XIcon aria-hidden="true" />
            {labels.discard}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={state.phase === 'writing'}
            onClick={() => go(state.start, state.end, state.instruction)}
          >
            <RotateCcwIcon aria-hidden="true" />
            {labels.retry}
          </Button>
          <Button
            size="sm"
            disabled={state.phase === 'writing'}
            onClick={() => {
              set(text.slice(0, state.start) + state.result + text.slice(state.end))
              setSelection([state.start, state.start + state.result.length])
              setState({ phase: 'edit' })
            }}
          >
            <CheckIcon aria-hidden="true" />
            {labels.accept}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div data-slot="rewrite-selection" className={cn('flex flex-col gap-2', className)} {...props}>
      <textarea
        ref={field}
        aria-label={labels.text}
        value={text}
        onChange={(event) => set(event.target.value)}
        onSelect={(event) =>
          setSelection([event.currentTarget.selectionStart, event.currentTarget.selectionEnd])
        }
        className="field-sizing-content min-h-16 w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-base shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
      />
      {selected && (
        <form
          className="flex flex-col gap-2 rounded-lg border bg-popover p-2 shadow-sm animate-in fade-in slide-in-from-top-1 motion-reduce:animate-none"
          onSubmit={(event) => {
            event.preventDefault()
            void go(start, end, instruction)
          }}
        >
          <div className="flex items-center gap-2">
            <SparklesIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            <input
              aria-label={labels.instruction}
              placeholder={labels.placeholder}
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
              className="h-8 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground pointer-coarse:h-11 md:text-sm"
            />
            <Button type="submit" size="sm" disabled={!instruction.trim()}>
              {labels.rewrite}
            </Button>
          </div>
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setInstruction(s)
                    void go(start, end, s)
                  }}
                  className="relative rounded-full border px-2.5 py-1 text-xs outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:after:absolute pointer-coarse:after:-inset-y-2"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </form>
      )}
    </div>
  )
}

export { RewriteSelection }
