import { defineConfig } from 'vitest/config'

// The docs site has no component tests: these cover the Markdown pages and the MCP server.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
})
