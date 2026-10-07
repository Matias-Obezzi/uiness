import { createReadStream, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import mdx from '@mdx-js/rollup'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import remarkGfm from 'remark-gfm'
import { defineConfig, type Plugin } from 'vite'
import { docsMarkdown } from './scripts/docs-markdown.ts'

const root = fileURLToPath(new URL('.', import.meta.url))

/** Dev only: /slow/<ms>/<file> streams ./public/img/<file> over <ms> milliseconds. */
function slowImages(): Plugin {
  return {
    name: 'slow-images',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const match = req.url?.match(/^\/slow\/(\d+)\/([\w.-]+)/)
        if (!match) return next()
        const file = `${root}public/img/${match[2]}`
        let size: number
        try {
          size = statSync(file).size
        } catch {
          res.statusCode = 404
          res.end()
          return
        }
        const steps = 24
        res.setHeader('Content-Type', 'image/png')
        res.setHeader('Content-Length', String(size))
        res.setHeader('Cache-Control', 'no-store')
        const stream = createReadStream(file, { highWaterMark: Math.ceil(size / steps) })
        const wait = Number(match[1]) / steps
        stream.on('data', (chunk) => {
          stream.pause()
          res.write(chunk)
          setTimeout(() => stream.resume(), wait)
        })
        stream.on('end', () => res.end())
        stream.on('error', () => res.end())
        req.on('close', () => stream.destroy())
      })
    },
  }
}

const base = process.env.DOCS_BASE_PATH ?? '/'

/**
 * Demos and pages reference assets as "/img/..." so the shown source stays clean.
 * When the site is served from a subpath (GitHub Pages), rewrite those literals.
 */
function baseAssets(): Plugin {
  return {
    name: 'base-assets',
    transform(code, id) {
      if (base === '/' || !id.includes('/apps/docs/src/') || id.includes('?raw')) return null
      if (!/\.(tsx|ts|mdx)$/.test(id)) return null
      return code.replace(/(['"`])\/(img|slow|models)\//g, `$1${base}$2/`)
    },
  }
}

export default defineConfig({
  base,
  plugins: [
    baseAssets(),
    {
      enforce: 'pre',
      // Only .mdx: plain .md files, like the agent skill imported raw, are not pages.
      ...mdx({
        providerImportSource: '@mdx-js/react',
        remarkPlugins: [remarkGfm],
        mdExtensions: [],
      }),
    },
    react(),
    tailwindcss(),
    slowImages(),
    docsMarkdown(),
  ],
  resolve: {
    alias: {
      '@uiness/image': `${root}../../packages/image/src/index.ts`,
      '@uiness/island': `${root}../../packages/island/src/index.ts`,
      '@uiness/fx': `${root}../../packages/fx/src/index.ts`,
      '@uiness/toast': `${root}../../packages/toast/src/index.ts`,
      '@uiness/scroll': `${root}../../packages/scroll/src/index.ts`,
      '@uiness/dnd': `${root}../../packages/dnd/src/index.ts`,
      '@uiness/choreo': `${root}../../packages/choreo/src/index.ts`,
      '@uiness/three/core': `${root}../../packages/three/src/core.ts`,
      '@uiness/three': `${root}../../packages/three/src/index.ts`,
      '@/components/ui': `${root}../../packages/ui/registry/ui`,
      '@': `${root}../../packages/ui/registry`,
      '~': `${root}src`,
    },
  },
})
