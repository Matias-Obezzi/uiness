import { createReadStream, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import mdx from '@mdx-js/rollup'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import remarkGfm from 'remark-gfm'
import { defineConfig, type Plugin } from 'vite'

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

export default defineConfig({
  plugins: [
    {
      enforce: 'pre',
      ...mdx({ providerImportSource: '@mdx-js/react', remarkPlugins: [remarkGfm] }),
    },
    react(),
    tailwindcss(),
    slowImages(),
  ],
  resolve: {
    alias: {
      '@uiness/image': `${root}../../packages/image/src/index.ts`,
      '@uiness/island': `${root}../../packages/island/src/index.ts`,
      '@uiness/fx': `${root}../../packages/fx/src/index.ts`,
      '@': `${root}../../packages/ui/registry`,
      '~': `${root}src`,
    },
  },
})
