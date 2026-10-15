'use client'

import { NfcIcon } from 'lucide-react'
import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export type CardBrand =
  | 'visa'
  | 'mastercard'
  | 'amex'
  | 'discover'
  | 'diners'
  | 'jcb'
  | 'unionpay'
  | 'unknown'

export interface CardBrandInfo {
  name: string
  /** First digits that identify the brand. */
  pattern: RegExp
  /** Where a space goes in the number, counted in digits. */
  gaps: number[]
  /** Valid numbers are one of these long. */
  lengths: number[]
  /** Digits in the security code. */
  cvc: number
  /** Whether the security code is printed on the front, as on American Express. */
  cvcOnFront: boolean
}

const standard = { gaps: [4, 8, 12], cvc: 3, cvcOnFront: false }

/** Each brand's prefixes, number layout and security code, checked in this order. */
export const cardBrands: Record<CardBrand, CardBrandInfo> = {
  amex: {
    name: 'American Express',
    pattern: /^3[47]/,
    gaps: [4, 10],
    lengths: [15],
    cvc: 4,
    cvcOnFront: true,
  },
  visa: { ...standard, name: 'Visa', pattern: /^4/, lengths: [13, 16, 19] },
  mastercard: {
    ...standard,
    name: 'Mastercard',
    pattern: /^(5[1-5]|222[1-9]|22[3-9]\d|2[3-6]\d\d|27[01]\d|2720)/,
    lengths: [16],
  },
  diners: {
    ...standard,
    name: 'Diners Club',
    pattern: /^3(0[0-5]|[689])/,
    gaps: [4, 10],
    lengths: [14, 16, 19],
  },
  discover: { ...standard, name: 'Discover', pattern: /^(6011|65|64[4-9])/, lengths: [16, 19] },
  jcb: { ...standard, name: 'JCB', pattern: /^35(2[89]|[3-8])/, lengths: [16, 17, 18, 19] },
  unionpay: { ...standard, name: 'UnionPay', pattern: /^62/, lengths: [16, 17, 18, 19] },
  unknown: { ...standard, name: 'Card', pattern: /$^/, lengths: [16] },
}

const digitsOf = (text: string) => text.replace(/\D/g, '')

/** The brand a number belongs to, from its first digits. */
export function cardBrand(number: string): CardBrand {
  const digits = digitsOf(number)
  const found = (Object.keys(cardBrands) as CardBrand[]).find((brand) =>
    cardBrands[brand].pattern.test(digits),
  )
  return found ?? 'unknown'
}

/** Characters spaced at the brand's gaps. */
const group = (chars: string, gaps: number[]) =>
  Array.from(chars, (char, i) => (gaps.includes(i) ? ` ${char}` : char)).join('')

/** Digits with the brand's spaces: `4242 4242 4242 4242`, `3782 822463 10005`. */
export function formatCardNumber(number: string, brand = cardBrand(number)) {
  return group(digitsOf(number), cardBrands[brand].gaps)
}

/** The Luhn checksum every card number carries in its last digit. */
export function luhn(number: string) {
  const digits = digitsOf(number)
  if (!digits) return false
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i])
    if (i % 2 === 1) d = d * 2 > 9 ? d * 2 - 9 : d * 2
    sum += d
  }
  return sum % 10 === 0
}

/**
 * Whether a number is as long as it gets: the brand's longest, or 16 where 16 is allowed, the
 * length nearly every Visa and Mastercard has. A longer Visa can still be typed after it.
 */
const complete = (digits: string, info: CardBrandInfo) =>
  digits.length === Math.max(...info.lengths) || (digits.length === 16 && info.lengths.includes(16))

/** Whether `MM/YY` is a real month, not before this one. */
export function expiryState(expiry: string, now = new Date()): 'valid' | 'invalid' | 'expired' {
  const match = /^(\d{2})\/(\d{2})$/.exec(expiry)
  const month = Number(match?.[1])
  if (!match || month < 1 || month > 12) return 'invalid'
  // Good through the last day of its month.
  return new Date(2000 + Number(match[2]), month, 1) > now ? 'valid' : 'expired'
}

