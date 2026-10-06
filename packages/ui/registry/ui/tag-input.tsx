'use client'

import { XIcon } from 'lucide-react'
import * as React from 'react'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export type TagRejectReason = 'duplicate' | 'max' | 'invalid'

export interface TagInputLabels {
  /** Name of a tag's remove button. */
  remove: (tag: string) => string
  /** Shown when `max` is reached. */
  max: (max: number) => string
  /** Shown for a tag that is already there. */
  duplicate: (tag: string) => string
  /** Announced after tags are added, joined with commas. */
  added: (tags: string) => string
  /** Announced after a tag is removed. */
  removed: (tag: string) => string
}

export const defaultTagInputLabels: TagInputLabels = {
  remove: (tag) => `Remove ${tag}`,
  max: (max) => `Up to ${max} ${max === 1 ? 'tag' : 'tags'}.`,
  duplicate: (tag) => `${tag} is already added.`,
  added: (tags) => `Added ${tags}.`,
  removed: (tag) => `Removed ${tag}.`,
}

export interface TagInputProps
  extends Omit<React.ComponentProps<'input'>, 'value' | 'defaultValue' | 'type' | 'size'> {
  /** Controlled tags. */
  value?: string[]
  /** Starting tags when uncontrolled. */
  defaultValue?: string[]
  /** Called with the whole list whenever a tag is added or removed. */
  onValueChange?: (tags: string[]) => void
  /** Most tags allowed. Further ones are turned away. */
  max?: number
  /** Allow the same tag twice. Compared case insensitively. Default false. */
  allowDuplicates?: boolean
  /**
   * Check a tag before it is added. Return `false` to refuse it quietly, or a message to
   * refuse it and say why. Anything else lets it in.
   */
  validate?: (tag: string, tags: string[]) => boolean | string | null | undefined
  /** Called when a tag is turned away, with why. */
  onReject?: (tag: string, reason: TagRejectReason, message?: string) => void
  /** Clean a tag up before it is checked, for lowercase slugs and the like. Default trims it. */
  transform?: (tag: string) => string
  /** Add what is left in the field when it loses focus. Default true. */
  addOnBlur?: boolean
  /** Accessible name of a tag's remove button. Default "Remove {tag}". */
  removeLabel?: (tag: string) => string
  /** Classes for the text input. `className` goes on the outer box. */
  inputClassName?: string
  /** Words to use instead of the English ones. A `LabelsProvider` sets them for the whole app. */
  labels?: Partial<TagInputLabels>
}

/** What splits a paste into several tags. */
const SPLIT = /[,;\n\t]+/

const commas = (text: string) => text.split(',').length - 1

/** Move focus to the remove button at `index`, or back to the field when there is none. */
function focusTagIn(list: HTMLUListElement | null, input: HTMLInputElement | null, index: number) {
  const buttons = Array.from(list?.querySelectorAll<HTMLButtonElement>('button') ?? [])
  if (index < 0 || index >= buttons.length) input?.focus()
  else buttons[index]?.focus()
}

/**
 * Typed values turn into removable tags on Enter or a comma, and a pasted list becomes several
 * at once. Backspace in the empty field removes the last tag, and the arrow keys walk through
 * the tags' remove buttons.
 */
