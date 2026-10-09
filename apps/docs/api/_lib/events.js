// Writes usage events to Postgres (Neon, from the Vercel Marketplace) after the answer has
// gone out, so nobody waits on the database and a slow or broken one costs them nothing.
import { neon } from '@neondatabase/serverless'

/** @typedef {{ type: string, path: string, value?: string }} UsageEvent */

/** @type {ReturnType<typeof neon> | undefined} */
let sql
/** @type {Promise<unknown> | undefined} */
let ready

async function record(/** @type {UsageEvent} */ event, /** @type {string} */ url) {
  sql ??= neon(url)
  // Once per instance, so a fresh database needs no setup. Forgotten on failure, to try again.
  ready ??= (async () => {
    const db = /** @type {NonNullable<typeof sql>} */ (sql)
    await db`create table if not exists events (
      at timestamptz not null default now(),
      type text not null,
      path text not null,
      value text
    )`
    // Tables made before there was a value: what was searched, which preset, which tool.
    await db`alter table events add column if not exists value text`
  })().catch((error) => {
    ready = undefined
    throw error
  })
  await ready
  await sql`insert into events (type, path, value) values (${event.type}, ${event.path}, ${event.value ?? null})`
}

/**
 * Hands the write to `later`, the runtime's waitUntil, and returns at once. Production only:
 * previews and local runs would count the people building the site.
 */
export function save(
  /** @type {UsageEvent} */ event,
  /** @type {(promise: Promise<unknown>) => void} */ later,
) {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL
  if (!url || process.env.VERCEL_ENV !== 'production') return
  later(record(event, url).catch((error) => console.error('events:', error)))
}
