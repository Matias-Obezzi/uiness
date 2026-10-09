// How many times the CLI fetched each registry item, as counted by middleware.js, for the docs
// pages. The CDN keeps the answer for an hour, so Neon is read a few times an hour at most.
import { neon } from '@neondatabase/serverless'

const cache = (/** @type {number} */ seconds) => ({
  'Cache-Control': `public, s-maxage=${seconds}, stale-while-revalidate=86400`,
})

export async function GET() {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL
  if (!url) return Response.json({}, { headers: cache(300) })
  try {
    const rows = await neon(url)`
      select path, count(*)::int as n from events where type = 'cli' group by path`
    /** @type {Record<string, number>} */
    const installs = {}
    // '/r/button.json' → 'button'
    for (const { path, n } of rows) installs[path.slice(3, -5)] = n
    return Response.json(installs, { headers: cache(3600) })
  } catch (error) {
    // No table yet, before the first install, or Neon is down: nothing to show for now.
    console.error('installs:', error)
    return Response.json({}, { headers: cache(300) })
  }
}
