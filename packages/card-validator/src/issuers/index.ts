import { ar } from './ar'
import { br } from './br'
import { global } from './global'
import type { Issuer, IssuerBrand } from './types'

export type { Issuer, IssuerBrand } from './types'

/**
 * The issuers the community has added, one file per country in `src/issuers`. Pass your own
 * before them to add or override: `[...mine, ...issuers]`, the first match wins.
 */
export const issuers: Issuer[] = [...ar, ...br, ...global]

/**
 * The issuer of a card: by a BIN prefix it lists first, then by the bank name a lookup gave,
 * in the countries the entry names. `null` when nothing matches.
 */
export function findIssuer(
  card: { bin: string; bank?: string; countryCode?: string },
  list: Issuer[] = issuers,
): Issuer | null {
  const byBin = list.find((i) => i.bins?.some((prefix) => card.bin.startsWith(prefix)))
  if (byBin) return byBin
  const { bank, countryCode } = card
  if (!bank) return null
  return (
    list.find(
      (i) =>
        i.match.test(bank) &&
        (!i.countries || (!!countryCode && i.countries.includes(countryCode))),
    ) ?? null
  )
}

/** What is sent for an issuer: the brand, without how it was matched. */
export const brandOf = ({
  id,
  name,
  background,
  foreground,
  icon,
  website,
}: Issuer): IssuerBrand => ({
  id,
  name,
  background,
  foreground,
  ...(icon && { icon }),
  ...(website && { website }),
})
