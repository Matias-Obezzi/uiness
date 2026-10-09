// Page views and copies at /api/track, kept in Postgres (Neon, from the Vercel Marketplace).
// The answer goes out first and the row is written after, so a reader never waits on the
// database and a slow or broken one costs them nothing. Read them in the Neon SQL editor:
//   select path, count(*) from events where type = 'view' group by path order by 2 desc;
import { neon } from '@neondatabase/serverless'
import { waitUntil } from '@vercel/functions'
import { parseEvent } from './_lib/track.js'

/** @type {ReturnType<typeof neon> | undefined} */
let sql
/** @type {Promise<unknown> | undefined} */
let ready

async function record(/** @type {import('./_lib/track.js').TrackEvent} */ event, url = '') {
  sql ??= neon(url)
  // Once per instance, so a fresh database needs no setup. Forgotten on failure, to try again.
  ready ??= sql`create table if not exists events (
    at timestamptz not null default now(),
    type text not null,
    path text not null
  )`.catch((error) => {
    ready = undefined
    throw error
  })
  await ready
  await sql`insert into events (type, path) values (${event.type}, ${event.path})`
}

export async function POST(/** @type {Request} */ request) {
  const event = parseEvent(await request.text())
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL
  // Production only: previews and local runs would count the people building the site.
  if (event && url && process.env.VERCEL_ENV === 'production') {
    waitUntil(record(event, url).catch((error) => console.error('track:', error)))
  }
  return new Response(null, { status: 204 })
}
