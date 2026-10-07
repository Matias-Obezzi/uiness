import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      // Registry files import components the way a shadcn project resolves them.
      '@/components/ui': `${root}registry/ui`,
      '@': `${root}registry`,
      '@uiness/island': `${root}../island/src/index.ts`,
      '@uiness/image': `${root}../image/src/index.ts`,
      '@uiness/fx': `${root}../fx/src/index.ts`,
      '@uiness/dnd': `${root}../dnd/src/index.ts`,
      '@uiness/toast': `${root}../toast/src/index.ts`,
      '@uiness/scroll': `${root}../scroll/src/index.ts`,
      '@uiness/choreo': `${root}../choreo/src/index.ts`,
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['registry/**/*.test.{ts,tsx}'],
    testTimeout: 20000,
    retry: 1,
  },
})
