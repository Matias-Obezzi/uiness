'use client'

import * as React from 'react'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface AutocompleteInputLabels {
  /** Read out with the suggestion, and how to take it. */
  hint: (suggestion: string) => string
}

export const defaultAutocompleteInputLabels: AutocompleteInputLabels = {
  hint: (suggestion) => `Suggestion: ${suggestion}. Tab takes it, the right arrow one word.`,
}

/** The next word of a suggestion, with the space before it. */
export const nextWord = (suggestion: string) => /^\s*\S+/.exec(suggestion)?.[0] ?? suggestion

export interface AutocompleteInputProps
  extends Omit<React.ComponentProps<'textarea'>, 'value' | 'defaultValue' | 'onChange'> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /**
   * How the text could go on: return the words that would follow it, or an empty string.
   * Asked once typing pauses, with the caret at the end.
   */
  getSuggestion: (text: string) => string | Promise<string>
  /** Milliseconds of quiet before asking. Default 300. */
  delay?: number
  labels?: Partial<AutocompleteInputLabels>
}

/**
 * A text box that suggests how the sentence ends, in grey after the caret. Tab takes all of it,
 * the right arrow one word, and typing the letters it suggests keeps the rest. Escape drops it.
 */
function AutocompleteInput({
  value,
  defaultValue = '',
  onValueChange,
  getSuggestion,
  delay = 300,
  labels: labelsProp,
  className,
  onKeyDown,
  ...props
}: AutocompleteInputProps) {
  const labels = useLabels('autocomplete-input', defaultAutocompleteInputLabels, labelsProp)
  const [own, setOwn] = React.useState(defaultValue)
  const text = value ?? own
  const [suggestion, setSuggestion] = React.useState('')
  const field = React.useRef<HTMLTextAreaElement>(null)
  const mirror = React.useRef<HTMLDivElement>(null)
  const ask = React.useRef(0)
  const hintId = React.useId()
  const getRef = React.useRef(getSuggestion)
  React.useEffect(() => {
    getRef.current = getSuggestion
  })

  const set = (next: string) => {
    if (value === undefined) setOwn(next)
    onValueChange?.(next)
  }

  // Asks once typing pauses, and only keeps the answer if the text is still the same.
  React.useEffect(() => {
    if (suggestion || !text.trim()) return
    const id = ++ask.current
    const timer = window.setTimeout(async () => {
      const el = field.current
      if (!el || el.selectionStart !== text.length) return
      const next = await getRef.current(text)
      if (id === ask.current) setSuggestion(next)
    }, delay)
    return () => window.clearTimeout(timer)
  }, [text, suggestion, delay])

  const take = (part: string) => {
    set(text + part)
    setSuggestion(suggestion.slice(part.length))
    requestAnimationFrame(() => {
      const el = field.current
      if (el) el.selectionStart = el.selectionEnd = el.value.length
    })
  }

  return (
    <div data-slot="autocomplete-input" className={cn('relative grid', className)}>
      {/* The text again, invisible, with the suggestion after it: lined up under the field. */}
      <div
        ref={mirror}
        aria-hidden="true"
        className="pointer-events-none col-start-1 row-start-1 overflow-hidden whitespace-pre-wrap break-words rounded-lg border border-transparent px-3 py-2 text-base md:text-sm"
      >
        <span className="invisible">{text}</span>
        <span className="text-muted-foreground/70">{suggestion}</span>
      </div>
      <textarea
        ref={field}
        value={text}
        aria-describedby={suggestion ? hintId : undefined}
        onChange={(event) => {
          const next = event.target.value
          // Typing what it suggests keeps the rest of it.
          const typed = next.startsWith(text) ? next.slice(text.length) : null
          if (typed && suggestion.startsWith(typed)) setSuggestion(suggestion.slice(typed.length))
          else setSuggestion('')
          set(next)
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event)
          if (event.defaultPrevented || !suggestion) return
          const el = event.currentTarget
          const atEnd = el.selectionStart === text.length && el.selectionEnd === text.length
          if (event.key === 'Tab' && !event.shiftKey && atEnd) {
            event.preventDefault()
            take(suggestion)
          } else if (event.key === 'ArrowRight' && atEnd) {
            event.preventDefault()
            take(nextWord(suggestion))
          } else if (event.key === 'Escape') {
            event.preventDefault()
            setSuggestion('')
          }
        }}
        onScroll={(event) => {
          if (mirror.current) mirror.current.scrollTop = event.currentTarget.scrollTop
        }}
        onBlur={() => setSuggestion('')}
        className="field-sizing-content col-start-1 row-start-1 min-h-16 w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-base shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
        {...props}
      />
      {suggestion && (
        <span id={hintId} className="sr-only">
          {labels.hint(suggestion)}
        </span>
      )}
    </div>
  )
}

export { AutocompleteInput }
