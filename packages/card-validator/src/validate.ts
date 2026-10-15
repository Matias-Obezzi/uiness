export type CardBrand =
  | 'visa'
  | 'mastercard'
  | 'amex'
  | 'discover'
  | 'diners'
  | 'jcb'
  | 'unionpay'
  | 'unknown'

interface BrandRule {
  /** First digits that identify the brand. */
  pattern: RegExp
  /** Valid numbers are one of these long. */
  lengths: number[]
  /** Digits in the security code. */
  cvc: number
}

/** Each brand's prefixes, lengths and security code, checked in this order. */
const brands: Record<CardBrand, BrandRule> = {
  amex: { pattern: /^3[47]/, lengths: [15], cvc: 4 },
  visa: { pattern: /^4/, lengths: [13, 16, 19], cvc: 3 },
  mastercard: {
    pattern: /^(5[1-5]|222[1-9]|22[3-9]\d|2[3-6]\d\d|27[01]\d|2720)/,
    lengths: [16],
    cvc: 3,
  },
  diners: { pattern: /^3(0[0-5]|[689])/, lengths: [14, 16, 19], cvc: 3 },
  discover: { pattern: /^(6011|65|64[4-9])/, lengths: [16, 19], cvc: 3 },
  jcb: { pattern: /^35(2[89]|[3-8])/, lengths: [16, 17, 18, 19], cvc: 3 },
  unionpay: { pattern: /^62/, lengths: [16, 17, 18, 19], cvc: 3 },
  // Local brands (Cabal, Naranja, Elo, RuPay…): any length a card number can have.
  unknown: { pattern: /$^/, lengths: [12, 13, 14, 15, 16, 17, 18, 19], cvc: 3 },
}

const digitsOf = (text: string) => text.replace(/\D/g, '')

/** The brand a number belongs to, from its first digits. */
export function cardBrand(number: string): CardBrand {
  const digits = digitsOf(number)
  const found = (Object.keys(brands) as CardBrand[]).find((b) => brands[b].pattern.test(digits))
  return found ?? 'unknown'
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

/** Whether `MM/YY` is a real month, not before this one. */
export function expiryState(expiry: string, now = new Date()): 'valid' | 'invalid' | 'expired' {
  const match = /^(\d{2})\/?(\d{2})$/.exec(expiry.trim())
  const month = Number(match?.[1])
  if (!match || month < 1 || month > 12) return 'invalid'
  // Good through the last day of its month.
  return new Date(2000 + Number(match[2]), month, 1) > now ? 'valid' : 'expired'
}

/**
 * The first digits that name the issuer, the only part of a number that may be sent to a
 * lookup: 6 digits, or `null` until there are.
 */
export function binOf(number: string) {
  const digits = digitsOf(number)
  // shortcut: 6 digits, the length every lookup knows; newer 8-digit BINs answer for their
  // first 6 too, so send `digits.slice(0, 8)` once a lookup needs to tell them apart.
  return digits.length >= 6 ? digits.slice(0, 6) : null
}

export interface CardCheck {
  brand: CardBrand
  /** Every field given is well formed. */
  valid: boolean
  /** A code per field that is not. */
  errors: {
    number?: 'invalid'
    expiry?: 'invalid' | 'expired'
    cvc?: 'invalid'
  }
}

/**
 * The checks a card form makes in the browser, again where they can be trusted: the number
 * against its brand's lengths and Luhn digit, the expiry against today, the code against the
 * brand's length. Only the fields given are checked.
 */
export function validateCard(
  card: { number: string; expiry?: string; cvc?: string },
  now = new Date(),
): CardCheck {
  const number = digitsOf(card.number)
  const brand = cardBrand(number)
  const rule = brands[brand]
  const errors: CardCheck['errors'] = {}
  if (!(rule.lengths.includes(number.length) && luhn(number))) errors.number = 'invalid'
  if (card.expiry !== undefined) {
    const state = expiryState(card.expiry, now)
    if (state !== 'valid') errors.expiry = state
  }
  if (card.cvc !== undefined && !new RegExp(`^\\d{${rule.cvc}}$`).test(card.cvc))
    errors.cvc = 'invalid'
  return { brand, valid: Object.keys(errors).length === 0, errors }
}
