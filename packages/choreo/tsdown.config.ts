import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    entry: ['src/index.ts', 'src/core.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    external: ['react', 'react-dom', 'react/jsx-runtime'],
    banner: { js: "'use client';" },
  },
  {
    // A script tag for sites without a bundler: runs on load, exposes `window.choreo`.
    entry: { auto: 'src/auto.ts' },
    format: ['iife'],
    minify: true,
    clean: false,
    dts: false,
  },
])