function TagInput({
  value: valueProp,
  defaultValue,
  onValueChange,
  max,
  allowDuplicates = false,
  validate,
  onReject,
  transform = (tag) => tag.trim(),
  addOnBlur = true,
  removeLabel: removeProp,
  labels: labelsProp,
  className,
  inputClassName,
  id,
  name,
  disabled,
  readOnly,
  placeholder,
  ref,
  onKeyDown,
  onPaste,
  onBlur,
  onChange,
  onCompositionStart,
  onCompositionEnd,
  'aria-describedby': describedBy,
  'aria-invalid': ariaInvalid,
  ...props
}: TagInputProps) {
  const labels = useLabels('tag-input', defaultTagInputLabels, labelsProp)
  const removeLabel = removeProp ?? labels.remove
  const [uncontrolled, setUncontrolled] = React.useState<string[]>(defaultValue ?? [])
  const tags = valueProp ?? uncontrolled
  const [text, setText] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [announcement, setAnnouncement] = React.useState('')

  const autoId = React.useId()
  const inputId = id ?? autoId
  const errorId = `${autoId}-error`
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLUListElement>(null)
  React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

  const commit = (next: string[]) => {
    if (valueProp === undefined) setUncontrolled(next)
    onValueChange?.(next)
  }

  /** Try each candidate in order. Returns the ones turned away, to put back in the field. */
  const add = (candidates: string[]) => {
    const next = [...tags]
    const refused: string[] = []
    let message: string | null = null
    for (const raw of candidates) {
      const tag = transform(raw)
      if (!tag) continue
      let reason: TagRejectReason | null = null
      let why: string | undefined
      if (max !== undefined && next.length >= max) {
        reason = 'max'
        why = labels.max(max)
      } else if (!allowDuplicates && next.some((t) => t.toLowerCase() === tag.toLowerCase())) {
        reason = 'duplicate'
        why = labels.duplicate(tag)
      } else if (validate) {
        const verdict = validate(tag, next)
        if (verdict === false || typeof verdict === 'string') {
          reason = 'invalid'
          why = typeof verdict === 'string' ? verdict : undefined
        }
      }
      if (reason) {
        refused.push(raw.trim())
        message ??= why ?? null
        onReject?.(tag, reason, why)
      } else {
        next.push(tag)
      }
    }
    if (next.length !== tags.length) {
      commit(next)
      const added = next.slice(tags.length)
      setAnnouncement(labels.added(added.join(', ')))
    }
    setError(message)
    return refused
  }

  const remove = (index: number) => {
    const tag = tags[index]
    if (tag === undefined) return
    commit(tags.filter((_, i) => i !== index))
    setAnnouncement(labels.removed(tag))
    setError(null)
  }

  const focusTag = (index: number) => focusTagIn(listRef.current, inputRef.current, index)

  // Focus moves once the removed tag is gone from the DOM.
  const pendingFocus = React.useRef<number | null>(null)
  const textBeforeComposition = React.useRef('')
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs when the tags change
  React.useLayoutEffect(() => {
    if (pendingFocus.current === null) return
    focusTagIn(listRef.current, inputRef.current, pendingFocus.current)
    pendingFocus.current = null
  }, [tags])

  const interactive = !disabled && !readOnly

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented || !interactive || e.nativeEvent.isComposing) return
    const input = e.currentTarget
    const atStart = input.selectionStart === 0 && input.selectionEnd === 0
    if ((e.key === 'Enter' || e.key === ',') && text.trim()) {
      // Enter in an empty field is left alone, so it still submits the form.
      e.preventDefault()
      const refused = add([text])
      setText(refused.join(', '))
    } else if (e.key === ',') {
      e.preventDefault()
    } else if (e.key === 'Backspace' && atStart && tags.length > 0) {
      e.preventDefault()
      remove(tags.length - 1)
    } else if (e.key === 'ArrowLeft' && atStart && tags.length > 0) {
      e.preventDefault()
      focusTag(tags.length - 1)
    }
  }

  const handleTagKeyDown = (index: number) => (e: React.KeyboardEvent<HTMLButtonElement>) => {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        focusTag(Math.max(0, index - 1))
        break
      case 'ArrowRight':
        e.preventDefault()
        focusTag(index + 1)
        break
      case 'Home':
        e.preventDefault()
        focusTag(0)
        break
      case 'End':
      case 'Escape':
        e.preventDefault()
        inputRef.current?.focus()
        break
      case 'Backspace':
      case 'Delete': {
        e.preventDefault()
        if (!interactive) return
        // Land on the neighbour that slides into place, or back in the field.
        pendingFocus.current = e.key === 'Backspace' ? Math.max(0, index - 1) : index
        remove(index)
        break
      }
    }
  }

  /**
   * A comma that reached the field without its keydown: Android keyboards send
   * `key: "Unidentified"`, and autofill or dictation insert text with no keys at all. Everything
   * before the last comma becomes tags, the rest stays in the field to keep typing.
   */
  const typeText = (next: string, before = text) => {
    if (!interactive || commas(next) <= commas(before)) {
      setText(next)
      return
    }
    const parts = next.split(',')
    const rest = parts.pop() ?? ''
    const refused = add(parts)
    setText([...refused, rest.trimStart()].filter(Boolean).join(', '))
  }

  const full = max !== undefined && tags.length >= max
  const invalid = ariaInvalid ?? (error ? true : undefined)

  return (
    <>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: a click on the empty space of the box only forwards focus to the input */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: the input inside handles every key */}
      <div
        data-slot="tag-input"
        data-disabled={disabled ? '' : undefined}
        data-full={full ? '' : undefined}
        onClick={(e) => {
          if (e.target === e.currentTarget) inputRef.current?.focus()
        }}
        className={cn(
          'flex min-h-9 w-full min-w-0 cursor-text flex-wrap items-center gap-1.5 rounded-lg border border-input bg-transparent px-1.5 py-1 shadow-xs transition-[color,box-shadow] dark:bg-input/30',
          'has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-ring/50',
          'has-[input[aria-invalid=true]]:border-destructive has-[input[aria-invalid=true]]:ring-destructive/20 dark:has-[input[aria-invalid=true]]:ring-destructive/40',
          'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
          className,
        )}
      >
        {tags.length > 0 && (
          <ul ref={listRef} data-slot="tag-input-list" className="contents">
            {tags.map((tag, index) => (
              <li
                // biome-ignore lint/suspicious/noArrayIndexKey: duplicates may be allowed, so the position is part of the identity
                key={`${tag}-${index}`}
                data-slot="tag-input-tag"
                className="inline-flex h-6 max-w-full items-center gap-0.5 rounded-md bg-secondary pr-0.5 pl-2 font-medium text-secondary-foreground text-xs motion-safe:fade-in-0 motion-safe:zoom-in-90 motion-safe:animate-in has-[button:focus-visible]:ring-2 has-[button:focus-visible]:ring-ring"
              >
                <span className="truncate">{tag}</span>
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={removeLabel(tag)}
                  disabled={!interactive}
                  onClick={() => {
                    remove(index)
                    inputRef.current?.focus()
                  }}
                  onKeyDown={handleTagKeyDown(index)}
                  className="flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground outline-none transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:bg-foreground/10 focus-visible:text-foreground disabled:hidden [&_svg]:size-3"
                >
                  <XIcon aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          data-slot="tag-input-input"
          autoComplete="off"
          enterKeyHint="enter"
          disabled={disabled}
          readOnly={readOnly}
          placeholder={tags.length === 0 ? placeholder : undefined}
          aria-invalid={invalid}
          aria-describedby={
            [describedBy, error ? errorId : undefined].filter(Boolean).join(' ') || undefined
          }
          value={text}
          onChange={(e) => {
            onChange?.(e)
            if (error) setError(null)
            // An input method in the middle of a word is left alone until it commits.
            if ((e.nativeEvent as InputEvent).isComposing) setText(e.target.value)
            else typeText(e.target.value)
          }}
          onCompositionStart={(e) => {
            onCompositionStart?.(e)
            textBeforeComposition.current = text
          }}
          onCompositionEnd={(e) => {
            onCompositionEnd?.(e)
            typeText(e.currentTarget.value, textBeforeComposition.current)
          }}
          onKeyDown={handleInputKeyDown}
          onPaste={(e) => {
            onPaste?.(e)
            if (e.defaultPrevented || !interactive) return
            const pasted = e.clipboardData.getData('text')
            if (!SPLIT.test(pasted)) return
            e.preventDefault()
            const refused = add([text + pasted.split(SPLIT)[0], ...pasted.split(SPLIT).slice(1)])
            setText(refused.join(', '))
          }}
          onBlur={(e) => {
            onBlur?.(e)
            if (addOnBlur && interactive && text.trim()) setText(add([text]).join(', '))
          }}
          className={cn(
            'h-6 min-w-16 flex-1 bg-transparent px-1.5 text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed md:text-sm',
            inputClassName,
          )}
          {...props}
        />
        {name &&
          tags.map((tag, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: duplicates may be allowed, the position is the identity
            <input key={index} type="hidden" name={name} value={tag} />
          ))}
        <span aria-live="polite" className="sr-only">
          {announcement}
        </span>
      </div>
      {error && (
        <p id={errorId} data-slot="tag-input-error" className="text-destructive text-sm">
          {error}
        </p>
      )}
    </>
  )
}

export { TagInput }
