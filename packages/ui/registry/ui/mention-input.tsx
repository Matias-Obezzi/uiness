'use client'

import * as React from 'react'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'
import { Popover, PopoverAnchor, PopoverContent } from '@/ui/popover'

/* -------------------------------------------------------------------------------------------------
 * Types
 * -----------------------------------------------------------------------------------------------*/

export interface MentionItem {
  id: string
  /** What is inserted after the trigger character and matched by the search. */
  label: string
  /** A second line in the suggestion, like a role or a member count. */
  description?: string
  /** Shown before the label, an avatar or an icon. */
  icon?: React.ReactNode
  /** Extra words the item is matched by. */
  keywords?: string[]
}

export interface MentionTrigger {
  /** The character that opens the suggestions, like "@" or "#". */
  char: string
  /** The items, or a function that returns them for the typed query. */
  items: MentionItem[] | ((query: string) => MentionItem[])
  /** Accessible name of the suggestion list, like "People". */
  label?: string
}

export interface Mention {
  /** The trigger character it was made with. */
  trigger: string
  id: string
  label: string
  /** Where the token starts in the text, the trigger included. */
  start: number
  /** Where the token ends in the text, exclusive. */
  end: number
}

export interface MentionValue {
  /** The plain text, mentions written as "@label". */
  text: string
  /** Every mention in the text, in order. */
  mentions: Mention[]
}

const EMPTY: MentionValue = { text: '', mentions: [] }

const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

/** Keep the mentions an edit did not touch, shifted to where their text moved. */
function reconcile(prev: MentionValue, text: string): Mention[] {
  const a = prev.text
  let start = 0
  const max = Math.min(a.length, text.length)
  while (start < max && a[start] === text[start]) start++
  let tail = 0
  while (tail < max - start && a[a.length - 1 - tail] === text[text.length - 1 - tail]) tail++
  const oldEnd = a.length - tail
  const delta = text.length - a.length
  const out: Mention[] = []
  for (const m of prev.mentions) {
    if (m.end <= start) out.push(m)
    else if (m.start >= oldEnd) out.push({ ...m, start: m.start + delta, end: m.end + delta })
    // Anything overlapping the edit was changed by hand and is plain text now.
  }
  return out
}

interface ActiveQuery {
  trigger: MentionTrigger
  /** Index of the trigger character. */
  start: number
  /** Index of the caret, where the query ends. */
  end: number
  query: string
}

function findQuery(
  value: MentionValue,
  caret: number,
  triggers: MentionTrigger[],
): ActiveQuery | null {
  const { text } = value
  let i = caret - 1
  while (i >= 0 && !/\s/.test(text[i] ?? '')) {
    const ch = text[i] ?? ''
    const trigger = triggers.find((t) => t.char === ch)
    if (trigger && (i === 0 || /\s/.test(text[i - 1] ?? ''))) {
      if (value.mentions.some((m) => i >= m.start && i < m.end)) return null
      return { trigger, start: i, end: caret, query: text.slice(i + 1, caret) }
    }
    i--
  }
  return null
}

/* -------------------------------------------------------------------------------------------------
 * Props
 * -----------------------------------------------------------------------------------------------*/

export interface MentionInputLabels {
  /** Shown when nothing matches. */
  empty: string
  /** Name of the list, when the trigger has no `label`. */
  suggestions: string
  /** Announced while the list is open, with the trigger's `label` when it has one. */
  count: (count: number, label?: string) => string
}

export const defaultMentionInputLabels: MentionInputLabels = {
  empty: 'No matches',
  suggestions: 'Suggestions',
  count: (count, label) => `${count} ${label ?? 'suggestions'}`,
}

export interface MentionInputProps
  extends Omit<React.ComponentProps<'textarea'>, 'value' | 'defaultValue' | 'onChange'> {
  /** Text and mentions. Controlled. */
  value?: MentionValue
  /** The starting text, plain or with mentions, when uncontrolled. */
  defaultValue?: MentionValue | string
  /** Called on every edit with the text and the mentions in it. */
  onValueChange?: (value: MentionValue) => void
  /** Which characters open suggestions and what they suggest. */
  triggers: MentionTrigger[]
  /** Most suggestions shown at once. Default 8. */
  maxSuggestions?: number
  /** Shown when nothing matches. Default "No matches". */
  emptyText?: string
  /** Classes for the textarea. `className` goes on the wrapper. */
  textareaClassName?: string
  /** Words to use instead of the English ones. A `LabelsProvider` sets them for the whole app. */
  labels?: Partial<MentionInputLabels>
}

