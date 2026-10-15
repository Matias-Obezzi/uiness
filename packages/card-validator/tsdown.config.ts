import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/react.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['react'],
  // Only the hook is client code: the checks and the handler run on servers, where a
  // 'use client' module could not be called.
  outputOptions: { banner: (chunk) => (chunk.name === 'react' ? "'use client';" : '') },
})
