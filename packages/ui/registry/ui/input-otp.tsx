'use client'

import { MinusIcon } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'

/** Only digits. The default. */
export const REGEXP_ONLY_DIGITS = '^[0-9]*$'
/** Digits and letters, case insensitive. */
export const REGEXP_ONLY_DIGITS_AND_CHARS = '^[a-zA-Z0-9]*$'

interface InputOTPContextValue {
  value: string
  maxLength: number
  focused: boolean
  /** Index the next character lands on. */
  caret: number
  disabled?: boolean
}

const InputOTPContext = React.createContext<InputOTPContextValue | null>(null)

function useInputOTP() {
  const ctx = React.useContext(InputOTPContext)
  if (!ctx) throw new Error('InputOTP parts must be rendered inside <InputOTP>')
  return ctx
}

export interface InputOTPProps
  extends Omit<React.ComponentProps<'input'>, 'value' | 'defaultValue' | 'onChange' | 'size'> {
  /** How many characters. Default 6. */
  maxLength?: number
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** Called once the last character is filled in. */
  onComplete?: (value: string) => void
  /** Which characters are allowed, as a regular expression source. Default digits only. */
  pattern?: string
  /** Uppercase what is typed, for codes that are printed that way. */
  uppercase?: boolean
  /** Classes for the wrapper around the slots. */
  containerClassName?: string
}

/**
 * A one time code field. Under the slots there is a single real input carrying the whole
 * code, so pasting works, iOS and Android offer the code from the SMS, and password
 * managers see one field instead of six.
 */
function InputOTP({
  maxLength = 6,
  value: valueProp,
  defaultValue = '',
  onValueChange,
  onComplete,
  pattern = REGEXP_ONLY_DIGITS,
  uppercase,
  disabled,
  containerClassName,
  className,
  children,
  onFocus,
  onBlur,
  onSelect,
  ...props
}: InputOTPProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue)
  const value = valueProp ?? uncontrolled
  const [focused, setFocused] = React.useState(false)
  const ref = React.useRef<HTMLInputElement>(null)
  const completed = React.useRef(false)
  const allowed = React.useMemo(() => new RegExp(pattern), [pattern])

  const commit = (next: string) => {
    if (valueProp === undefined) setUncontrolled(next)
    onValueChange?.(next)
    if (next.length === maxLength && !completed.current) {
      completed.current = true
      onComplete?.(next)
    }
    if (next.length < maxLength) completed.current = false
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let next = e.target.value.slice(0, maxLength)
    if (uppercase) next = next.toUpperCase()
    if (next && !allowed.test(next)) return
    commit(next)
  }

  /** Typing always appends, so the caret never sits in the middle of the code. */
  const toEnd = () => {
    const input = ref.current
    if (!input) return
    const end = input.value.length
    if (input.selectionStart !== end || input.selectionEnd !== end) {
      input.setSelectionRange(end, end)
    }
  }

  const context = React.useMemo<InputOTPContextValue>(
    () => ({
      value,
      maxLength,
      focused,
      caret: Math.min(value.length, maxLength - 1),
      disabled,
    }),
    [value, maxLength, focused, disabled],
  )

  return (
    <InputOTPContext.Provider value={context}>
      <div
        data-slot="input-otp"
        data-disabled={disabled ? '' : undefined}
        className={cn(
          'relative flex items-center gap-2 data-[disabled]:opacity-50',
          containerClassName,
        )}
      >
        {children}
        <input
          ref={ref}
          data-slot="input-otp-input"
          inputMode={pattern === REGEXP_ONLY_DIGITS ? 'numeric' : 'text'}
          autoComplete="one-time-code"
          autoCorrect="off"
          spellCheck={false}
          maxLength={maxLength}
          disabled={disabled}
          value={value}
          onChange={handleChange}
          onFocus={(e) => {
            setFocused(true)
            toEnd()
            onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            onBlur?.(e)
          }}
          onSelect={(e) => {
            toEnd()
            onSelect?.(e)
          }}
          onPointerUp={toEnd}
          className={cn(
            'absolute inset-0 size-full cursor-default opacity-0 outline-none disabled:cursor-not-allowed',
            className,
          )}
          {...props}
        />
      </div>
    </InputOTPContext.Provider>
  )
}

/** Groups slots together. Use two with a separator between for a 3 and 3 code. */
function InputOTPGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="input-otp-group" className={cn('flex items-center', className)} {...props} />
  )
}

export interface InputOTPSlotProps extends React.ComponentProps<'div'> {
  /** Which character this slot shows, from 0. */
  index: number
}

function InputOTPSlot({ index, className, ...props }: InputOTPSlotProps) {
  const { value, focused, caret } = useInputOTP()
  const char = value[index]
  const active = focused && index === caret

  return (
    <div
      data-slot="input-otp-slot"
      data-active={active ? '' : undefined}
      data-filled={char ? '' : undefined}
      className={cn(
        'relative flex h-10 w-10 items-center justify-center border-input border-y border-r text-base shadow-xs transition-[color,box-shadow] first:rounded-l-lg first:border-l last:rounded-r-lg data-[active]:z-10 data-[active]:border-ring data-[active]:ring-[3px] data-[active]:ring-ring/50 dark:bg-input/30',
        className,
      )}
      {...props}
    >
      {char}
      {active && !char && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <span className="h-4 w-px animate-[blink_1s_steps(2)_infinite] bg-foreground" />
        </span>
      )}
    </div>
  )
}

function InputOTPSeparator({ className, children, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="input-otp-separator"
      aria-hidden
      className={cn('text-muted-foreground', className)}
      {...props}
    >
      {children ?? <MinusIcon className="size-4" />}
    </div>
  )
}

export { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, useInputOTP }
