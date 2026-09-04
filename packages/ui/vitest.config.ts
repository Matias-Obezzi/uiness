import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@': `${root}registry`,
      '@uiness/island': `${root}../island/src/index.ts`,
      '@uiness/image': `${root}../image/src/index.ts`,
      '@uiness/fx': `${root}../fx/src/index.ts`,
      '@uiness/toast': `${root}../toast/src/index.ts`,
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['registry/**/*.test.{ts,tsx}'],
  },
})
