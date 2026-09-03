import { createReadStream, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const root = fileURLToPath(new URL('.', import.meta.url))

/**
 * Serves /slow/<ms>/<file> from ./public/img, streaming the bytes over <ms>
 * milliseconds so loading states and progressive mode can be observed.
 */
function slowImages(): Plugin {
  return {
    name: 'slow-images',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const match = req.url?.match(/^\/slow\/(\d+)\/([\w.-]+)/)
        if (!match) return next()
        const delay = Number(match[1])
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
        const chunkSize = Math.ceil(size / steps)
        res.setHeader('Content-Type', 'image/png')
        res.setHeader('Content-Length', String(size))
        res.setHeader('Cache-Control', 'no-store')
        res.setHeader('Access-Control-Allow-Origin', '*')
        const stream = createReadStream(file, { highWaterMark: chunkSize })
        const wait = delay / steps
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
  plugins: [react(), slowImages()],
  resolve: {
    alias: {
      '@uiness/image': `${root}../../packages/image/src/index.ts`,
      '@uiness/island': `${root}../../packages/island/src/index.ts`,
    },
  },
})
