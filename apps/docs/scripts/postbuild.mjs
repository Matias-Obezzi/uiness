// GitHub Pages has no rewrites: serve index.html for unknown routes through 404.html,
// and skip Jekyll so nothing in dist is filtered.
import { copyFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
copyFileSync(join(dist, 'index.html'), join(dist, '404.html'))
writeFileSync(join(dist, '.nojekyll'), '')
console.log('404.html and .nojekyll written')
