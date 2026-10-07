'use client'

import * as React from 'react'
import { CopyButton } from '@/components/ui/copy-button'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface CodeComparisonLabels {
  /** Label for the before code pane. */
  before: string
  /** Label for the after code pane. */
  after: string
  /** Tooltip label for copying code. */
  copy: string
  /** Feedback message when code is copied. */
  copied: string
}

export const defaultCodeComparisonLabels: CodeComparisonLabels = {
  before: 'Before',
  after: 'After',
  copy: 'Copy code',
  copied: 'Copied',
}

export type DiffType = 'unchanged' | 'added' | 'removed'

export interface DiffLine {
  type: DiffType
  content: string
  beforeLineNumber?: number
  afterLineNumber?: number
}

// ponytail: LCS O(n·m), suficiente para snippets; Myers si alguien pega archivos de miles de líneas.
export function diffLines(before: string, after: string): DiffLine[] {
  const lines1 = before.split('\n')
  const lines2 = after.split('\n')
  const n = lines1.length
  const m = lines2.length

  const dp: number[] = new Array((n + 1) * (m + 1)).fill(0)
  const get = (row: number, col: number) => dp[row * (m + 1) + col] ?? 0
  const set = (row: number, col: number, val: number) => {
    dp[row * (m + 1) + col] = val
  }

  for (let i = 1; i <= n; i++) {
    const l1 = lines1[i - 1] ?? ''
    for (let j = 1; j <= m; j++) {
      const l2 = lines2[j - 1] ?? ''
      if (l1 === l2) {
        set(i, j, get(i - 1, j - 1) + 1)
      } else {
        set(i, j, Math.max(get(i - 1, j), get(i, j - 1)))
      }
    }
  }

  const result: DiffLine[] = []
  let i = n
  let j = m

  while (i > 0 || j > 0) {
    const l1 = i > 0 ? (lines1[i - 1] ?? '') : ''
    const l2 = j > 0 ? (lines2[j - 1] ?? '') : ''

    if (i > 0 && j > 0 && l1 === l2) {
      result.unshift({
        type: 'unchanged',
        content: l1,
        beforeLineNumber: i,
        afterLineNumber: j,
      })
      i--
      j--
    } else if (j > 0 && (i === 0 || get(i, j - 1) >= get(i - 1, j))) {
      result.unshift({
        type: 'added',
        content: l2,
        afterLineNumber: j,
      })
      j--
    } else if (i > 0) {
      result.unshift({
        type: 'removed',
        content: l1,
        beforeLineNumber: i,
      })
      i--
    }
  }

  return result
}

export interface CodeComparisonProps extends React.ComponentProps<'div'> {
  /** Original code string. */
  before: string
  /** Modified code string. */
  after: string
  /** Label or filename for the before snippet. Default 'Before'. */
  beforeLabel?: string
  /** Label or filename for the after snippet. Default 'After'. */
  afterLabel?: string
  /** Programming language identifier. Default 'typescript'. */
  language?: string
  /** Optional custom syntax highlighter per line. */
  highlight?: (code: string, lang?: string) => string[]
  /** Layout mode: split side-by-side or unified vertical diff. Default 'split'. */
  mode?: 'split' | 'unified'
  /** Focus mode: dims and blurs unchanged lines until the user hovers the container. Default false. */
  focus?: boolean
}

/**
 * Side-by-side or unified code difference comparison using longest common subsequence (LCS).
 */
