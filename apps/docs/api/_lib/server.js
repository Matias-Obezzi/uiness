// The MCP server over Streamable HTTP, stateless: every POST gets a fresh server and transport,
// no session id, and the answer comes back as plain JSON. Web-standard Request in, Response out.
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js'
import { createCatalog, ITEM_TYPES } from './catalog.js'

/** @typedef {import('./catalog.js').Load} Load */
/** @typedef {ReturnType<typeof createCatalog>} Catalog */

export const SERVER_NAME = 'uiness'
export const SERVER_VERSION = '1.0.0'

export const INSTRUCTIONS = `uiness is a shadcn-compatible React registry: Radix and Tailwind CSS v4 components, page blocks, drag and drop and motion pieces, installed as source with the shadcn CLI, plus small npm packages (@uiness/image, island, fx, toast, scroll, dnd, choreo).

How to use these tools:
- search_items finds items and docs pages by what they do ("date range", "pricing table", "drag to reorder"). Each result has its install command and docs link.
- get_item returns an item's install command, dependencies, every file's source and its docs page. Read it before writing code that uses an item, and use the props it documents.
- get_docs returns any docs page as Markdown, by slug: "installation", "theming", "localization", "components/button", "blocks/hero", "motion/marquee".
- list_items lists everything, grouped by type (ui, block, hook, lib, theme, file).
- get_setup explains how to add the registry to components.json, the theme, cn() and localization. Call it before the first install in a project.

Install with \`npx shadcn@latest add @uiness/<name>\` once "@uiness": "https://uiness.vercel.app/r/{name}.json" is in the registries of components.json. Installed code is the project's own: style with the theme tokens (bg-background, text-muted-foreground, border, ring, --chart-1..5), never hardcoded colors; merge classes with cn(); pass user-facing words through the labels prop or LabelsProvider; keep motion behind prefers-reduced-motion; give blocks their copy and brand through props.`

/** @type {Record<string, unknown>} */
const readOnly = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
}

export const TOOLS = [
  {
    name: 'search_items',
    title: 'Search uiness',
    description:
      'Search the uiness registry (components, blocks, hooks, libs, the theme) and the docs pages by name, title and description. Returns up to `limit` results, best first, each with its type, description, install command and docs URL.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'What you are looking for, like "date picker", "pricing", "toast" or "drag".',
        },
        type: {
          type: 'string',
          enum: [...ITEM_TYPES, 'docs'],
          description: 'Only items of this type, or only docs pages with "docs".',
        },
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 50,
          description: 'How many results at most. Default 10.',
        },
      },
      required: ['query'],
      additionalProperties: false,
    },
    annotations: { title: 'Search uiness', ...readOnly },
  },
  {
    name: 'list_items',
    title: 'List uiness items',
    description:
      'List every item in the uiness registry, grouped by type, one line each: name and description.',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: [...ITEM_TYPES],
          description:
            'Only this type: ui (components), block (page sections), hook, lib, theme or file.',
        },
      },
      additionalProperties: false,
    },
    annotations: { title: 'List uiness items', ...readOnly },
  },
  {
    name: 'get_item',
    title: 'Get a uiness item',
    description:
      'Get one registry item by name: description, install command, npm and registry dependencies, the source of every file with where the CLI writes it, and its docs page as Markdown (usage, examples, props, labels).',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description:
            'Registry name, like "button", "date-range-picker" or "hero-01". "@uiness/" is optional.',
        },
        docs: {
          type: 'boolean',
          description: 'Include the docs page. Default true.',
        },
      },
      required: ['name'],
      additionalProperties: false,
    },
    annotations: { title: 'Get a uiness item', ...readOnly },
  },
  {
    name: 'get_docs',
    title: 'Read a uiness docs page',
    description:
      'Get a uiness docs page as Markdown by slug: "introduction", "installation", "theming", "localization", "ai", a package like "toast", or "components/<name>", "blocks/<name>", "dnd/<name>", "motion/<name>". A registry item name also works.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: {
          type: 'string',
          description: 'Page slug, or its URL. Empty or "introduction" for the introduction.',
        },
      },
      required: ['slug'],
      additionalProperties: false,
    },
    annotations: { title: 'Read a uiness docs page', ...readOnly },
  },
  {
    name: 'get_setup',
    title: 'Set up uiness',
    description:
      'How to set up uiness in a project: the registry entry for components.json, the theme and its tokens, the cn() helper, and localization with the labels prop, LabelsProvider and the language packs. With the exact snippets from the docs.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { title: 'Set up uiness', ...readOnly },
  },
]

/**
 * A server for one request, answering from `catalog`.
 * @param {Catalog} catalog
 */
