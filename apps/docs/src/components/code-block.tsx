import { type ReactNode, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/copy-button'
import { cn } from '@/lib/utils'
import { track } from '../lib/metrics'

/** The registry's copy button, sized down for a code block's corner. */
const copyClass =
  "size-7 text-muted-foreground hover:text-foreground [&_svg:not([class*='size-'])]:size-3.5"

const INSTALL = /^(npx|npm|pnpm|yarn|bunx?)\s/

/** Install commands count apart from the rest of the code. */
const copied = (text: string) => track(INSTALL.test(text) ? 'install' : 'code')

type Highlighter = Awaited<ReturnType<typeof createCore>>
let highlighterPromise: Promise<Highlighter> | null = null
const LANGS = ['tsx', 'ts', 'bash', 'css', 'json', 'html', 'toml', 'text']

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
      import('shiki/langs/toml.mjs'),
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
  /** Controls in the bar above the code, like the package manager picker. Puts the copy button there. */
  toolbar?: ReactNode
  className?: string
  /** Collapse tall blocks behind an expand button. Default true above 24 lines. */
  collapsible?: boolean
}

export function CodeBlock({
  code,
  lang = 'tsx',
  title,
  toolbar,
  className,
  collapsible,
}: CodeBlockProps) {
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
      // Copying a selection with Ctrl+C counts like the button. Judged by the whole block, so
      // part of an install command is still an install; the button writes to the clipboard
      // directly and fires no copy event here, so nothing counts twice.
      onCopy={() => {
        if (document.getSelection()?.toString().trim()) copied(trimmed)
      }}
    >
      {toolbar ? (
        <div className="flex items-center justify-between gap-2 border-b py-1.5 pr-2 pl-3">
          {toolbar}
          <CopyButton value={trimmed} label="Copy code" className={copyClass} onCopy={copied} />
        </div>
      ) : (
        <>
          {title && (
            <div className="flex items-center justify-between border-b px-4 py-2 font-mono text-muted-foreground text-xs">
              {title}
            </div>
          )}
          <CopyButton
            value={trimmed}
            label="Copy code"
            onCopy={copied}
            className={cn(
              copyClass,
              'absolute top-2 right-2 z-(--z-raised,10) opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 data-[state=copied]:opacity-100',
            )}
          />
        </>
      )}
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpanded(true)}
            className="h-7 rounded-full px-3"
          >
            Expand
          </Button>
        </div>
      )}
    </div>
  )
}