/* -------------------------------------------------------------------------------------------------
 * MentionInput
 * -----------------------------------------------------------------------------------------------*/

/**
 * A textarea where a trigger like "@" or "#" opens suggestions at the caret. A picked
 * mention is a single token: the caret steps over it and Backspace takes it out whole.
 */
function MentionInput({
  value: valueProp,
  defaultValue,
  onValueChange,
  triggers,
  maxSuggestions = 8,
  emptyText: emptyProp,
  labels: labelsProp,
  className,
  textareaClassName,
  name,
  disabled,
  onKeyDown,
  onSelect,
  onScroll,
  onBlur,
  ...props
}: MentionInputProps) {
  const labels = useLabels('mention-input', defaultMentionInputLabels, labelsProp)
  const emptyText = emptyProp ?? labels.empty
  const [internal, setInternal] = React.useState<MentionValue>(() =>
    typeof defaultValue === 'string'
      ? { text: defaultValue, mentions: [] }
      : (defaultValue ?? EMPTY),
  )
  const value = valueProp ?? internal
  const commit = (next: MentionValue) => {
    if (valueProp === undefined) setInternal(next)
    onValueChange?.(next)
  }

  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const mirrorRef = React.useRef<HTMLDivElement>(null)
  const markerRef = React.useRef<HTMLSpanElement>(null)
  const pendingCaret = React.useRef<number | null>(null)
  const lastCaret = React.useRef(0)
  const listId = React.useId()

  const [query, setQuery] = React.useState<ActiveQuery | null>(null)
  const [dismissed, setDismissed] = React.useState<number | null>(null)
  const [active, setActive] = React.useState(0)
  const [anchor, setAnchor] = React.useState({ left: 0, top: 0, height: 0 })

  const suggestions = React.useMemo(() => {
    if (!query) return []
    const { items } = query.trigger
    const list = typeof items === 'function' ? items(query.query) : items
    const q = normalize(query.query)
    if (!q) return list.slice(0, maxSuggestions)
    const scored = list
      .map((item) => {
        const words = [item.label, ...(item.keywords ?? [])].map(normalize)
        const score = words.some((w) => w.startsWith(q))
          ? 2
          : words.some((w) => w.split(/\s+/).some((p) => p.startsWith(q)))
            ? 1.5
            : words.some((w) => w.includes(q))
              ? 1
              : 0
        return { item, score }
      })
      .filter((s) => s.score > 0)
    scored.sort((a, b) => b.score - a.score)
    return scored.slice(0, maxSuggestions).map((s) => s.item)
  }, [query, maxSuggestions])

  const open = !!query && dismissed !== query.start && !disabled

  const refreshQuery = (next: MentionValue, caret: number) => {
    const q = findQuery(next, caret, triggers)
    setQuery(q)
    if (!q || q.start !== query?.start || q.query !== query?.query) setActive(0)
    if (!q) setDismissed(null)
  }

  // Restore the caret after a programmatic edit, and keep the mirror scrolled with the text.
  React.useLayoutEffect(() => {
    const el = textareaRef.current
    if (!el) return
    if (pendingCaret.current !== null) {
      el.setSelectionRange(pendingCaret.current, pendingCaret.current)
      lastCaret.current = pendingCaret.current
      pendingCaret.current = null
    }
    if (mirrorRef.current) mirrorRef.current.scrollTop = el.scrollTop
  })

  // Place the popover at the trigger character, measured in the mirror where it sits in a span.
  // biome-ignore lint/correctness/useExhaustiveDependencies: the text and the trigger move the marker
  React.useLayoutEffect(() => {
    const marker = markerRef.current
    const mirror = mirrorRef.current
    if (!open || !marker || !mirror) return
    const height = Number.parseFloat(getComputedStyle(mirror).lineHeight) || 20
    setAnchor({
      left: marker.offsetLeft + mirror.clientLeft,
      top: marker.offsetTop + mirror.clientTop - mirror.scrollTop,
      height,
    })
  }, [open, value.text, query?.start])

  const select = (item: MentionItem) => {
    if (!query) return
    const token = `${query.trigger.char}${item.label}`
    const after = value.text.slice(query.end)
    const space = /^\s/.test(after) ? '' : ' '
    const text = value.text.slice(0, query.start) + token + space + after
    const delta = token.length + space.length - (query.end - query.start)
    const mention: Mention = {
      trigger: query.trigger.char,
      id: item.id,
      label: item.label,
      start: query.start,
      end: query.start + token.length,
    }
    const mentions = [
      ...value.mentions.filter((m) => m.end <= query.start),
      mention,
      ...value.mentions
        .filter((m) => m.start >= query.end)
        .map((m) => ({ ...m, start: m.start + delta, end: m.end + delta })),
    ]
    pendingCaret.current = mention.end + 1
    setQuery(null)
    commit({ text, mentions })
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    const next = { text, mentions: reconcile(value, text) }
    lastCaret.current = e.target.selectionStart
    commit(next)
    refreshQuery(next, e.target.selectionStart)
  }

  const mentionAt = (pos: number, edge: 'before' | 'after') =>
    value.mentions.find((m) =>
      edge === 'before' ? pos > m.start && pos <= m.end : pos >= m.start && pos < m.end,
    )

  const removeRange = (from: number, to: number) => {
    const text = value.text.slice(0, from) + value.text.slice(to)
    const delta = to - from
    const mentions = value.mentions
      .filter((m) => m.end <= from || m.start >= to)
      .map((m) => (m.start >= to ? { ...m, start: m.start - delta, end: m.end - delta } : m))
    pendingCaret.current = from
    const next = { text, mentions }
    commit(next)
    refreshQuery(next, from)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented) return
    const el = e.currentTarget

    if (open && query) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (suggestions.length === 0) return
        e.preventDefault()
        const d = e.key === 'ArrowDown' ? 1 : -1
        setActive((i) => (i + d + suggestions.length) % suggestions.length)
        return
      }
      if ((e.key === 'Enter' || e.key === 'Tab') && !e.shiftKey && !e.nativeEvent.isComposing) {
        const item = suggestions[active]
        if (item) {
          e.preventDefault()
          select(item)
          return
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setDismissed(query.start)
        return
      }
    }

    // A mention goes out whole, never a letter at a time.
    if (e.key === 'Backspace' || e.key === 'Delete') {
      const { selectionStart: s, selectionEnd: t } = el
      if (s !== t) {
        const from = Math.min(
          s,
          ...value.mentions.filter((m) => m.end > s && m.start < s).map((m) => m.start),
        )
        const to = Math.max(
          t,
          ...value.mentions.filter((m) => m.start < t && m.end > t).map((m) => m.end),
        )
        if (from !== s || to !== t) {
          e.preventDefault()
          removeRange(from, to)
        }
        return
      }
      const m = mentionAt(s, e.key === 'Backspace' ? 'before' : 'after')
      if (m) {
        e.preventDefault()
        removeRange(m.start, m.end)
      }
    }
  }

  // The caret never rests inside a mention. It goes to the edge it was heading for.
  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    onSelect?.(e as React.SyntheticEvent<HTMLTextAreaElement, Event>)
    const el = e.currentTarget
    const pos = el.selectionStart
    if (el.selectionStart === el.selectionEnd) {
      const inside = value.mentions.find((m) => pos > m.start && pos < m.end)
      if (inside) {
        const prev = lastCaret.current
        const to =
          prev <= inside.start
            ? inside.end
            : prev >= inside.end
              ? inside.start
              : pos - inside.start < inside.end - pos
                ? inside.start
                : inside.end
        el.setSelectionRange(to, to)
        lastCaret.current = to
        refreshQuery(value, to)
        return
      }
    }
    lastCaret.current = pos
    refreshQuery(value, pos)
  }

  /* The mirror draws the text with the mentions marked, under a textarea whose own text is
   * transparent. A span sits at the open trigger so the popover can be placed there. */
  const mirror = React.useMemo(() => {
    const nodes: React.ReactNode[] = []
    let at = 0
    const marker = open && query ? query.start : -1
    const plain = (from: number, to: number) => {
      if (marker >= from && marker < to) {
        nodes.push(value.text.slice(from, marker))
        nodes.push(<span key="marker" ref={markerRef} />)
        nodes.push(value.text.slice(marker, to))
      } else nodes.push(value.text.slice(from, to))
    }
    for (const m of [...value.mentions].sort((a, b) => a.start - b.start)) {
      if (m.start < at) continue
      plain(at, m.start)
      nodes.push(
        <span
          key={`${m.start}-${m.id}`}
          data-slot="mention-input-token"
          data-trigger={m.trigger}
          className="rounded-[0.3rem] bg-primary/10 text-foreground ring-2 ring-primary/10 dark:bg-primary/20 dark:ring-primary/20"
        >
          {value.text.slice(m.start, m.end)}
        </span>,
      )
      at = m.end
    }
    plain(at, value.text.length)
    if (marker === value.text.length) nodes.push(<span key="marker" ref={markerRef} />)
    // A trailing newline needs something after it, or the mirror is a line short.
    nodes.push('​')
    return nodes
  }, [value, open, query])

  const shared =
    'w-full px-3 py-2 text-base leading-6 md:text-sm md:leading-6 whitespace-pre-wrap break-words [overflow-wrap:anywhere] [scrollbar-gutter:stable]'

  const activeId = open && suggestions[active] ? `${listId}-${active}` : undefined

  return (
    <div
      data-slot="mention-input"
      className={cn('relative w-full rounded-lg bg-transparent dark:bg-input/30', className)}
    >
      <div
        ref={mirrorRef}
        aria-hidden
        data-slot="mention-input-mirror"
        className={cn(
          shared,
          'pointer-events-none absolute inset-0 overflow-hidden border border-transparent text-foreground',
        )}
      >
        {mirror}
      </div>
      <textarea
        ref={textareaRef}
        data-slot="mention-input-textarea"
        disabled={disabled}
        value={value.text}
        aria-autocomplete="list"
        aria-controls={open ? listId : undefined}
        aria-activedescendant={activeId}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onSelect={handleSelect}
        onScroll={(e) => {
          onScroll?.(e)
          if (mirrorRef.current) mirrorRef.current.scrollTop = e.currentTarget.scrollTop
        }}
        onBlur={(e) => {
          onBlur?.(e)
          setQuery(null)
        }}
        className={cn(
          shared,
          'relative field-sizing-content flex min-h-16 resize-none rounded-lg border border-input bg-transparent text-transparent caret-foreground shadow-xs outline-none transition-[color,box-shadow] selection:bg-primary/25 placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
          'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
          'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
          textareaClassName,
        )}
        {...props}
      />
      {name && (
        <>
          <input type="hidden" name={name} value={value.text} />
          <input type="hidden" name={`${name}.mentions`} value={JSON.stringify(value.mentions)} />
        </>
      )}
      <span aria-live="polite" className="sr-only">
        {open ? labels.count(suggestions.length, query?.trigger.label) : ''}
      </span>
      <Popover open={open} onOpenChange={(next) => !next && query && setDismissed(query.start)}>
        <PopoverAnchor asChild>
          <span
            aria-hidden
            className="pointer-events-none absolute w-0"
            style={{ left: anchor.left, top: anchor.top, height: anchor.height }}
          />
        </PopoverAnchor>
        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={6}
          data-slot="mention-input-content"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          // The textarea is outside the panel but typing there must not close it.
          onInteractOutside={(e) => {
            if (e.target === textareaRef.current) e.preventDefault()
          }}
          className="w-64 p-1 motion-reduce:animate-none"
        >
          <div
            id={listId}
            role="listbox"
            aria-label={query?.trigger.label ?? labels.suggestions}
            className="max-h-64 overflow-y-auto"
          >
            {suggestions.length === 0 ? (
              <div className="px-2 py-4 text-center text-muted-foreground text-sm">{emptyText}</div>
            ) : (
              suggestions.map((item, i) => (
                // biome-ignore lint/a11y/useKeyWithClickEvents: keys are handled by the textarea
                <div
                  key={item.id}
                  id={`${listId}-${i}`}
                  role="option"
                  tabIndex={-1}
                  aria-selected={i === active}
                  data-active={i === active ? '' : undefined}
                  onPointerDown={(e) => e.preventDefault()}
                  onPointerMove={() => setActive(i)}
                  onClick={() => select(item)}
                  className="flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm data-[active]:bg-accent data-[active]:text-accent-foreground [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground"
                >
                  {item.icon}
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate">
                      {!item.icon && (
                        <span className="text-muted-foreground">{query?.trigger.char}</span>
                      )}
                      {item.label}
                    </span>
                    {item.description && (
                      <span className="truncate text-muted-foreground text-xs">
                        {item.description}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

/** Write a value as text with every mention replaced, for storage or sending, e.g. `<@${id}>`. */
function serializeMentions(value: MentionValue, write: (mention: Mention) => string) {
  let out = ''
  let at = 0
  for (const m of [...value.mentions].sort((a, b) => a.start - b.start)) {
    out += value.text.slice(at, m.start) + write(m)
    at = m.end
  }
  return out + value.text.slice(at)
}

export { MentionInput, serializeMentions }