export type CardField = 'number' | 'name' | 'expiry' | 'cvc'

export interface CreditCardLabels {
  /** What screen readers hear for a card shown on its own. */
  summary: (brand: string, last4: string) => string
  holder: string
  expires: string
  /** Shown on the card before a name is typed. */
  namePlaceholder: string
  number: string
  name: string
  expiry: string
  cvc: string
  /** Where to find the security code, for the brand being typed. */
  cvcHint: (digits: number, onFront: boolean) => string
  invalidNumber: string
  missingName: string
  invalidExpiry: string
  expired: string
  invalidCvc: (digits: number) => string
}

export const defaultCreditCardLabels: CreditCardLabels = {
  summary: (brand, last4) => (last4 ? `${brand} card ending in ${last4}` : `${brand} card`),
  holder: 'Card holder',
  expires: 'Expires',
  namePlaceholder: 'Full name',
  number: 'Card number',
  name: 'Name on card',
  expiry: 'Expiry date',
  cvc: 'Security code',
  cvcHint: (digits, onFront) =>
    onFront ? `${digits} digits on the front, above the number` : `${digits} digits on the back`,
  invalidNumber: 'Check the card number',
  missingName: 'Enter the name on the card',
  invalidExpiry: 'Use the MM/YY on the card',
  expired: 'This card has expired',
  invalidCvc: (digits) => `Enter the ${digits}-digit code`,
}

/** Each brand's mark, drawn as type rather than a logo file. */
function BrandMark({ brand, className }: { brand: CardBrand; className?: string }) {
  if (brand === 'unknown') return null
  if (brand === 'visa')
    return <span className={cn('font-black text-2xl italic tracking-tight', className)}>VISA</span>
  if (brand === 'mastercard')
    // The brand's own red and yellow: the mark people recognize, not theme colors.
    return (
      <span className={cn('flex', className)}>
        <span className="size-7 rounded-full bg-[#eb001b]" />
        <span className="-ml-3 size-7 rounded-full bg-[#f79e1b]/90" />
      </span>
    )
  if (brand === 'amex')
    return (
      <span
        className={cn(
          'rounded border-2 border-current px-1 text-center font-black text-[10px] leading-tight',
          className,
        )}
      >
        AMERICAN
        <br />
        EXPRESS
      </span>
    )
  return (
    <span className={cn('font-bold text-lg tracking-tight', className)}>
      {cardBrands[brand].name}
    </span>
  )
}

/** Brand surfaces from the theme's chart colors, so the cards follow any theme. */
const surfaces: Record<CardBrand, string> = {
  visa: 'from-chart-1 via-chart-1 to-chart-4',
  // Dark, so the mark's red and yellow circles stand out on it.
  mastercard: 'from-neutral-700 via-neutral-900 to-chart-5',
  amex: 'from-chart-2 via-chart-2 to-chart-1',
  discover: 'from-chart-3 to-chart-5',
  diners: 'from-chart-4 to-chart-1',
  jcb: 'from-chart-2 to-chart-4',
  unionpay: 'from-chart-5 to-chart-1',
  // No brand yet: a plain graphite card, readable in both modes.
  unknown: 'from-neutral-600 to-neutral-900',
}

/** A field printed on the card, outlined while it is being typed. */
const printed = (on: boolean) =>
  cn(
    'rounded-md px-1.5 py-0.5 outline-2 outline-transparent outline-solid transition-[outline-color,background-color] duration-(--duration-normal,200ms)',
    on && 'bg-white/10 outline-white/70',
  )

export interface CreditCardProps extends React.ComponentProps<'div'> {
  number?: string
  name?: string
  /** `MM/YY`. */
  expiry?: string
  cvc?: string
  /**
   * The field being typed, outlined on the card. On the security code of a brand that prints it
   * on the back, the card turns over.
   */
  focused?: CardField | null
  /** Show only the last four digits, for a saved card. */
  masked?: boolean
  /** Show the back, whatever is focused. */
  flipped?: boolean
  labels?: Partial<CreditCardLabels>
}

