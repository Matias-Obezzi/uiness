// Page views and copies at /api/track, sent by the docs as beacons. Answers at once; the row is
// written afterwards. Read them in the Neon SQL editor:
//   select path, count(*) from events where type = 'view' group by path order by 2 desc;
import { waitUntil } from '@vercel/functions'
import { save } from './_lib/events.js'
import { parseEvent } from './_lib/track.js'

export async function POST(/** @type {Request} */ request) {
  const event = parseEvent(await request.text())
  if (event) save(event, waitUntil)
  return new Response(null, { status: 204 })
}
