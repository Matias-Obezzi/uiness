'use client'

import { EyeIcon, EyeOffIcon, ShieldCheckIcon } from 'lucide-react'
import * as React from 'react'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export type RedactionKind = 'email' | 'phone' | 'card' | 'key' | 'term'

export interface Redaction {
  /** What the model sees instead, such as `[EMAIL_1]`. */
  placeholder: string
  value: string
  kind: RedactionKind
}

const luhn = (digits: string) => {
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i])
    if (i % 2) d = d * 2 > 9 ? d * 2 - 9 : d * 2
    sum += d
  }
  return sum % 10 === 0
}

const detectors: { kind: RedactionKind; pattern: RegExp; check?: (match: string) => boolean }[] = [
  { kind: 'email', pattern: /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g },
  // API keys and tokens in the shapes the big providers use.
  {
    kind: 'key',
    pattern:
      /\b(?:sk-[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|xox[abpr]-[A-Za-z0-9-]{10,}|AIza[0-9A-Za-z_-]{35})\b/g,
  },
  {
    kind: 'card',
    pattern: /\b\d(?:[ -]?\d){12,18}\b/g,
    check: (match) => luhn(match.replace(/\D/g, '')),
  },
  // At most 15 digits, as the international format allows: longer runs are not phones.
  {
    kind: 'phone',
    pattern: /(?<![\w+])\+?\d[\d ().-]{7,}\d\b/g,
    check: (match) => match.replace(/\D/g, '').length <= 15,
  },
]

/**
 * Swaps what should not reach a model for placeholders: emails, phone numbers, card numbers
 * that pass the Luhn check, API keys, and any `terms` you give, such as names. The same value
 * gets the same placeholder.
 */
export function redact(
  text: string,
  terms: string[] = [],
): { text: string; redactions: Redaction[] } {
  const redactions: Redaction[] = []
  const counts: Partial<Record<RedactionKind, number>> = {}
  const placeholderFor = (value: string, kind: RedactionKind) => {
    const known = redactions.find((r) => r.value === value)
    if (known) return known.placeholder
    counts[kind] = (counts[kind] ?? 0) + 1
    const placeholder = `[${kind.toUpperCase()}_${counts[kind]}]`
    redactions.push({ placeholder, value, kind })
    return placeholder
  }
  let out = text
  for (const { kind, pattern, check } of detectors)
    out = out.replace(pattern, (match) =>
      check && !check(match) ? match : placeholderFor(match, kind),
    )
  // Names last, so one never cuts into an email or a key that holds it.
  for (const term of terms.filter(Boolean).sort((a, b) => b.length - a.length)) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    out = out.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), (match) =>
      placeholderFor(match, 'term'),
    )
  }
  return { text: out, redactions }
}

/** Puts the real values back into a reply written with the placeholders. */
export function restore(text: string, redactions: Redaction[]): string {
  return redactions.reduce((out, r) => out.split(r.placeholder).join(r.value), text)
}

export interface RedactPromptLabels {
  placeholder: string
  /** Names the preview of what the model gets. */
  preview: string
  show: string
  hide: string
  /** How many values were masked. */
  masked: (count: number) => string
  kinds: Record<RedactionKind, string>
}

export const defaultRedactPromptLabels: RedactPromptLabels = {
  placeholder: 'Write a prompt…',
  preview: 'What the model sees',
  show: 'Show what the model sees',
  hide: 'Hide what the model sees',
  masked: (count) => (count === 1 ? '1 value masked' : `${count} values masked`),
  kinds: { email: 'Email', phone: 'Phone', card: 'Card number', key: 'API key', term: 'Name' },
}

export interface RedactPromptProps
  extends Omit<React.ComponentProps<'div'>, 'children' | 'defaultValue'> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** Words to mask as well, such as people's or companies' names. */
  terms?: string[]
  labels?: Partial<RedactPromptLabels>
}

/**
 * A prompt box that masks names, emails, card numbers and keys before anything is sent. It
 * shows how many values it masked, and on request the prompt as the model will get it. Send
 * `redact(value).text`, then `restore` the reply.
 */
function RedactPrompt({
  value,
  defaultValue = '',
  onValueChange,
  terms = [],
  labels: labelsProp,
  className,
  ...props
}: RedactPromptProps) {
  const labels = useLabels('redact-prompt', defaultRedactPromptLabels, labelsProp)
  const [own, setOwn] = React.useState(defaultValue)
  const text = value ?? own
  const [showing, setShowing] = React.useState(false)
  const previewId = React.useId()
  const masked = React.useMemo(() => redact(text, terms), [text, terms])

  return (
    <div data-slot="redact-prompt" className={cn('flex flex-col gap-2', className)} {...props}>
      <textarea
        aria-label={labels.placeholder}
        placeholder={labels.placeholder}
        value={text}
        onChange={(event) => {
          if (value === undefined) setOwn(event.target.value)
          onValueChange?.(event.target.value)
        }}
        className="field-sizing-content min-h-20 w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-base shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
      />
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <p role="status" className="flex items-center gap-1.5 text-muted-foreground">
          <ShieldCheckIcon
            aria-hidden="true"
            className="size-3.5 text-emerald-600 dark:text-emerald-400"
          />
          {labels.masked(masked.redactions.length)}
        </p>
        <ul className="flex flex-wrap gap-1">
          {masked.redactions.map((r) => (
            <li
              key={r.placeholder}
              className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px]"
            >
              <span className="sr-only">{labels.kinds[r.kind]}: </span>
              {r.placeholder}
            </li>
          ))}
        </ul>
        <button
          type="button"
          aria-expanded={showing}
          aria-controls={previewId}
          onClick={() => setShowing(!showing)}
          className="relative ml-auto flex items-center gap-1 rounded-md px-1.5 py-1 text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:after:absolute pointer-coarse:after:-inset-y-2 [&_svg]:size-3.5"
        >
          {showing ? <EyeOffIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />}
          {showing ? labels.hide : labels.show}
        </button>
      </div>
      <div
        id={previewId}
        hidden={!showing}
        className="whitespace-pre-wrap rounded-lg border border-dashed bg-muted/40 px-3 py-2 font-mono text-xs leading-relaxed"
      >
        <span className="sr-only">{labels.preview}: </span>
        {masked.text.split(/(\[[A-Z]+_\d+\])/).map((part, i) =>
          /^\[[A-Z]+_\d+\]$/.test(part) ? (
            // biome-ignore lint/suspicious/noArrayIndexKey: parts are positional
            <mark key={i} className="rounded-sm bg-primary/15 px-0.5 text-foreground">
              {part}
            </mark>
          ) : (
            part
          ),
        )}
      </div>
    </div>
  )
}

export { RedactPrompt }
