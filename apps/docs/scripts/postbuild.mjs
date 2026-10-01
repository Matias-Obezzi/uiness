// GitHub Pages has no rewrites: serve index.html for unknown routes through 404.html,
// and skip Jekyll so nothing in dist is filtered.
import { copyFileSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')

// A test file pulled into the site brings vitest with it, which throws as the page starts
// and leaves every route blank. It happened once through a glob; fail the build instead.
const leaked = readdirSync(join(dist, 'assets'))
  .filter((file) => file.endsWith('.js'))
  .filter((file) =>
    /\.test\.tsx?\b|@vitest\//.test(readFileSync(join(dist, 'assets', file), 'utf8')),
  )
if (leaked.length) {
  console.error(`Test code made it into the docs bundle: ${leaked.join(', ')}`)
  process.exit(1)
}

copyFileSync(join(dist, 'index.html'), join(dist, '404.html'))
writeFileSync(join(dist, '.nojekyll'), '')
console.log('404.html and .nojekyll written')
