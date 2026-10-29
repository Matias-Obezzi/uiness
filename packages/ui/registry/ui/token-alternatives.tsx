'use client'

import * as React from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface TokenOption {
  text: string
  /** How likely the model found it, from 0 to 1. */
  p: number
}

export interface AnswerToken {
  /** The token as written, spaces included. */
  text: string
  /** How likely the chosen token was. */
  p?: number
  /** What else the model weighed for this place. */
  alternatives?: TokenOption[]
}

export interface TokenAlternativesLabels {
  /** An unsure word, read out with how likely it was. */
  token: (text: string, percent: number) => string
  /** Heads the list of other words. */
  options: string
}

export const defaultTokenAlternativesLabels: TokenAlternativesLabels = {
  token: (text, percent) => `${text.trim()}, ${percent}% likely. Show alternatives`,
  options: 'Other words it weighed',
}

const percent = (p: number) => Math.round(p * 100)

export interface TokenAlternativesProps extends Omit<React.ComponentProps<'p'>, 'children'> {
  tokens: AnswerToken[]
  /** Tokens less likely than this are marked as unsure. Default 0.6. */
  threshold?: number
  /** Called when another word is picked for token `index`: write the answer again from there. */
  onPick?: (index: number, text: string) => void
  labels?: Partial<TokenAlternativesLabels>
}

/**
 * An answer where the words the model was unsure of are underlined. Each opens what else it
 * weighed, with how likely each was; picking one hands it back so the answer can be written
 * again from that word on.
 */
function TokenAlternatives({
  tokens,
  threshold = 0.6,
  onPick,
  labels: labelsProp,
  className,
  ...props
}: TokenAlternativesProps) {
  const labels = useLabels('token-alternatives', defaultTokenAlternativesLabels, labelsProp)
  return (
    <p data-slot="token-alternatives" className={cn('text-sm leading-7', className)} {...props}>
      {tokens.map((token, i) => {
        const unsure = token.p !== undefined && token.p < threshold && token.alternatives?.length
        // biome-ignore lint/suspicious/noArrayIndexKey: tokens are positional
        if (!unsure) return <React.Fragment key={i}>{token.text}</React.Fragment>
        // The space before a word stays outside its underline.
        const [, space = '', word = token.text] = /^(\s*)([\s\S]*)$/.exec(token.text) ?? []
        const options = [{ text: token.text, p: token.p ?? 0 }, ...(token.alternatives ?? [])].sort(
          (a, b) => b.p - a.p,
        )
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: tokens are positional
          <React.Fragment key={i}>
            {space}
            <Popover>
              <PopoverTrigger
                aria-label={labels.token(word, percent(token.p ?? 0))}
                className={cn(
                  'rounded-sm underline decoration-dotted decoration-2 underline-offset-4 outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=open]:bg-muted',
                  (token.p ?? 0) < threshold / 2
                    ? 'decoration-amber-500'
                    : 'decoration-muted-foreground/60',
                )}
              >
                {word}
              </PopoverTrigger>
              <PopoverContent align="start" className="w-56 p-1.5">
                <p className="px-2 pt-1 pb-1.5 text-muted-foreground text-xs">{labels.options}</p>
                <ul className="flex flex-col">
                  {options.map((option) => {
                    const chosen = option.text === token.text
                    return (
                      <li key={option.text}>
                        <button
                          type="button"
                          aria-current={chosen || undefined}
                          disabled={chosen}
                          onClick={() => onPick?.(i, option.text)}
                          className="relative flex w-full items-center gap-2 overflow-hidden rounded-md px-2 py-1.5 text-left text-sm outline-none hover:bg-accent focus-visible:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:font-medium pointer-coarse:min-h-11"
                        >
                          {/* How likely, as a bar behind the word. */}
                          <span
                            aria-hidden="true"
                            className={cn(
                              'absolute inset-y-0 left-0',
                              chosen ? 'bg-primary/15' : 'bg-muted',
                            )}
                            style={{ width: `${percent(option.p)}%` }}
                          />
                          <span className="relative min-w-0 flex-1 truncate">
                            {option.text.trim()}
                          </span>
                          <span className="relative text-muted-foreground text-xs tabular-nums">
                            {percent(option.p)}%
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </PopoverContent>
            </Popover>
          </React.Fragment>
        )
      })}
    </p>
  )
}

export { TokenAlternatives }
