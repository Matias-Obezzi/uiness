// What the docs show from the usage events: installs per registry item (fetched by the CLI,
// counted by middleware.js) and per page (install commands copied), all time and over 30 days,
// and the pages whose views grew most this week. The CDN keeps it for an hour, so Neon is read
// a few times an hour at most.
import { neon } from '@neondatabase/serverless'

const cache = (/** @type {number} */ seconds) => ({
  'Cache-Control': `public, s-maxage=${seconds}, stale-while-revalidate=86400`,
})

/** @typedef {{ items: Record<string, number>, pages: Record<string, number> }} Counts */

const empty = () => ({
  installs: /** @type {Counts} */ ({ items: {}, pages: {} }),
  month: /** @type {Counts} */ ({ items: {}, pages: {} }),
  trending: /** @type {{ path: string, week: number, before: number }[]} */ ([]),
})

export async function GET() {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL
  if (!url) return Response.json(empty(), { headers: cache(300) })
  try {
    const sql = neon(url)
    const [installs, views] = await Promise.all([
      sql`select type, path, count(*)::int as total,
            (count(*) filter (where at > now() - interval '30 days'))::int as month
          from events where type in ('cli', 'install') group by type, path`,
      sql`select path,
            (count(*) filter (where at > now() - interval '7 days'))::int as week,
            (count(*) filter (where at <= now() - interval '7 days'))::int as before
          from events
          where type = 'view' and at > now() - interval '14 days' and path like '/docs/%'
          group by path`,
    ])
    const usage = empty()
    for (const { type, path, total, month } of installs) {
      // '/r/button.json' is the item `button`; a copied command counts for its page.
      const key = type === 'cli' ? path.slice(3, -5) : path
      const scope = /** @type {'items' | 'pages'} */ (type === 'cli' ? 'items' : 'pages')
      usage.installs[scope][key] = total
      if (month) usage.month[scope][key] = month
    }
    usage.trending = /** @type {{ path: string, week: number, before: number }[]} */ (views)
      .filter(({ week, before }) => week >= 3 && week > before)
      .sort((a, b) => b.week - b.before - (a.week - a.before))
      .slice(0, 5)
    return Response.json(usage, { headers: cache(3600) })
  } catch (error) {
    // No table yet, before the first event, or Neon is down: nothing to show for now.
    console.error('usage:', error)
    return Response.json(empty(), { headers: cache(300) })
  }
}
