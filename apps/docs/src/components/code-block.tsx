import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { CopyButton } from './copy-button'

type Highlighter = Awaited<ReturnType<typeof createCore>>
let highlighterPromise: Promise<Highlighter> | null = null
const LANGS = ['tsx', 'ts', 'bash', 'css', 'json', 'html']

// Only the grammars and themes the docs use, instead of the full bundle.
async function createCore() {
  const [{ createHighlighterCore }, { createJavaScriptRegexEngine }] = await Promise.all([
    import('shiki/core'),
    import('shiki/engine/javascript'),
  ])
  return createHighlighterCore({
    themes: [import('shiki/themes/github-light.mjs'), import('shiki/themes/github-dark.mjs')],
    langs: [
      import('shiki/langs/tsx.mjs'),
      import('shiki/langs/typescript.mjs'),
      import('shiki/langs/bash.mjs'),
      import('shiki/langs/css.mjs'),
      import('shiki/langs/json.mjs'),
      import('shiki/langs/html.mjs'),
    ],
    engine: createJavaScriptRegexEngine(),
  })
}

function getHighlighter() {
  highlighterPromise ??= createCore()
  return highlighterPromise
}

export interface CodeBlockProps {
  code: string
  lang?: string
  /** Shown above the code. */
  title?: string
  className?: string
  /** Collapse tall blocks behind an expand button. Default true above 24 lines. */
  collapsible?: boolean
}

export function CodeBlock({ code, lang = 'tsx', title, className, collapsible }: CodeBlockProps) {
  const [html, setHtml] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const trimmed = code.replace(/\n+$/, '')
  const lines = trimmed.split('\n').length
  const collapse = (collapsible ?? lines > 24) && !expanded

  useEffect(() => {
    let cancelled = false
    getHighlighter().then((hl) => {
      if (cancelled) return
      const language = LANGS.includes(lang) ? lang : 'tsx'
      setHtml(
        hl.codeToHtml(trimmed, {
          lang: language,
          themes: { light: 'github-light', dark: 'github-dark' },
          defaultColor: false,
        }),
      )
    })
    return () => {
      cancelled = true
    }
  }, [trimmed, lang])

  return (
    <div
      className={cn(
        'not-prose group relative overflow-hidden rounded-lg border bg-muted/40 text-sm dark:bg-black/40',
        className,
      )}
    >
      {title && (
        <div className="flex items-center justify-between border-b px-4 py-2 font-mono text-muted-foreground text-xs">
          {title}
        </div>
      )}
      <CopyButton
        value={trimmed}
        className="absolute top-2 right-2 z-10 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
      />
      <div className={cn('overflow-x-auto', collapse && 'max-h-80 overflow-y-hidden')}>
        {html ? (
          <div
            className="[&_pre]:m-0 [&_pre]:px-4 [&_pre]:py-3 [&_pre]:font-mono [&_pre]:text-[13px] [&_pre]:leading-6"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: shiki output from our own source files
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <pre className="m-0 px-4 py-3 font-mono text-[13px] leading-6 text-foreground/80">
            {trimmed}
          </pre>
        )}
      </div>
      {collapse && (
        <div className="absolute inset-x-0 bottom-0 flex h-24 items-end justify-center bg-gradient-to-t from-background to-transparent pb-3">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="rounded-full border bg-background px-3 py-1 font-medium text-xs shadow-xs hover:bg-accent"
          >
            Expand
          </button>
        </div>
      )}
    </div>
  )
}
