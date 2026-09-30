export interface ParsedCount {
  prefix: string
  suffix: string
  value: number
  decimals: number
  /** Thousands separator as written, or an empty string. */
  group: string
  /** Decimal separator as written. */
  point: string
}

const NUMBER = /^([^\d]{0,4}?)(\d[\d.,   ]*\d|\d)([^\d]{0,6})$/

/**
 * Reads a number the way it is written on the page, "$12,500+", "4.9", "1.234,5 €", so it can
 * count up and land on exactly the same text. Returns null for anything that is not one number.
 */
export function parseCount(text: string): ParsedCount | null {
  const trimmed = text.trim()
  const match = NUMBER.exec(trimmed)
  if (!match) return null
  const [, prefix = '', body = '', suffix = ''] = match
  if (/\d/.test(prefix) || /\d/.test(suffix)) return null

  const separators = body.replace(/\d/g, '')
  let group = ''
  let point = '.'
  if (separators.length > 0) {
    const last = separators[separators.length - 1] as string
    const lastIndex = body.lastIndexOf(last)
    const digitsAfter = body.length - lastIndex - 1
    const kinds = new Set(separators)
    if (kinds.size > 1) {
      point = last
      group = separators[0] as string
    } else if (separators.length === 1 && digitsAfter !== 3) {
      point = last
    } else {
      group = last
    }
  }

  const decimalAt = group === point ? -1 : body.lastIndexOf(point)
  const integer = (decimalAt >= 0 ? body.slice(0, decimalAt) : body).replace(/\D/g, '')
  const fraction = decimalAt >= 0 ? body.slice(decimalAt + 1).replace(/\D/g, '') : ''
  const value = Number(`${integer}.${fraction || '0'}`)
  if (!Number.isFinite(value)) return null
  return { prefix, suffix, value, decimals: fraction.length, group, point }
}

/** Writes a value with the separators, decimals, prefix and suffix the original used. */
export function formatCount(value: number, parsed: ParsedCount) {
  const fixed = value.toFixed(parsed.decimals)
  const [integer = '0', fraction] = fixed.split('.')
  const grouped = parsed.group ? integer.replace(/\B(?=(\d{3})+(?!\d))/g, parsed.group) : integer
  const body = fraction ? `${grouped}${parsed.point}${fraction}` : grouped
  return `${parsed.prefix}${body}${parsed.suffix}`
}
