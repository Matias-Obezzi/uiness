// Counts installs: the shadcn CLI fetches /r/<name>.json for every item it adds, dependencies
// included. This runs before the CDN, notes the fetch for later and lets the static file be
// served exactly as before, so the CLI never waits on the database.
// The subpath, so the edge bundle carries no more of the package than this.
import { next } from '@vercel/functions/middleware'
import { save } from './api/_lib/events.js'

export const config = { matcher: '/r/:path*' }

/** One item's file; the indexes are read by searches, not installs. */
const ITEM = /^\/r\/(?!registry\.json$|index\.json$)[\w-]+\.json$/

/** A tool rather than a browser opening the file, and not this site's own MCP server. */
export function isInstall(/** @type {Request} */ request) {
  const { pathname } = new URL(request.url)
  return (
    ITEM.test(pathname) &&
    !/Mozilla/.test(request.headers.get('user-agent') ?? '') &&
    !request.headers.has('x-uiness-internal')
  )
}

export default function middleware(
  /** @type {Request} */ request,
  /** @type {{ waitUntil: (promise: Promise<unknown>) => void }} */ context,
) {
  if (isInstall(request)) {
    save({ type: 'cli', path: new URL(request.url).pathname }, (p) => context.waitUntil(p))
  }
  return next()
}
