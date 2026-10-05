'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------------------------------
 * Number shape for a locale and a currency, read from Intl once.
 * -----------------------------------------------------------------------------------------------*/

interface MoneyFormat {
  decimal: string
  group: string
  /** Digits after the decimal separator: 2 for USD, 0 for JPY, 3 for KWD. */
  fraction: number
  symbol: string
  /** Where the symbol sits around the number. */
  position: 'prefix' | 'suffix'
  integer: Intl.NumberFormat
}

function moneyFormat(
  locale: string | undefined,
  currency: string,
  display: MoneyInputProps['currencyDisplay'],
): MoneyFormat {
  const fmt = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: display,
  })
  const parts = fmt.formatToParts(12345.5)
  const symbolAt = parts.findIndex((p) => p.type === 'currency')
  const numberAt = parts.findIndex((p) => p.type === 'integer')
  return {
    decimal: parts.find((p) => p.type === 'decimal')?.value ?? '.',
    group: parts.find((p) => p.type === 'group')?.value ?? ',',
    fraction: fmt.resolvedOptions().maximumFractionDigits ?? 2,
    symbol: parts[symbolAt]?.value ?? currency,
    position: symbolAt > numberAt ? 'suffix' : 'prefix',
    integer: new Intl.NumberFormat(locale, { maximumFractionDigits: 0, useGrouping: true }),
  }
}

// Past this many integer digits an amount in minor units stops being a safe integer.
const MAX_INTEGER_DIGITS = 13

interface Parsed {
  negative: boolean
  int: string
  /** Null when no decimal separator was typed, '' right after one was. */
  frac: string | null
}

function toMinor({ negative, int, frac }: Parsed, fraction: number): number | null {
  if (!int && !frac) return null
  const n = Number((int || '0') + (frac ?? '').padEnd(fraction, '0').slice(0, fraction))
  return negative && n !== 0 ? -n : n
}

function fromMinor(minor: number, fraction: number): Parsed {
  const abs = String(Math.abs(Math.trunc(minor))).padStart(fraction + 1, '0')
  return {
    negative: minor < 0,
    int: fraction ? abs.slice(0, -fraction) : abs,
    frac: fraction ? abs.slice(-fraction) : null,
  }
}

function render(p: Parsed, f: MoneyFormat) {
  const int = p.int ? f.integer.format(Number(p.int)) : p.frac !== null ? '0' : ''
  const sign = p.negative ? '-' : ''
  return sign + int + (p.frac !== null && f.fraction > 0 ? f.decimal + p.frac : '')
}

/** Characters that carry meaning, used to find the caret's place again after regrouping. */
const isSignificant = (ch: string, f: MoneyFormat) => /\d/.test(ch) || ch === f.decimal

/* -------------------------------------------------------------------------------------------------
 * Props
 * -----------------------------------------------------------------------------------------------*/

export interface MoneyInputProps
  extends Omit<
    React.ComponentProps<'input'>,
    'value' | 'defaultValue' | 'onChange' | 'type' | 'min' | 'max' | 'step'
  > {
  /** The amount in minor units, so 1234 is $12.34 and ¥1234 is ¥1,234. Null when empty. Controlled. */
  value?: number | null
  /** The starting amount in minor units when uncontrolled. */
  defaultValue?: number | null
  /** Called with the amount in minor units on every edit, or null when the field is cleared. */
  onValueChange?: (value: number | null) => void
  /** ISO 4217 code. Sets the symbol and how many decimals there are. Default "USD". */
  currency?: string
  /** BCP 47 locale for the separators and where the symbol goes. Default the browser's. */
  locale?: string
  /** How the currency is shown. Default "narrowSymbol". */
  currencyDisplay?: 'symbol' | 'narrowSymbol' | 'code' | 'name'
  /** Allow amounts below zero. Typing "-" flips the sign. Default false. */
  allowNegative?: boolean
  /** Smallest amount in minor units. Applied when the field loses focus. */
  min?: number
  /** Largest amount in minor units. Applied when the field loses focus. */
  max?: number
  /** What ArrowUp and ArrowDown add, in major units. Default 1. */
  step?: number
  /** Classes for the input. `className` goes on the wrapper. */
  inputClassName?: string
}

/* -------------------------------------------------------------------------------------------------
 * MoneyInput
 * -----------------------------------------------------------------------------------------------*/

/**
 * A currency field. Groups thousands as you type in the locale's way, keeps the caret where
 * it was, uses tabular digits so the width holds still, and hands back integer minor units
 * so no float ever touches the money.
 */
