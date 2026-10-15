// The issuer behind a card's first digits at /api/card?bin=123456, for the card validator demo.
// It is createCardHandler() from @uiness/card-validator written out: the site's build does not
// build the workspace packages, so a function here cannot import one. Keep the two in step.
const memory = new Map()

export async function GET(/** @type {Request} */ request) {
  const bin = new URL(request.url).searchParams.get('bin') ?? ''
  // 6 to 8 digits and nothing else: a full card number never gets here.
  if (!/^\d{6,8}$/.test(bin)) return answer({ error: 'Send the first 6 to 8 digits as ?bin=' }, 400)
  if (!memory.has(bin)) {
    const res = await fetch(`https://lookup.binlist.net/${bin}`, {
      headers: { 'Accept-Version': '3' },
      signal: AbortSignal.timeout(5000),
    }).catch(() => null)
    if (!res || (!res.ok && res.status !== 404)) return answer({ error: 'The lookup failed' }, 502)
    const data = res.status === 404 ? null : await res.json()
    if (memory.size >= 5000) memory.clear()
    memory.set(
      bin,
      data && {
        bin,
        scheme: data.scheme,
        type: data.type === 'debit' || data.type === 'credit' ? data.type : undefined,
        prepaid: data.prepaid,
        product: data.brand,
        bank: data.bank?.name,
        country: data.country?.name,
        countryCode: data.country?.alpha2,
      },
    )
  }
  const info = memory.get(bin)
  return info ? answer(info, 200) : answer({ error: 'Unknown BIN' }, 404)
}

/** BINs rarely move: the CDN keeps an answer a week, a failure not at all. */
function answer(/** @type {unknown} */ body, /** @type {number} */ status) {
  const cache =
    status === 200 || status === 404 ? 'public, max-age=86400, s-maxage=604800' : 'no-store'
  return Response.json(body, { status, headers: { 'Cache-Control': cache } })
}