/**
 * A payment card drawn from what is typed: the brand found from the first digits, the number
 * spaced the brand's way, the name and expiry. Most brands print the security code on the back,
 * so the card turns over while it is typed; American Express prints it on the front, where it
 * is outlined instead.
 */
function CreditCard({
  number = '',
  name = '',
  expiry = '',
  cvc = '',
  focused = null,
  masked = false,
  flipped,
  labels: labelsProp,
  className,
  ...props
}: CreditCardProps) {
  const labels = useLabels('credit-card', defaultCreditCardLabels, labelsProp)
  const digits = digitsOf(number)
  const brand = cardBrand(digits)
  const info = cardBrands[brand]
  // Typed digits, then dots up to a full number; a saved card shows its last four only.
  const full = Math.max(Math.min(...info.lengths.filter((l) => l >= 15)), digits.length)
  const shown = masked
    ? digits.slice(0, -4).replace(/\d/g, '•') + digits.slice(-4)
    : digits.padEnd(full, '•')
  const back = flipped ?? (focused === 'cvc' && !info.cvcOnFront)
  const code = cvc || '•'.repeat(info.cvc)

  return (
    <div
      data-slot="credit-card"
      data-brand={brand}
      role="img"
      aria-label={labels.summary(info.name, digits.slice(-4))}
      className={cn(
        '@container aspect-[1.586] w-full max-w-sm select-none [perspective:1200px]',
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          'relative size-full transition-transform duration-700 ease-(--easing-emphasized,cubic-bezier(0.16,1,0.3,1)) [transform-style:preserve-3d] motion-reduce:transition-none',
          back && '[transform:rotateY(180deg)]',
        )}
      >
        {/* The front: light on the card's color whatever the theme, like a printed card. */}
        <div
          className={cn(
            'absolute inset-0 flex flex-col justify-between overflow-hidden rounded-2xl bg-linear-to-br p-[6%] text-white shadow-xl [backface-visibility:hidden]',
            surfaces[brand],
          )}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgb(255_255_255/0.25),transparent_55%)]"
          />
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-2">
              {/* The chip, gold as chips are. */}
              <span className="grid h-8 w-11 grid-cols-3 gap-px overflow-hidden rounded-md bg-amber-200/90 p-1 shadow-inner">
                {Array.from({ length: 6 }, (_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: the chip's contacts are positions
                  <span key={i} className="rounded-[2px] bg-amber-400/70" />
                ))}
              </span>
              <NfcIcon aria-hidden="true" className="size-6 opacity-80" />
            </div>
            <BrandMark brand={brand} />
          </div>

          {info.cvcOnFront && !masked && (
            <span
              className={cn(
                'relative -mb-3 self-end font-mono text-sm tracking-widest',
                printed(focused === 'cvc'),
              )}
            >
              {code}
            </span>
          )}

          <p
            className={cn(
              'relative self-start whitespace-pre font-mono text-[clamp(0.95rem,6.4cqi,1.5rem)] tracking-[0.1em] [text-shadow:0_1px_2px_rgb(0_0_0/0.3)]',
              printed(focused === 'number'),
            )}
          >
            {group(shown, info.gaps)}
          </p>

          <div className="relative flex items-end justify-between gap-3 text-xs">
            <div className={cn('min-w-0', printed(focused === 'name'))}>
              <span className="block text-[10px] uppercase tracking-widest opacity-70">
                {labels.holder}
              </span>
              <span className="block truncate font-medium uppercase tracking-wider">
                {name || labels.namePlaceholder}
              </span>
            </div>
            <div className={cn('shrink-0 text-right', printed(focused === 'expiry'))}>
              <span className="block text-[10px] uppercase tracking-widest opacity-70">
                {labels.expires}
              </span>
              <span className="block font-medium font-mono tracking-wider">
                {expiry || 'MM/YY'}
              </span>
            </div>
          </div>
        </div>

        {/* The back: the stripe, and the signature panel with the code. */}
        <div
          className={cn(
            'absolute inset-0 flex flex-col overflow-hidden rounded-2xl bg-linear-to-br text-white shadow-xl [backface-visibility:hidden] [transform:rotateY(180deg)]',
            surfaces[brand],
          )}
        >
          <span aria-hidden="true" className="mt-[8%] h-[18%] bg-neutral-950/85" />
          <div className="mt-[6%] flex items-center gap-2 px-[6%]">
            {/* A printed signature panel: white with dark ink, as on the card itself. */}
            <span className="h-9 flex-1 rounded bg-[repeating-linear-gradient(45deg,#f5f5f5_0_6px,#e5e5e5_6px_12px)]" />
            <span
              className={cn(
                'flex h-9 min-w-14 items-center justify-center bg-white font-mono text-neutral-900 italic',
                printed(focused === 'cvc'),
                focused === 'cvc' && 'bg-white',
              )}
            >
              {code}
            </span>
          </div>
          <BrandMark brand={brand} className="mt-auto mr-[6%] mb-[6%] self-end" />
        </div>
      </div>
    </div>
  )
}

