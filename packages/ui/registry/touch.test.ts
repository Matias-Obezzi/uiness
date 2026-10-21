import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, it } from 'vitest'

// The base controls reach 44px on touch screens with an invisible pseudo-element, the size a
// finger needs, without changing how they look. Every component built on them inherits it.
const controls = [
  'button',
  'toggle',
  'segmented-control',
  'switch',
  'checkbox',
  'radio-group',
  'tabs',
  'select',
  'slider',
  'chip-group',
  'number-field',
  'calendar',
  'carousel',
  'breadcrumb',
]

const area = /pointer-coarse:(after|before):inset-y-\[min\(0px,calc\(\(100%_-_44px\)\/2\)\)\]/

it.each(controls)('%s reaches 44px on touch screens', (name) => {
  const source = readFileSync(join(__dirname, 'ui', `${name}.tsx`), 'utf-8')
  expect(source).toMatch(area)
})