export function createServer(
  /** @type {Catalog} */ catalog,
  /** @type {{ onToolCall?: (name: string, args: Record<string, unknown>) => void }} */ {
    onToolCall,
  } = {},
) {
  const server = new Server(
    {
      name: SERVER_NAME,
      title: 'uiness',
      version: SERVER_VERSION,
      websiteUrl: 'https://uiness.vercel.app/docs/ai',
    },
    { capabilities: { tools: { listChanged: false } }, instructions: INSTRUCTIONS },
  )

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }))

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const args = /** @type {Record<string, unknown>} */ (request.params.arguments ?? {})
    onToolCall?.(request.params.name, args)
    /** @type {(a: Record<string, unknown>) => Promise<import('./catalog.js').ToolOutput>} */
    let run
    switch (request.params.name) {
      case 'search_items':
        run = catalog.searchItems
        break
      case 'list_items':
        run = catalog.listItems
        break
      case 'get_item':
        run = catalog.getItem
        break
      case 'get_docs':
        run = catalog.getDocs
        break
      case 'get_setup':
        run = () => catalog.getSetup()
        break
      default:
        throw new McpError(
          ErrorCode.InvalidParams,
          `Unknown tool: ${request.params.name}. Available: ${TOOLS.map((t) => t.name).join(', ')}.`,
        )
    }
    try {
      const out = await run(args)
      return { content: [{ type: 'text', text: out.text }], isError: out.isError === true }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        content: [{ type: 'text', text: `Could not read the uiness docs or registry: ${message}` }],
        isError: true,
      }
    }
  })

  return server
}

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Accept, Authorization, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID',
  'Access-Control-Expose-Headers': 'Mcp-Session-Id, Mcp-Protocol-Version',
  'Access-Control-Max-Age': '86400',
}

/** @param {Response} response */
function withCors(response) {
  const headers = new Headers(response.headers)
  for (const [key, value] of Object.entries(CORS_HEADERS)) headers.set(key, value)
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

/** @param {unknown} body @param {number} status @param {Record<string, string>} [extra] */
const json = (body, status, extra = {}) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...extra },
  })

/**
 * Answers one HTTP request to the MCP endpoint.
 * @param {Request} request
 * @param {Catalog} catalog
 * @param {{ onToolCall?: (name: string, args: Record<string, unknown>) => void }} [options]
 * @returns {Promise<Response>}
 */
export async function handleMcpRequest(request, catalog, options = {}) {
  if (request.method === 'OPTIONS')
    return new Response(null, { status: 204, headers: CORS_HEADERS })

  if (request.method === 'GET') {
    // Stateless: there is no stream of server messages to open.
    if (request.headers.get('accept')?.includes('text/event-stream')) {
      return json(
        {
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Method not allowed: this server does not open SSE streams.',
          },
          id: null,
        },
        405,
        { Allow: 'POST, OPTIONS' },
      )
    }
    // Someone opened the URL: say what this is.
    return json(
      {
        name: SERVER_NAME,
        version: SERVER_VERSION,
        description: 'The uiness MCP server: search the registry, read the docs and fetch source.',
        transport: 'Streamable HTTP (POST JSON-RPC to this URL), stateless, no authentication',
        setup: 'https://uiness.vercel.app/docs/ai',
        tools: TOOLS.map((t) => t.name),
      },
      200,
    )
  }

  if (request.method !== 'POST') {
    return json(
      { jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed.' }, id: null },
      405,
      { Allow: 'GET, POST, OPTIONS' },
    )
  }

  const server = createServer(catalog, options)
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })
  await server.connect(transport)
  try {
    return withCors(await transport.handleRequest(request))
  } finally {
    // The JSON answer is complete once handleRequest resolves.
    void server.close()
  }
}

/**
 * Reads the site's own files over HTTP from `origin`, once per path for the life of the instance:
 * a deployment's files never change. When the origin refuses (a preview behind Vercel's
 * deployment protection answers 401), it reads them from `fallback` instead.
 * @param {string} origin
 * @param {{ fetcher?: typeof fetch, headers?: Record<string, string>, fallback?: string }} [options]
 * @returns {Load}
 */
export function httpLoader(origin, { fetcher = fetch, headers = {}, fallback } = {}) {
  /** @type {Map<string, Promise<string>>} */
  const cache = new Map()
  const get = async (/** @type {string} */ base, /** @type {string} */ path) => {
    const res = await fetcher(`${base}${path}`, { headers })
    if (!res.ok)
      throw Object.assign(new Error(`${path} answered ${res.status}`), { status: res.status })
    return res.text()
  }
  return (path) => {
    const cached = cache.get(path)
    if (cached) return cached
    const promise = get(origin, path).catch((/** @type {Error & { status?: number }} */ error) => {
      if (fallback && fallback !== origin && (error.status === 401 || error.status === 403)) {
        return get(fallback, path)
      }
      throw error
    })
    promise.catch(() => cache.delete(path))
    cache.set(path, promise)
    return promise
  }
}
