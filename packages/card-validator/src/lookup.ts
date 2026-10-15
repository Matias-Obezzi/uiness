import {
  brandOf,
  issuers as communityIssuers,
  findIssuer,
  type Issuer,
  type IssuerBrand,
} from './issuers'

/** What a card's first digits say about it. Any field the lookup does not know is left out. */
export interface CardInfo {
  bin: string
  /** The network: `visa`, `mastercard`, `amex`… */
  scheme?: string
  type?: 'debit' | 'credit'
  prepaid?: boolean
  /** The product line, such as `World Debit Embossed`. */
  product?: string
  /** The bank or fintech that issued the card. */
  bank?: string
  country?: string
  /** ISO 3166 alpha-2, such as `AR`. */
  countryCode?: string
  /** Its colors, mark and name from the issuer list, when the bank is on it. */
  issuer?: IssuerBrand
}

/** Finds a BIN's details: `null` when no one knows it, a throw when the lookup failed. */
export type BinLookup = (bin: string) => Promise<CardInfo | null>

interface Binlist {
  scheme?: string
  type?: string
  brand?: string
  prepaid?: boolean
  bank?: { name?: string }
  country?: { name?: string; alpha2?: string }
}

/**
 * Asks binlist.net, free and keyless. It refuses browsers (any request with an `Origin`) and
 * allows a few lookups an hour per address, so call it from a server, behind a cache:
 * `createCardHandler` does both.
 */
export const lookupBin: BinLookup = async (bin) => {
  const response = await fetch(`https://lookup.binlist.net/${bin}`, {
    headers: { 'Accept-Version': '3' },
  })
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`binlist answered ${response.status}`)
  const data = (await response.json()) as Binlist
  const type = data.type === 'debit' || data.type === 'credit' ? data.type : undefined
  return {
    bin,
    scheme: data.scheme,
    type,
    prepaid: data.prepaid,
    product: data.brand,
    bank: data.bank?.name,
    country: data.country?.name,
    countryCode: data.country?.alpha2,
  }
}

export interface CardHandlerOptions {
  /** Where details come from. Default `lookupBin`, binlist.net. */
  lookup?: BinLookup
  /** Seconds a shared cache (a CDN) keeps an answer. Default a week: BINs rarely move. */
  maxAge?: number
  /**
   * Matched against each answer to add the issuer's brand. Default the community list,
   * `issuers`; `[...mine, ...issuers]` to add your own, `[]` for none.
   */
  issuers?: Issuer[]
}

const json = (body: unknown, status: number, cache: string) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': cache },
  })

/**
 * A `GET ?bin=123456` endpoint on web `Request` and `Response`, for Next.js route handlers,
 * Vercel and Netlify functions, Hono, Remix, Bun or Deno. It takes 6 to 8 digits and nothing
 * else, so a full card number never reaches it or the lookup behind it. Answers are kept in
 * memory and marked for a CDN to keep; a failed lookup is not kept, so the next one retries.
 */
export function createCardHandler({
  lookup = lookupBin,
  maxAge = 604800,
  issuers = communityIssuers,
}: CardHandlerOptions = {}) {
  const memory = new Map<string, CardInfo | null>()
  const keep = `public, max-age=86400, s-maxage=${maxAge}`
  return async (request: Request) => {
    const bin = new URL(request.url).searchParams.get('bin') ?? ''
    if (!/^\d{6,8}$/.test(bin))
      return json({ error: 'Send the first 6 to 8 digits as ?bin=' }, 400, 'no-store')
    let info = memory.get(bin)
    if (info === undefined) {
      try {
        info = await lookup(bin)
      } catch {
        return json({ error: 'The lookup failed, try again later' }, 502, 'no-store')
      }
      // A BIN the list knows is answered even when the lookup does not know it.
      const issuer = findIssuer({ bin, ...info }, issuers)
      if (issuer) info = { ...info, bin, issuer: brandOf(issuer) }
      // shortcut: forgets everything past 5000 BINs; a CDN in front keeps the rest.
      if (memory.size >= 5000) memory.clear()
      memory.set(bin, info)
    }
    return info ? json(info, 200, keep) : json({ error: 'Unknown BIN' }, 404, keep)
  }
}
