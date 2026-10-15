import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, it } from 'vitest'

const registry = JSON.parse(readFileSync(join(__dirname, '../registry.json'), 'utf-8'))

// The shadcn CLI writes top-level `@keyframes` into `@theme inline`, where Tailwind drops any
// not named in an `animation` it emits. Ours are named in inline styles, `animation-name` or
// CSS variables, so they vanished from the build and nothing moved. Under `@layer base` they
// are written as plain CSS and always kept.
it('ships keyframes under @layer base, where Tailwind keeps them', () => {
  const top = registry.items.flatMap((item: { name: string; css?: object }) =>
    Object.keys(item.css ?? {})
      .filter((key) => key.startsWith('@keyframes'))
      .map((key) => `${item.name}: ${key}`),
  )
  expect(top).toEqual([])
})
