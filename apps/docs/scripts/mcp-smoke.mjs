// End-to-end check of the MCP server against a built site: serves dist/ the way Vercel does,
// routes /api/mcp to the function in api/mcp.js, and drives it with the MCP SDK client.
// Run `pnpm --filter docs build` first, then `pnpm --filter docs mcp:smoke`.
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { DELETE, GET, OPTIONS, POST } from '../api/mcp.js'

const dist = fileURLToPath(new URL('../dist/', import.meta.url))
if (!existsSync(join(dist, 'llms.txt'))) {
  console.error('No dist/llms.txt: run `pnpm --filter docs build` first.')
  process.exit(1)
}

const types = {
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
}

/** Node request → Web Request → the function → Node response. */
async function callFunction(req, res) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const body = chunks.length ? Buffer.concat(chunks) : undefined
  const handler = { GET, POST, DELETE, OPTIONS }[req.method ?? 'GET']
  if (!handler) {
    res.writeHead(405).end()
    return
  }
  const request = new Request(`http://${req.headers.host}${req.url}`, {
    method: req.method,
    headers: Object.entries(req.headers).flatMap(([k, v]) =>
      v === undefined ? [] : [[k, Array.isArray(v) ? v.join(', ') : v]],
    ),
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : body,
  })
  const response = await handler(request)
  res.writeHead(response.status, Object.fromEntries(response.headers))
  res.end(Buffer.from(await response.arrayBuffer()))
}

const server = createServer((req, res) => {
  const path = decodeURIComponent((req.url ?? '/').split('?')[0] ?? '/')
  if (path === '/api/mcp') {
    callFunction(req, res).catch((error) => {
      console.error(error)
      res.writeHead(500).end(String(error))
    })
    return
  }
  // Static files first, then the single page app, like the rewrite in vercel.json.
  let file = join(dist, normalize(path))
  if (!file.startsWith(dist) || !existsSync(file) || statSync(file).isDirectory()) {
    file = join(dist, 'index.html')
  }
  res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' })
  createReadStream(file).pipe(res)
})

await new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(undefined)))
const address = server.address()
const origin = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`
console.log(`serving dist/ and /api/mcp on ${origin}\n`)

let failures = 0
function check(label, ok, detail = '') {
  if (!ok) failures++
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? `  ${detail}` : ''}`)
}

try {
  for (const path of ['/llms.txt', '/llms-full.txt', '/docs.md', '/docs/components/button.md']) {
    const res = await fetch(origin + path)
    const text = await res.text()
    check(`GET ${path}`, res.ok && text.startsWith('# '), `${text.length} chars`)
  }

  const client = new Client({ name: 'uiness-smoke', version: '1.0.0' })
  const transport = new StreamableHTTPClientTransport(new URL('/api/mcp', origin))
  await client.connect(transport)
  const info = client.getServerVersion()
  check('initialize', info?.name === 'uiness', `${info?.name} ${info?.version}`)
  check('instructions', (client.getInstructions() ?? '').includes('search_items'))

  const { tools } = await client.listTools()
  check('tools/list', tools.length === 5, tools.map((t) => t.name).join(', '))

  const calls = [
    ['search_items', { query: 'date range picker' }, 'date-range-picker'],
    ['search_items', { query: 'pricing', type: 'block' }, 'pricing-01'],
    ['list_items', { type: 'hook' }, 'use-reduced-motion'],
    ['get_item', { name: 'button' }, 'function Button('],
    ['get_item', { name: 'hero-01', docs: false }, 'function Hero01('],
    ['get_item', { name: 'buton' }, 'Closest: button'],
    ['get_docs', { slug: 'localization' }, 'LabelsProvider'],
    ['get_docs', { slug: 'ai' }, '/api/mcp'],
    ['get_setup', {}, 'export function cn('],
  ]
  for (const [name, args, expected] of calls) {
    const result = await client.callTool({ name, arguments: args })
    const text = result.content?.[0]?.text ?? ''
    const firstLine = text.split('\n').find((l) => l.trim()) ?? ''
    check(
      `${name} ${JSON.stringify(args)}`,
      text.includes(expected),
      `${text.length} chars${result.isError ? ', isError' : ''}: ${firstLine.slice(0, 80)}`,
    )
  }

  const unknown = await client.callTool({ name: 'nope', arguments: {} }).then(
    () => null,
    (error) => error,
  )
  check('unknown tool is a JSON-RPC error', unknown?.code === -32602, unknown?.message)

  await client.close()
} finally {
  server.close()
}

console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed')
process.exit(failures ? 1 : 0)