export interface CardValue {
  /** Digits only. */
  number: string
  name: string
  /** `MM/YY`. */
  expiry: string
  cvc: string
}

export interface CardDetails {
  brand: CardBrand
  /** Every field complete and well formed. */
  valid: boolean
  errors: Partial<Record<CardField, string>>
}

/** What is wrong with each field, if anything. */
function check(value: CardValue, labels: CreditCardLabels): CardDetails {
  const brand = cardBrand(value.number)
  const info = cardBrands[brand]
  const errors: CardDetails['errors'] = {}
  if (!(info.lengths.includes(value.number.length) && luhn(value.number)))
    errors.number = labels.invalidNumber
  if (!value.name.trim()) errors.name = labels.missingName
  const expiry = expiryState(value.expiry)
  if (expiry !== 'valid')
    errors.expiry = expiry === 'expired' ? labels.expired : labels.invalidExpiry
  if (value.cvc.length !== info.cvc) errors.cvc = labels.invalidCvc(info.cvc)
  return { brand, valid: Object.keys(errors).length === 0, errors }
}

export interface CreditCardFormProps
  extends Omit<React.ComponentProps<'div'>, 'onChange' | 'defaultValue'> {
  defaultValue?: Partial<CardValue>
  /** Every change, with the brand, whether it is all valid and what is wrong. */
  onChange?: (value: CardValue, details: CardDetails) => void
  /** Field names, for a plain form submission. Default `number`, `name`, `expiry` and `cvc`. */
  names?: Partial<Record<CardField, string>>
  labels?: Partial<CreditCardLabels>
}

/**
 * The card above its fields, kept in step: typing fills the card, the field being typed is
 * outlined on it, and it turns over for a security code printed on the back. The number is
 * spaced as it is typed, checked against the brand's lengths and its Luhn digit; the expiry
 * against today; the code against the brand's length. A finished field moves on to the next.
 * Fields carry the `cc-` autocomplete names, so browsers and password managers can fill them.
 */
