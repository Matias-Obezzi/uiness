import { type ComponentType, useState } from 'react'
import { cn } from '@/lib/utils'
import { CodeBlock } from './code-block'

const demos = import.meta.glob('../demos/*.tsx', { eager: true }) as Record<
  string,
  { default: ComponentType }
>
const sources = import.meta.glob('../demos/*.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

/** Turn the docs import paths into the ones a project gets after installing. */
function forDisplay(source: string) {
  return source
    .replace(/from '@\/ui\//g, "from '@/components/ui/")
    .replace(/from '~\/[^']+'\n/g, '')
}

export interface ComponentPreviewProps {
  /** File name in src/demos without extension. */
  name: string
  align?: 'center' | 'start'
  className?: string
  /** Show the code first. */
  codeFirst?: boolean
}

export function ComponentPreview({
  name,
  align = 'center',
  className,
  codeFirst,
}: ComponentPreviewProps) {
  const key = `../demos/${name}.tsx`
  const Demo = demos[key]?.default
  const source = sources[key]
  const [tab, setTab] = useState<'preview' | 'code'>(codeFirst ? 'code' : 'preview')

  if (!Demo || source === undefined) {
    return (
      <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
        Demo <code>{name}</code> not found.
      </p>
    )
  }

  return (
    <div className={cn('not-prose my-6', className)}>
      <div className="flex items-center gap-1 border-b">
        {(['preview', 'code'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              '-mb-px border-b-2 px-3 py-2 font-medium text-sm capitalize transition-colors',
              tab === t
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === 'preview' ? (
        <div
          className={cn(
            'mt-3 flex min-h-[320px] w-full rounded-lg border p-8',
            align === 'center' ? 'items-center justify-center' : 'items-start justify-start',
          )}
        >
          <Demo />
        </div>
      ) : (
        <CodeBlock code={forDisplay(source)} className="mt-3" />
      )}
    </div>
  )
}
