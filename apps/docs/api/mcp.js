// The uiness MCP server, as a Vercel Function at /api/mcp. It answers from the registry JSON
// and the Markdown pages this same deployment serves, fetched once per instance.
import { createCatalog } from './_lib/catalog.js'
import { handleMcpRequest, httpLoader } from './_lib/server.js'

/** Production, where every deployment can read the docs from when its own files are protected. */
const SITE = 'https://uiness.vercel.app'

/**
 * Where to read the files from. On Vercel, the deployment's own URL, never the Host header the
 * caller sent, so a request can't point the function at another server. Locally (the smoke test),
 * the address the request came in on.
 */
function originOf(/** @type {Request} */ request) {
  const deployment = process.env.VERCEL_URL
  return deployment ? `https://${deployment}` : new URL(request.url).origin
}

/** @type {ReturnType<typeof createCatalog> | undefined} */
let catalog

function catalogFor(/** @type {Request} */ request) {
  if (!catalog) {
    const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
    catalog = createCatalog(
      httpLoader(originOf(request), {
        // Lets a protected preview read itself when "Protection Bypass for Automation" is on.
        headers: bypass ? { 'x-vercel-protection-bypass': bypass } : {},
        fallback: SITE,
      }),
    )
  }
  return catalog
}

const handle = (/** @type {Request} */ request) => handleMcpRequest(request, catalogFor(request))

export const GET = handle
export const POST = handle
export const DELETE = handle
export const OPTIONS = handle
