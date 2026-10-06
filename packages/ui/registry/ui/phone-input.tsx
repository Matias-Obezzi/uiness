'use client'

import { CheckIcon, ChevronDownIcon } from 'lucide-react'
import * as React from 'react'
import { useLabels, useLocale } from '@/lib/labels'
import { cn } from '@/lib/utils'
import { Button } from '@/ui/button'
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover'

/* -------------------------------------------------------------------------------------------------
 * Countries. A pattern per country covers the common mobile and landline shapes; it is not
 * a full numbering plan. For that, validate on the server with libphonenumber.
 * -----------------------------------------------------------------------------------------------*/

export interface PhoneCountry {
  /** ISO 3166-1 alpha-2 code, upper case. */
  code: string
  /** English name, used when the browser cannot name the region in the locale. */
  name: string
  /** Country calling code without the plus. */
  dial: string
  /** National number layout, one `#` per digit. */
  pattern: string
  /** A layout for numbers longer than `pattern`, like Argentine mobiles with their extra 9. */
  long?: string
  /** Fewest digits that make a complete number. Default the pattern's length. */
  min?: number
  /** Prefix dialled inside the country and dropped in international format, like the UK's 0. */
  trunk?: string
}

export const phoneCountries: PhoneCountry[] = [
  { code: 'US', name: 'United States', dial: '1', pattern: '(###) ###-####', trunk: '1' },
  { code: 'CA', name: 'Canada', dial: '1', pattern: '(###) ###-####', trunk: '1' },
  { code: 'MX', name: 'Mexico', dial: '52', pattern: '## #### ####' },
  {
    code: 'BR',
    name: 'Brazil',
    dial: '55',
    pattern: '(##) ####-####',
    long: '(##) #####-####',
    trunk: '0',
  },
  {
    code: 'AR',
    name: 'Argentina',
    dial: '54',
    pattern: '## ####-####',
    long: '# ## ####-####',
    trunk: '0',
  },
  { code: 'CL', name: 'Chile', dial: '56', pattern: '# #### ####' },
  { code: 'CO', name: 'Colombia', dial: '57', pattern: '### ### ####' },
  { code: 'PE', name: 'Peru', dial: '51', pattern: '### ### ###', min: 8, trunk: '0' },
  { code: 'UY', name: 'Uruguay', dial: '598', pattern: '## ### ###', trunk: '0' },
  { code: 'VE', name: 'Venezuela', dial: '58', pattern: '### ### ####', trunk: '0' },
  { code: 'GB', name: 'United Kingdom', dial: '44', pattern: '#### ######', trunk: '0' },
  { code: 'IE', name: 'Ireland', dial: '353', pattern: '## ### ####', min: 7, trunk: '0' },
  { code: 'FR', name: 'France', dial: '33', pattern: '# ## ## ## ##', trunk: '0' },
  { code: 'DE', name: 'Germany', dial: '49', pattern: '### ########', min: 7, trunk: '0' },
  { code: 'ES', name: 'Spain', dial: '34', pattern: '### ## ## ##' },
  { code: 'PT', name: 'Portugal', dial: '351', pattern: '### ### ###' },
  // Italian numbers keep their leading 0 in international format, so there is no trunk.
  { code: 'IT', name: 'Italy', dial: '39', pattern: '### ### ####', min: 9 },
  { code: 'NL', name: 'Netherlands', dial: '31', pattern: '# ########', trunk: '0' },
  { code: 'BE', name: 'Belgium', dial: '32', pattern: '### ## ## ##', min: 8, trunk: '0' },
  { code: 'CH', name: 'Switzerland', dial: '41', pattern: '## ### ## ##', trunk: '0' },
  { code: 'AT', name: 'Austria', dial: '43', pattern: '### #######', min: 7, trunk: '0' },
  { code: 'SE', name: 'Sweden', dial: '46', pattern: '## ### ## ##', min: 7, trunk: '0' },
  { code: 'NO', name: 'Norway', dial: '47', pattern: '### ## ###' },
  { code: 'DK', name: 'Denmark', dial: '45', pattern: '## ## ## ##' },
  { code: 'FI', name: 'Finland', dial: '358', pattern: '## ### ####', min: 6, trunk: '0' },
  { code: 'PL', name: 'Poland', dial: '48', pattern: '### ### ###' },
  { code: 'CZ', name: 'Czechia', dial: '420', pattern: '### ### ###' },
  { code: 'GR', name: 'Greece', dial: '30', pattern: '### ### ####' },
  { code: 'TR', name: 'Türkiye', dial: '90', pattern: '### ### ## ##', trunk: '0' },
  { code: 'RU', name: 'Russia', dial: '7', pattern: '### ###-##-##', trunk: '8' },
  { code: 'UA', name: 'Ukraine', dial: '380', pattern: '## ### ## ##', trunk: '0' },
  { code: 'IL', name: 'Israel', dial: '972', pattern: '##-###-####', min: 8, trunk: '0' },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    dial: '971',
    pattern: '## ### ####',
    min: 8,
    trunk: '0',
  },
  { code: 'SA', name: 'Saudi Arabia', dial: '966', pattern: '## ### ####', min: 8, trunk: '0' },
  { code: 'EG', name: 'Egypt', dial: '20', pattern: '### ### ####', min: 9, trunk: '0' },
  { code: 'NG', name: 'Nigeria', dial: '234', pattern: '### ### ####', min: 8, trunk: '0' },
  { code: 'KE', name: 'Kenya', dial: '254', pattern: '### ######', trunk: '0' },
  { code: 'ZA', name: 'South Africa', dial: '27', pattern: '## ### ####', trunk: '0' },
  { code: 'IN', name: 'India', dial: '91', pattern: '##### #####', trunk: '0' },
  { code: 'PK', name: 'Pakistan', dial: '92', pattern: '### #######', min: 9, trunk: '0' },
  { code: 'CN', name: 'China', dial: '86', pattern: '### #### ####', min: 10, trunk: '0' },
  { code: 'JP', name: 'Japan', dial: '81', pattern: '##-####-####', min: 9, trunk: '0' },
  { code: 'KR', name: 'South Korea', dial: '82', pattern: '##-####-####', min: 9, trunk: '0' },
  { code: 'SG', name: 'Singapore', dial: '65', pattern: '#### ####' },
  { code: 'ID', name: 'Indonesia', dial: '62', pattern: '###-####-#####', min: 9, trunk: '0' },
  { code: 'PH', name: 'Philippines', dial: '63', pattern: '### ### ####', trunk: '0' },
  { code: 'TH', name: 'Thailand', dial: '66', pattern: '## ### ####', min: 8, trunk: '0' },
  { code: 'VN', name: 'Vietnam', dial: '84', pattern: '## #### ####', min: 9, trunk: '0' },
  { code: 'MY', name: 'Malaysia', dial: '60', pattern: '##-#### ####', min: 9, trunk: '0' },
  { code: 'AU', name: 'Australia', dial: '61', pattern: '### ### ###', trunk: '0' },
  { code: 'NZ', name: 'New Zealand', dial: '64', pattern: '## ### ####', min: 8, trunk: '0' },
]