function MoneyInput({
  value: valueProp,
  defaultValue = null,
  onValueChange,
  currency = 'USD',
  locale,
  currencyDisplay = 'narrowSymbol',
  allowNegative = false,
  min,
  max,
  step = 1,
  className,
  inputClassName,
  disabled,
  name,
  onBlur,
  onKeyDown,
  ...props
}: MoneyInputProps) {
  const f = React.useMemo(
    () => moneyFormat(locale, currency, currencyDisplay),
    [locale, currency, currencyDisplay],
  )
  const full = (minor: number | null) =>
    minor === null ? '' : render(fromMinor(minor, f.fraction), f)

  const [text, setText] = React.useState(() => full(valueProp ?? defaultValue))
  const [minorState, setMinorState] = React.useState(valueProp ?? defaultValue)
  const minor = valueProp !== undefined ? valueProp : minorState

  // An outside change to a controlled value rewrites the text. Our own echo does not, so a
  // half typed "12." is not turned into "12.00" under the caret.
  const [seen, setSeen] = React.useState(valueProp)
  if (valueProp !== undefined && valueProp !== seen) {
    setSeen(valueProp)
    setText(full(valueProp))
  }

  // Currency or locale changes rewrite the text in the new shape.
  const [shape, setShape] = React.useState(f)
  if (shape !== f) {
    setShape(f)
    setText(full(minor))
  }

  const ref = React.useRef<HTMLInputElement>(null)
  const caret = React.useRef<number | null>(null)

  React.useLayoutEffect(() => {
    const input = ref.current
    if (caret.current === null || !input || document.activeElement !== input) return
    let count = 0
    let pos = 0
    while (pos < text.length && count < caret.current) {
      if (isSignificant(text[pos] ?? '', f)) count++
      pos++
    }
    caret.current = null
    input.setSelectionRange(pos, pos)
  })

  const emit = (next: number | null) => {
    if (valueProp === undefined) setMinorState(next)
    else setSeen(next)
    if (next !== minor) onValueChange?.(next)
  }

  /** Read whatever is in the field into a clean amount, and place the caret. */
  const apply = (raw: string, at: number, inputType?: string) => {
    let kept = ''
    let before = 0
    let minus = 0
    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i] ?? ''
      if (ch === '-') minus++
      else if (isSignificant(ch, f)) {
        kept += ch
        if (i < at) before++
      }
    }
    // A deleted group separator would come straight back; delete the digit beside it instead.
    const old = [...text].filter((ch) => isSignificant(ch, f)).join('')
    if (kept === old && raw.length < text.length) {
      if (inputType === 'deleteContentForward')
        kept = kept.slice(0, before) + kept.slice(before + 1)
      else if (before > 0) {
        kept = kept.slice(0, before - 1) + kept.slice(before)
        before--
      }
    }

    const at0 = kept.indexOf(f.decimal)
    let int = (at0 === -1 ? kept : kept.slice(0, at0)).replaceAll(f.decimal, '')
    const frac =
      at0 === -1 || f.fraction === 0
        ? null
        : kept
            .slice(at0 + 1)
            .replaceAll(f.decimal, '')
            .slice(0, f.fraction)
    // Leading zeros go, apart from the one before a decimal separator.
    const trimmed = int.replace(/^0+(?=\d)/, '')
    before -= Math.min(before, int.length - trimmed.length)
    int = trimmed.slice(0, MAX_INTEGER_DIGITS)
    // A lone decimal separator is shown as "0.", one character more before the caret.
    if (!int && frac !== null && before > 0) before++
    const negative = allowNegative && minus % 2 === 1
    const parsed: Parsed = { negative, int, frac }
    const nextText = int || frac !== null ? render(parsed, f) : negative ? '-' : ''
    caret.current = before
    setText(nextText)
    emit(toMinor(parsed, f.fraction))
  }

  const clampMinor = (n: number) => {
    let out = n
    if (min !== undefined) out = Math.max(min, out)
    if (max !== undefined) out = Math.min(max, out)
    if (!allowNegative) out = Math.max(0, out)
    return out
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented) return
    const input = e.currentTarget
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      const delta = Math.round(step * 10 ** f.fraction) * (e.key === 'ArrowUp' ? 1 : -1)
      const next = clampMinor((minor ?? 0) + delta)
      setText(full(next))
      emit(next)
      return
    }
    // Either separator key types the decimal one, so "." works on a German keyboard's keypad.
    if ((e.key === '.' || e.key === ',') && e.key !== f.decimal && f.fraction > 0) {
      e.preventDefault()
      const start = input.selectionStart ?? text.length
      const end = input.selectionEnd ?? start
      apply(text.slice(0, start) + f.decimal + text.slice(end), start + 1)
    }
  }

  const symbol = (
    <span
      aria-hidden
      data-slot="money-input-symbol"
      className="pointer-events-none shrink-0 select-none text-muted-foreground"
    >
      {f.symbol}
    </span>
  )

  return (
    <div
      data-slot="money-input"
      data-disabled={disabled ? '' : undefined}
      className={cn(
        'flex h-9 w-full min-w-0 items-center gap-1.5 rounded-lg border border-input bg-transparent px-3 text-base shadow-xs transition-[color,box-shadow] md:text-sm dark:bg-input/30',
        'focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50',
        'has-[[aria-invalid=true]]:border-destructive has-[[aria-invalid=true]]:ring-destructive/20 dark:has-[[aria-invalid=true]]:ring-destructive/40',
        'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
        className,
      )}
      onPointerDown={(e) => {
        // A press on the symbol or the padding lands in the field.
        if (
          e.target === e.currentTarget ||
          (e.target as HTMLElement).dataset.slot === 'money-input-symbol'
        ) {
          e.preventDefault()
          ref.current?.focus()
        }
      }}
    >
      {f.position === 'prefix' && symbol}
      <input
        ref={ref}
        type="text"
        inputMode={f.fraction > 0 ? 'decimal' : 'numeric'}
        autoComplete="off"
        data-slot="money-input-input"
        disabled={disabled}
        value={text}
        onChange={(e) =>
          apply(
            e.target.value,
            e.target.selectionStart ?? e.target.value.length,
            (e.nativeEvent as InputEvent).inputType,
          )
        }
        onKeyDown={handleKeyDown}
        onBlur={(e) => {
          onBlur?.(e)
          if (minor === null) {
            if (text) setText('')
            return
          }
          const next = clampMinor(minor)
          setText(full(next))
          if (next !== minor) emit(next)
        }}
        className={cn(
          'h-full w-full min-w-0 bg-transparent tabular-nums outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed',
          inputClassName,
        )}
        {...props}
      />
      {f.position === 'suffix' && symbol}
      {name && <input type="hidden" name={name} value={minor ?? ''} />}
    </div>
  )
}

export { MoneyInput }
