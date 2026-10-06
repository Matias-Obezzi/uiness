import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { es } from '@/lib/labels-es'

/**
 * Every `useLabels('name', defaultNameLabels…)` in the registry, found in the sources, so a new
 * component with labels is checked without being added to a list by hand.
 */
function componentsWithLabels() {
  const dir = join(__dirname, '../ui')
  const found = new Map<string, { file: string; defaults: string }>()
  for (const file of readdirSync(dir)) {
    if (!/\.tsx?$/.test(file) || file.includes('.test.')) continue
    const source = readFileSync(join(dir, file), 'utf-8')
    for (const match of source.matchAll(/useLabels\(\s*'([\w-]+)',\s*(default\w+Labels)/g)) {
      const [, name, defaults] = match
      if (name && defaults) found.set(name, { file, defaults })
    }
  }
  return found
}

const components = componentsWithLabels()
const pack = es as Record<string, Record<string, unknown> | undefined>

describe('Spanish labels', () => {
  it('finds the components', () => {
    expect(components.size).toBeGreaterThan(50)
  })

  for (const [name, { file, defaults }] of components) {
    it(`translates every label of ${name}`, async () => {
      const module = (await import(/* @vite-ignore */ join(__dirname, '../ui', file))) as Record<
        string,
        unknown
      >
      const english = module[defaults] as Record<string, unknown> | undefined
      expect(english, `${file} exports ${defaults}`).toBeTypeOf('object')
      const spanish = pack[name]
      expect(spanish, `es has '${name}'`).toBeTypeOf('object')
      if (!english || !spanish) return

      expect(Object.keys(spanish).sort()).toEqual(Object.keys(english).sort())
      for (const [key, value] of Object.entries(english)) {
        const translated = spanish[key]
        expect(typeof translated, `${name}.${key}`).toBe(typeof value)
        if (typeof value === 'function' && typeof translated === 'function') {
          expect(translated.length, `${name}.${key} takes the same arguments`).toBe(value.length)
        }
        if (typeof translated === 'string') expect(translated, `${name}.${key}`).not.toBe('')
      }
    })
  }

  it('has nothing for components that do not exist', () => {
    expect(Object.keys(pack).filter((name) => !components.has(name))).toEqual([])
  })
})
