import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { en } from '@/lib/labels-en'
import { es } from '@/lib/labels-es'
import { fr } from '@/lib/labels-fr'
import { it as italian } from '@/lib/labels-it'
import { pt } from '@/lib/labels-pt'
import { zh } from '@/lib/labels-zh'

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

type Pack = Record<string, Record<string, unknown> | undefined>

const components = componentsWithLabels()
const packs: [string, Pack][] = [
  ['en', en],
  ['es', es],
  ['pt', pt],
  ['fr', fr],
  ['it', italian],
  ['zh', zh],
]

/** Sample arguments for comparing the English pack's functions with the defaults. */
const drag = (to: string, count: number) => ({
  id: 'card',
  from: { containerId: 'a', index: 0 },
  to: { containerId: to, index: 2 },
  count,
  delta: { x: 12.6, y: -3.2 },
})
const samples: unknown[] = [
  0,
  1,
  2,
  'a',
  '',
  undefined,
  ['Ana', 'Bo'],
  'array',
  { first: 1, last: 5, min: 1, max: 5, count: 3 },
  drag('a', 4),
  drag('b', 1),
  drag('', 0),
]

const run = (fn: (...args: unknown[]) => unknown, args: unknown[]) => {
  try {
    return { value: fn(...args) }
  } catch (error) {
    return { error: (error as Error).message }
  }
}

/** Every combination of the samples, as many as the function takes (at most three). */
function* argumentsFor(arity: number): Generator<unknown[]> {
  if (arity === 0) {
    yield []
    return
  }
  for (const rest of argumentsFor(Math.min(arity, 3) - 1)) {
    for (const sample of samples) yield [sample, ...rest]
  }
}

async function defaultsOf(file: string, defaults: string) {
  const module = (await import(/* @vite-ignore */ join(__dirname, '../ui', file))) as Record<
    string,
    unknown
  >
  return module[defaults] as Record<string, unknown> | undefined
}

it('finds the components', () => {
  expect(components.size).toBeGreaterThan(50)
})

for (const [language, pack] of packs) {
  describe(`${language} labels`, () => {
    for (const [name, { file, defaults }] of components) {
      it(`covers every label of ${name}`, async () => {
        const english = await defaultsOf(file, defaults)
        expect(english, `${file} exports ${defaults}`).toBeTypeOf('object')
        const translated = pack[name]
        expect(translated, `${language} has '${name}'`).toBeTypeOf('object')
        if (!english || !translated) return

        expect(Object.keys(translated).sort()).toEqual(Object.keys(english).sort())
        for (const [key, value] of Object.entries(english)) {
          const label = translated[key]
          expect(typeof label, `${name}.${key}`).toBe(typeof value)
          if (typeof value === 'function' && typeof label === 'function') {
            expect(label.length, `${name}.${key} takes the same arguments`).toBe(value.length)
          }
          if (typeof label === 'string') expect(label, `${name}.${key}`).not.toBe('')
          // The English pack is the defaults written out, word for word.
          if (language === 'en' && typeof value === 'string') {
            expect(label, `${name}.${key}`).toBe(value)
          }
          if (language === 'en' && typeof value === 'function' && typeof label === 'function') {
            const differ: string[] = []
            for (const args of argumentsFor(value.length)) {
              const want = run(value as (...a: unknown[]) => unknown, args)
              const got = run(label as (...a: unknown[]) => unknown, args)
              if (JSON.stringify(want) !== JSON.stringify(got)) differ.push(JSON.stringify(args))
            }
            expect(differ, `${name}.${key} says the same as the default`).toEqual([])
          }
        }
      })
    }

    it('has nothing for components that do not exist', () => {
      expect(Object.keys(pack).filter((name) => !components.has(name))).toEqual([])
    })
  })
}
