// What GitHub Pages serves now that the docs live on Vercel: the registry JSON, so projects
// with the old URL in components.json keep installing (the CLI runs no scripts and Pages has
// no server redirects), and a page for every other path that sends the visitor to the same
// path on the new site. Pages answers unknown paths with 404.html, so that one file covers
// every route.
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const out = join(here, '..', 'dist-pages')
const base = process.env.DOCS_BASE_PATH ?? '/'
const target = (process.env.REDIRECT_TO ?? 'https://uiness.vercel.app').replace(/\/$/, '')

rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })
cpSync(join(here, '..', 'public', 'r'), join(out, 'r'), { recursive: true })

const page = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>uiness has moved</title>
    <meta name="robots" content="noindex" />
    <link rel="canonical" href="${target}/" />
    <noscript><meta http-equiv="refresh" content="0; url=${target}/" /></noscript>
    <script>
      var base = ${JSON.stringify(base)}
      var path = location.pathname.indexOf(base) === 0 ? '/' + location.pathname.slice(base.length) : '/'
      location.replace(${JSON.stringify(target)} + path + location.search + location.hash)
    </script>
  </head>
  <body>
    <p>uiness has moved to <a href="${target}/">${target.replace(/^https?:\/\//, '')}</a>.</p>
  </body>
</html>
`

writeFileSync(join(out, 'index.html'), page)
writeFileSync(join(out, '404.html'), page)
writeFileSync(join(out, '.nojekyll'), '')
console.log(`redirect site written to ${out}, sending ${base} to ${target}`)