/** The country's flag as an emoji, from its two regional indicator letters. */
export function flagEmoji(code: string) {
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)))
}

const digitsOf = (s: string) => s.replace(/\D/g, '')
const slots = (pattern: string) => (pattern.match(/#/g) ?? []).length
const maxDigits = (c: PhoneCountry) => slots(c.long ?? c.pattern)
/** The layout for this many digits: the long one once the short one is full. */
const patternFor = (c: PhoneCountry, digits: number) =>
  c.long && digits > slots(c.pattern) ? c.long : c.pattern

/** Lay digits out on a pattern. A separator only shows once a digit follows it. */
export function formatPhone(digits: string, pattern: string) {
  let out = ''
  let i = 0
  for (const ch of pattern) {
    if (i >= digits.length) break
    if (ch === '#') out += digits[i++]
    else out += ch
  }
  return out + digits.slice(i)
}

/**
 * Split an international number into its country and national digits. The longest calling
 * code wins, and among countries sharing one (the US and Canada) `prefer` breaks the tie.
 */
export function parsePhone(
  input: string,
  countries: PhoneCountry[] = phoneCountries,
  prefer?: string,
): { country: PhoneCountry; national: string } | null {
  const digits = digitsOf(input.trim().replace(/^00/, '+'))
  for (let len = 3; len >= 1; len--) {
    const dial = digits.slice(0, len)
    const matches = countries.filter((c) => c.dial === dial)
    if (matches.length === 0) continue
    const country = matches.find((c) => c.code === prefer) ?? matches[0]
    if (!country) continue
    return { country, national: stripTrunk(digits.slice(len), country) }
  }
  return null
}

function stripTrunk(national: string, country: PhoneCountry) {
  const { trunk } = country
  return trunk && national.startsWith(trunk) ? national.slice(trunk.length) : national
}

function regionFor(locale?: string) {
  try {
    return new Intl.Locale(locale ?? navigator.language).maximize().region
  } catch {
    return undefined
  }
}

/* -------------------------------------------------------------------------------------------------
 * Props
 * -----------------------------------------------------------------------------------------------*/

export interface PhoneValueDetails {
  country: PhoneCountry
  /** National digits, without the trunk prefix. */
  national: string
  /** True when the digit count fits the country's pattern. Not a guarantee the number exists. */
  complete: boolean
}

export interface PhoneInputLabels {
  /** Name of the country button, before the picked country. */
  country: string
  /** Placeholder of the country search. */
  search: string
  /** Shown when no country matches the search. */
  empty: string
}

export const defaultPhoneInputLabels: PhoneInputLabels = {
  country: 'Country',
  search: 'Search countries…',
  empty: 'No country found.',
}

export interface PhoneInputProps
  extends Omit<
    React.ComponentProps<'input'>,
    'value' | 'defaultValue' | 'onChange' | 'type' | 'size'
  > {
  /** The number in E.164, like "+447911123456". Empty when there are no digits. Controlled. */
  value?: string
  /** The starting number when uncontrolled. */
  defaultValue?: string
  /** Called with the number in E.164 on every edit, and details about it. */
  onValueChange?: (value: string, details: PhoneValueDetails) => void
  /** The picked country code, like "GB". Controlled. */
  country?: string
  /** The starting country. Default the locale's region, or the US. */
  defaultCountry?: string
  onCountryChange?: (country: string) => void
  /** Limit and order the list, by ISO code. Default every built in country. */
  countries?: string[]
  /** BCP 47 locale for the country names. Default the browser's. */
  locale?: string
  /** Words to use instead of the English ones. A `LabelsProvider` sets them for the whole app. */
  labels?: Partial<PhoneInputLabels>
  /** Classes for the input. `className` goes on the wrapper. */
  inputClassName?: string
}

/* -------------------------------------------------------------------------------------------------
 * PhoneInput
 * -----------------------------------------------------------------------------------------------*/

/**
 * A phone field with a searchable country picker. The number is laid out as it is typed,
 * a pasted "+44 …" picks the country by itself, and the value comes out in E.164.
 */
function PhoneInput({
  value: valueProp,
  defaultValue,
  onValueChange,
  country: countryProp,
  defaultCountry,
  onCountryChange,
  countries: countryCodes,
  locale: localeProp,
  labels: labelsProp,
  className,
  inputClassName,
  disabled,
  name,
  placeholder,
  onKeyDown,
  ...props
}: PhoneInputProps) {
  const labels = useLabels('phone-input', defaultPhoneInputLabels, labelsProp)
  const locale = useLocale(localeProp)
  const list = React.useMemo(() => {
    if (!countryCodes) return phoneCountries
    return countryCodes
      .map((code) => phoneCountries.find((c) => c.code === code.toUpperCase()))
      .filter((c): c is PhoneCountry => !!c)
  }, [countryCodes])

  const byCode = (code?: string) => list.find((c) => c.code === code?.toUpperCase())
  const fallback = (): PhoneCountry =>
    byCode(defaultCountry) ??
    byCode(regionFor(locale)) ??
    byCode('US') ??
    list[0] ??
    (phoneCountries[0] as PhoneCountry)

  const [state, setState] = React.useState(() => {
    const initial = valueProp ?? defaultValue
    const parsed = initial ? parsePhone(initial, list, countryProp ?? defaultCountry) : null
    return {
      country: byCode(countryProp) ?? parsed?.country ?? fallback(),
      national: parsed?.national ?? '',
    }
  })
  const country = byCode(countryProp) ?? state.country
  const national = state.national.slice(0, maxDigits(country))
  const e164 = national ? `+${country.dial}${national}` : ''

  // "+3" names no country yet. Hold the typed text until the calling code is complete.
  const [pending, setPending] = React.useState<string | null>(null)

  // An outside change to a controlled value is parsed again. Our own echo is left alone.
  const [seen, setSeen] = React.useState(valueProp)
  if (valueProp !== undefined && valueProp !== seen) {
    setSeen(valueProp)
    if (valueProp !== e164) {
      setPending(null)
      const parsed = parsePhone(valueProp, list, country.code)
      setState({ country: parsed?.country ?? country, national: parsed?.national ?? '' })
    }
  }

  const inputRef = React.useRef<HTMLInputElement>(null)
  const caret = React.useRef<number | null>(null)
  const [open, setOpen] = React.useState(false)

  const commit = (nextCountry: PhoneCountry, nextNational: string) => {
    const digits = nextNational.slice(0, maxDigits(nextCountry))
    setState({ country: nextCountry, national: digits })
    if (nextCountry.code !== country.code) onCountryChange?.(nextCountry.code)
    const next = digits ? `+${nextCountry.dial}${digits}` : ''
    if (valueProp !== undefined) setSeen(next)
    if (next !== e164 || nextCountry.code !== country.code) {
      onValueChange?.(next, {
        country: nextCountry,
        national: digits,
        complete:
          digits.length >= (nextCountry.min ?? slots(nextCountry.pattern)) &&
          digits.length <= maxDigits(nextCountry),
      })
    }
  }

  const display = pending ?? formatPhone(national, patternFor(country, national.length))

  // Put the caret back after the same number of digits it was after before formatting.
  React.useLayoutEffect(() => {
    const input = inputRef.current
    if (caret.current === null || !input || document.activeElement !== input) return
    let seenDigits = 0
    let pos = 0
    while (pos < display.length && seenDigits < caret.current) {
      if (/\d/.test(display[pos] ?? '')) seenDigits++
      pos++
    }
    caret.current = null
    input.setSelectionRange(pos, pos)
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const at = e.target.selectionStart ?? raw.length

    // A number typed or pasted with its calling code picks the country.
    if (/^\s*(\+|00)/.test(raw)) {
      const parsed = parsePhone(raw, list, country.code)
      if (parsed) {
        setPending(null)
        caret.current = parsed.national.length
        commit(parsed.country, parsed.national)
      } else {
        setPending(raw.trim().slice(0, 5))
        if (national) commit(country, '')
      }
      return
    }
    setPending(null)

    let digits = digitsOf(raw)
    let before = digitsOf(raw.slice(0, at)).length
    // Deleting a separator alone would come straight back; take the digit next to it too.
    const inputType = (e.nativeEvent as InputEvent).inputType
    if (pending === null && digits === national && raw.length < display.length) {
      if (inputType === 'deleteContentForward') {
        digits = digits.slice(0, before) + digits.slice(before + 1)
      } else if (before > 0) {
        digits = digits.slice(0, before - 1) + digits.slice(before)
        before -= 1
      }
    }
    // A leading trunk prefix is dropped as it is typed, the number is stored without it.
    const stripped = stripTrunk(digits, country)
    if (stripped !== digits) before = Math.max(0, before - (digits.length - stripped.length))
    caret.current = before
    commit(country, stripped)
  }

  const pickCountry = (code: string) => {
    const next = byCode(code)
    if (!next) return
    setOpen(false)
    commit(next, national)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const names = React.useMemo(() => {
    let display: Intl.DisplayNames | null = null
    try {
      display = new Intl.DisplayNames(locale ? [locale] : undefined, { type: 'region' })
    } catch {}
    return new Map(list.map((c) => [c.code, display?.of(c.code) ?? c.name]))
  }, [list, locale])

  return (
    <div
      data-slot="phone-input"
      data-disabled={disabled ? '' : undefined}
      className={cn('flex w-full min-w-0 data-[disabled]:opacity-50', className)}
    >
      {name && <input type="hidden" name={name} value={e164} />}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            aria-label={`${labels.country}: ${names.get(country.code)} +${country.dial}`}
            data-slot="phone-input-country"
            className="relative h-9 shrink-0 gap-1 rounded-r-none border-r-0 px-2.5 font-normal shadow-xs focus-visible:z-(--z-raised,10) dark:bg-input/30"
          >
            <span aria-hidden className="text-base leading-none">
              {flagEmoji(country.code)}
            </span>
            <span className="text-muted-foreground text-sm tabular-nums">+{country.dial}</span>
            <ChevronDownIcon className="size-3.5 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          data-slot="phone-input-content"
          className="w-72 p-0 motion-reduce:animate-none"
        >
          <Command label={labels.country}>
            <CommandInput placeholder={labels.search} />
            <CommandList className="max-h-64">
              <CommandEmpty>{labels.empty}</CommandEmpty>
              {list.map((c) => (
                <CommandItem
                  key={c.code}
                  value={names.get(c.code) ?? c.name}
                  keywords={[c.code, c.dial, `+${c.dial}`, c.name]}
                  onSelect={() => pickCountry(c.code)}
                >
                  <span aria-hidden className="text-base leading-none">
                    {flagEmoji(c.code)}
                  </span>
                  <span className="truncate">{names.get(c.code)}</span>
                  <span className="ml-auto text-muted-foreground text-xs tabular-nums">
                    +{c.dial}
                  </span>
                  <CheckIcon
                    className={cn('size-4', c.code === country.code ? 'opacity-100' : 'opacity-0')}
                  />
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <input
        ref={inputRef}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        data-slot="phone-input-number"
        disabled={disabled}
        value={display}
        placeholder={placeholder ?? country.pattern.replace(/#/g, '0')}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        className={cn(
          'relative flex h-9 w-full min-w-0 rounded-lg rounded-l-none border border-input bg-transparent px-3 py-1 text-base tabular-nums shadow-xs outline-none transition-[color,box-shadow] selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground/70 disabled:cursor-not-allowed md:text-sm dark:bg-input/30',
          'focus-visible:z-(--z-raised,10) focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
          'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
          inputClassName,
        )}
        {...props}
      />
    </div>
  )
}

export { PhoneInput }