function CreditCardForm({
  defaultValue,
  onChange,
  names,
  labels: labelsProp,
  className,
  ...props
}: CreditCardFormProps) {
  const labels = useLabels('credit-card', defaultCreditCardLabels, labelsProp)
  const id = React.useId()
  const [value, setValue] = React.useState<CardValue>({
    number: digitsOf(defaultValue?.number ?? ''),
    name: defaultValue?.name ?? '',
    expiry: defaultValue?.expiry ?? '',
    cvc: defaultValue?.cvc ?? '',
  })
  const [focused, setFocused] = React.useState<CardField | null>(null)
  const [touched, setTouched] = React.useState<Partial<Record<CardField, boolean>>>({})
  // On to the next field, found by its id: only ever from a change handler.
  const focus = (f: CardField) => document.getElementById(`${id}-${f}`)?.focus()
  const onChangeRef = React.useRef(onChange)
  React.useEffect(() => {
    onChangeRef.current = onChange
  })

  const info = cardBrands[cardBrand(value.number)]
  const { errors } = check(value, labels)

  const update = (patch: Partial<CardValue>) => {
    const next = { ...value, ...patch }
    setValue(next)
    onChangeRef.current?.(next, check(next, labels))
  }

  const onNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget
    const digits = digitsOf(input.value).slice(
      0,
      Math.max(...cardBrands[cardBrand(input.value)].lengths),
    )
    // Spaces are put back on every keystroke: keep the caret after the digit it followed.
    const before = digitsOf(input.value.slice(0, input.selectionStart ?? input.value.length)).length
    const formatted = formatCardNumber(digits)
    let at = 0
    for (let seen = 0; at < formatted.length && seen < before; at++) {
      if (formatted[at] !== ' ') seen++
    }
    update({ number: digits })
    requestAnimationFrame(() => input.setSelectionRange(at, at))
    if (complete(digits, cardBrands[cardBrand(digits)]) && luhn(digits)) focus('name')
  }

  const onExpiry = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.currentTarget.value
    const deleting = raw.length < value.expiry.length
    let digits = digitsOf(raw).slice(0, 4)
    // A month can only start with 0 or 1: "4" is April.
    if (digits.length === 1 && Number(digits) > 1) digits = `0${digits}`
    // The slash appears after the month, but not while deleting back over it.
    const next =
      digits.length > 2 || (digits.length === 2 && !deleting)
        ? `${digits.slice(0, 2)}/${digits.slice(2)}`
        : digits
    update({ expiry: next })
    if (expiryState(next) === 'valid') focus('cvc')
  }

  // A field shows its error once left, or a number once it is as long as it gets.
  const shows = (f: CardField) =>
    Boolean(errors[f]) && (touched[f] || (f === 'number' && complete(value.number, info)))
  const fieldProps = (f: CardField) => ({
    id: `${id}-${f}`,
    name: names?.[f] ?? f,
    'aria-invalid': shows(f) || undefined,
    'aria-describedby': shows(f) ? `${id}-${f}-error` : f === 'cvc' ? `${id}-cvc-hint` : undefined,
    onFocus: () => setFocused(f),
    onBlur: () => {
      setFocused((current) => (current === f ? null : current))
      setTouched((t) => ({ ...t, [f]: true }))
    },
  })
  const error = (f: CardField) =>
    shows(f) ? (
      <p id={`${id}-${f}-error`} className="text-destructive text-xs">
        {errors[f]}
      </p>
    ) : null

  return (
    <div
      data-slot="credit-card-form"
      className={cn('grid w-full max-w-sm gap-6', className)}
      {...props}
    >
      {/* The fields are what assistive tech reads; the card only repeats them. */}
      <CreditCard
        aria-hidden="true"
        number={value.number}
        name={value.name}
        expiry={value.expiry}
        cvc={value.cvc}
        focused={focused}
        labels={labelsProp}
      />
      <div className="grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor={`${id}-number`}>{labels.number}</Label>
          <Input
            {...fieldProps('number')}
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="1234 1234 1234 1234"
            value={formatCardNumber(value.number)}
            onChange={onNumber}
            className="font-mono tabular-nums"
          />
          {error('number')}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`${id}-name`}>{labels.name}</Label>
          <Input
            {...fieldProps('name')}
            autoComplete="cc-name"
            autoCapitalize="characters"
            value={value.name}
            onChange={(e) => update({ name: e.currentTarget.value })}
          />
          {error('name')}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor={`${id}-expiry`}>{labels.expiry}</Label>
            <Input
              {...fieldProps('expiry')}
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="MM/YY"
              value={value.expiry}
              onChange={onExpiry}
              className="font-mono tabular-nums"
            />
            {error('expiry')}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`${id}-cvc`}>{labels.cvc}</Label>
            <Input
              {...fieldProps('cvc')}
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder={'•'.repeat(info.cvc)}
              value={value.cvc}
              onChange={(e) => update({ cvc: digitsOf(e.currentTarget.value).slice(0, info.cvc) })}
              className="font-mono tabular-nums"
            />
            {error('cvc') ?? (
              <p id={`${id}-cvc-hint`} className="text-muted-foreground text-xs">
                {labels.cvcHint(info.cvc, info.cvcOnFront)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export { CreditCard, CreditCardForm }
