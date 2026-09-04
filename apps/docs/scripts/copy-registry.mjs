// Builds the ui registry and copies its JSON into public/r so the site serves it.
import { execSync } from 'node:child_process'
import { cpSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const ui = join(here, '..', '..', '..', 'packages', 'ui')
const out = join(here, '..', 'public', 'r')

execSync('pnpm build', { cwd: ui, stdio: 'inherit' })
rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })
cpSync(join(ui, 'public', 'r'), out, { recursive: true })
console.log(`registry copied to ${out}`)