function CodeComparison({
  before,
  after,
  beforeLabel,
  afterLabel,
  language = 'typescript',
  highlight,
  mode = 'split',
  focus = false,
  className,
  ...props
}: CodeComparisonProps) {
  const labels = useLabels('code-comparison', defaultCodeComparisonLabels)
  const diff = React.useMemo(() => diffLines(before, after), [before, after])

  const beforeHighlighted = React.useMemo(
    () => (highlight ? highlight(before, language) : null),
    [before, language, highlight],
  )
  const afterHighlighted = React.useMemo(
    () => (highlight ? highlight(after, language) : null),
    [after, language, highlight],
  )

  const bLabel = beforeLabel || labels.before
  const aLabel = afterLabel || labels.after

  if (mode === 'unified') {
    return (
      <div
        data-slot="code-comparison"
        data-mode="unified"
        className={cn(
          'group/comp relative w-full overflow-hidden rounded-xl border border-border bg-card font-mono text-xs shadow-xs',
          className,
        )}
        {...props}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2.5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="font-semibold text-foreground">{bLabel}</span>
            <span>→</span>
            <span className="font-semibold text-foreground">{aLabel}</span>
            {language && (
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground uppercase">
                {language}
              </span>
            )}
          </div>
          <CopyButton value={after} />
        </div>

        {/* Unified diff list */}
        <div className="overflow-x-auto p-2">
          <table className="w-full border-collapse">
            <tbody>
              {diff.map((line, idx) => {
                const isUnchanged = line.type === 'unchanged'
                const isAdded = line.type === 'added'
                const isRemoved = line.type === 'removed'

                return (
                  <tr
                    // biome-ignore lint/suspicious/noArrayIndexKey: lines are positional
                    key={idx}
                    className={cn(
                      'leading-6 transition-all duration-150',
                      isAdded && 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
                      isRemoved && 'bg-red-500/10 text-red-700 dark:text-red-300',
                      isUnchanged &&
                        focus &&
                        'opacity-40 blur-[0.3px] group-hover/comp:opacity-100 group-hover/comp:filter-none',
                    )}
                  >
                    <td className="w-8 select-none pr-2 text-right text-muted-foreground/50">
                      {line.beforeLineNumber ?? ''}
                    </td>
                    <td className="w-8 select-none pr-3 text-right text-muted-foreground/50">
                      {line.afterLineNumber ?? ''}
                    </td>
                    <td className="w-4 select-none text-center font-bold">
                      {isAdded ? '+' : isRemoved ? '-' : ' '}
                    </td>
                    <td className="whitespace-pre pl-1 text-foreground">{line.content || ' '}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // Split mode: 2 panes side-by-side on md+, stacked on mobile
  const beforeLines = before.split('\n')
  const afterLines = after.split('\n')

  return (
    <div
      data-slot="code-comparison"
      data-mode="split"
      className={cn(
        'group/comp relative w-full overflow-hidden rounded-xl border border-border bg-card font-mono text-xs shadow-xs',
        className,
      )}
      {...props}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
        {/* Left pane: Before */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3.5 py-2">
            <span className="font-semibold text-foreground truncate">{bLabel}</span>
            <CopyButton value={before} />
          </div>
          <div className="overflow-x-auto p-2 flex-1">
            <table className="w-full border-collapse">
              <tbody>
                {beforeLines.map((lineText, idx) => {
                  const lineNum = idx + 1
                  const diffMatch = diff.find(
                    (d) => d.beforeLineNumber === lineNum && d.type === 'removed',
                  )
                  const isRemoved = Boolean(diffMatch)

                  return (
                    <tr
                      // biome-ignore lint/suspicious/noArrayIndexKey: lines are positional
                      key={idx}
                      className={cn(
                        'leading-6 transition-all duration-150',
                        isRemoved
                          ? 'bg-red-500/10 text-red-700 dark:text-red-300'
                          : focus
                            ? 'opacity-40 blur-[0.3px] group-hover/comp:opacity-100 group-hover/comp:filter-none'
                            : '',
                      )}
                    >
                      <td className="w-8 select-none pr-3 text-right text-muted-foreground/50">
                        {lineNum}
                      </td>
                      <td className="whitespace-pre pl-1 text-foreground">
                        {beforeHighlighted ? (
                          <span
                            // biome-ignore lint/security/noDangerouslySetInnerHtml: highlighter output the app passes in, documented as trusted
                            dangerouslySetInnerHTML={{
                              __html: beforeHighlighted[idx] || lineText,
                            }}
                          />
                        ) : (
                          lineText || ' '
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right pane: After */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3.5 py-2">
            <span className="font-semibold text-foreground truncate">{aLabel}</span>
            <CopyButton value={after} />
          </div>
          <div className="overflow-x-auto p-2 flex-1">
            <table className="w-full border-collapse">
              <tbody>
                {afterLines.map((lineText, idx) => {
                  const lineNum = idx + 1
                  const diffMatch = diff.find(
                    (d) => d.afterLineNumber === lineNum && d.type === 'added',
                  )
                  const isAdded = Boolean(diffMatch)

                  return (
                    <tr
                      // biome-ignore lint/suspicious/noArrayIndexKey: lines are positional
                      key={idx}
                      className={cn(
                        'leading-6 transition-all duration-150',
                        isAdded
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                          : focus
                            ? 'opacity-40 blur-[0.3px] group-hover/comp:opacity-100 group-hover/comp:filter-none'
                            : '',
                      )}
                    >
                      <td className="w-8 select-none pr-3 text-right text-muted-foreground/50">
                        {lineNum}
                      </td>
                      <td className="whitespace-pre pl-1 text-foreground">
                        {afterHighlighted ? (
                          <span
                            // biome-ignore lint/security/noDangerouslySetInnerHtml: highlighter output the app passes in, documented as trusted
                            dangerouslySetInnerHTML={{
                              __html: afterHighlighted[idx] || lineText,
                            }}
                          />
                        ) : (
                          lineText || ' '
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export { CodeComparison }
