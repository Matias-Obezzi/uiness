// The uiness MCP server, as a Vercel Function at /api/mcp. It answers from the registry JSON
// and the Markdown pages this same deployment serves, fetched once per instance.
import { createCatalog } from './_lib/catalog.js'
import { handleMcpRequest, httpLoader } from './_lib/server.js'

/** @type {Map<string, ReturnType<typeof createCatalog>>} */
const catalogs = new Map()

/** One catalog per origin, so a preview URL reads its own files. */
function catalogFor(/** @type {Request} */ request) {
  const origin = new URL(request.url).origin
  let catalog = catalogs.get(origin)
  if (!catalog) {
    catalog = createCatalog(httpLoader(origin))
    catalogs.set(origin, catalog)
  }
  return catalog
}

const handle = (/** @type {Request} */ request) => handleMcpRequest(request, catalogFor(request))

export const GET = handle
export const POST = handle
export const DELETE = handle
export const OPTIONS = handle
