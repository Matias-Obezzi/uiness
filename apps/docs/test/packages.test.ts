import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, it } from 'vitest'
import { PACKAGES } from '../api/downloads.js'

const root = join(__dirname, '../../..')
const read = (path: string) => readFileSync(join(root, path), 'utf-8')

// Every place that lists the npm packages by hand, so a new one is not left out of any.
it('lists every npm package on the home page, in downloads and in llms.txt', () => {
  const packages = readdirSync(join(root, 'packages')).filter((name) => name !== 'ui')
  expect([...PACKAGES].sort()).toEqual(packages.sort())
  const home = read('apps/docs/src/components/home.tsx')
  const llms = read('apps/docs/src/lib/markdown.ts').match(/npm packages \(([^)]+)\)/)?.[1]
  for (const name of packages) {
    expect(home, `home.tsx has no card for ${name}`).toContain(`pkg: '${name}'`)
    expect(llms?.split(', '), `llms.txt does not name ${name}`).toContain(name)
  }
})
