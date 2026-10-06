import * as React from 'react'
import { CodeBlock } from '@/components/ui/code-block'

const code = `import { useEffect, useState } from 'react'

export function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  return online
}`

// Shiki with only the grammar and themes this page needs. The block shows plain text until
// the highlighted HTML arrives, so nothing jumps.
async function highlight(source: string) {
  const [{ createHighlighterCore }, { createJavaScriptRegexEngine }] = await Promise.all([
    import('shiki/core'),
    import('shiki/engine/javascript'),
  ])
  const shiki = await createHighlighterCore({
    themes: [import('shiki/themes/github-light.mjs'), import('shiki/themes/github-dark.mjs')],
    langs: [import('shiki/langs/tsx.mjs')],
    engine: createJavaScriptRegexEngine(),
  })
  return shiki.codeToHtml(source, {
    lang: 'tsx',
    themes: { light: 'github-light', dark: 'github-dark' },
    defaultColor: false,
  })
}

export default function CodeBlockDemo() {
  const [html, setHtml] = React.useState<string>()
  React.useEffect(() => {
    let cancelled = false
    highlight(code).then((out) => !cancelled && setHtml(out))
    return () => {
      cancelled = true
    }
  }, [])
  return (
    <CodeBlock
      code={code}
      html={html}
      filename="hooks/use-online.ts"
      language="tsx"
      highlight="6-9"
      maxLines={14}
      className="w-full"
    />
  )
}
