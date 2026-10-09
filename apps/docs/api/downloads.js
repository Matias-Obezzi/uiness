// Last week's npm downloads of each package, for the home page. Vercel's CDN keeps the answer
// for hours (npm only updates the counts daily), so a visitor never waits on npm and npm sees a
// handful of requests a day. Scoped packages cannot be asked for in bulk: one request each.

export const PACKAGES = ['image', 'island', 'fx', 'toast', 'scroll', 'dnd', 'choreo', 'three']

async function weekly(/** @type {string} */ name) {
  try {
    const res = await fetch(`https://api.npmjs.org/downloads/point/last-week/@uiness/${name}`, {
      signal: AbortSignal.timeout(5000),
    })
    const { downloads } = await res.json()
    return typeof downloads === 'number' ? downloads : null
  } catch {
    return null
  }
}

export async function GET() {
  const counts = await Promise.all(PACKAGES.map(weekly))
  /** @type {Record<string, number>} */
  const packages = {}
  PACKAGES.forEach((name, i) => {
    const count = counts[i]
    if (typeof count === 'number') packages[name] = count
  })
  const total = Object.values(packages).reduce((sum, n) => sum + n, 0)
  // A partial answer is only kept for a few minutes, so a hiccup at npm heals quickly.
  const complete = Object.keys(packages).length === PACKAGES.length
  return Response.json(
    { total, packages },
    {
      headers: {
        'Cache-Control': `public, s-maxage=${complete ? 21600 : 300}, stale-while-revalidate=86400`,
      },
    },
  )
}
