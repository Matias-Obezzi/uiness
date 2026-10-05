import { MonitorIcon, SmartphoneIcon, TabletIcon } from 'lucide-react'
import { type ComponentType, useState } from 'react'
import { cn } from '@/lib/utils'
import { SegmentedControl, SegmentedControlItem } from '@/ui/segmented-control'
import { toProjectImports } from '~/lib/registry'
import { themeScope } from '~/lib/themes'
import { CodeBlock } from './code-block'

// The tests sit next to the blocks; importing them would pull vitest into the page, which
// throws as the bundle starts. The exclusion needs the full path: a negative pattern resolves
// from this file like the positive one, so `!**/*.test.tsx` matched nothing over there. Vite
// only takes literal patterns here, hence the repetition.
const modules = import.meta.glob(
  [
    '../../../../packages/ui/registry/blocks/*.tsx',
    '!../../../../packages/ui/registry/blocks/*.test.tsx',
  ],
  { eager: true },
) as Record<string, Record<string, unknown>>
const sources = import.meta.glob(
  [
    '../../../../packages/ui/registry/blocks/*.tsx',
    '!../../../../packages/ui/registry/blocks/*.test.tsx',
  ],
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>

/** hero-01 → Hero01, the name each block file exports. */
const exportName = (name: string) =>
  name.replace(/(^|-)([a-z0-9])/g, (_, __, c: string) => c.toUpperCase())

const widths = [
  { id: 'desktop', label: 'Desktop', icon: MonitorIcon, width: '100%' },
  { id: 'tablet', label: 'Tablet', icon: TabletIcon, width: '768px' },
  { id: 'mobile', label: 'Mobile', icon: SmartphoneIcon, width: '390px' },
] as const

type Width = (typeof widths)[number]['id']

export interface BlockPreviewProps {
  /** Registry name of the block, like `hero-01`. */
  name: string
}

/**
 * A block at full width, with the viewport widths it adapts to and its source. Blocks lay
 * themselves out with container queries, so narrowing the frame here is the real thing.
 */
export function BlockPreview({ name }: BlockPreviewProps) {
  const key = `../../../../packages/ui/registry/blocks/${name}.tsx`
  const Block = modules[key]?.[exportName(name)] as ComponentType | undefined
  const source = sources[key]
  const [tab, setTab] = useState<'preview' | 'code'>('preview')
  const [width, setWidth] = useState<Width>('desktop')

  if (!Block || source === undefined) {
    return (
      <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
        Block <code>{name}</code> not found.
      </p>
    )
  }

  return (
    <div className="not-prose my-6">
      <div className="flex items-center justify-between gap-2 border-b">
        <div className="flex items-center gap-1">
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
        {tab === 'preview' && (
          <SegmentedControl
            aria-label="Preview width"
            size="sm"
            value={width}
            onValueChange={(v) => setWidth(v as Width)}
            className="mb-1 hidden h-7 sm:inline-flex"
          >
            {widths.map(({ id, label, icon: Icon }) => (
              <SegmentedControlItem
                key={id}
                value={id}
                aria-label={label}
                title={label}
                className="px-2"
              >
                <Icon className="size-3.5" />
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        )}
      </div>
      {tab === 'preview' ? (
        <div className="mt-3 overflow-hidden rounded-xl border bg-muted/30">
          <div
            {...themeScope}
            className={cn(
              'mx-auto overflow-hidden bg-background transition-[max-width] duration-(--duration-slow,300ms) ease-(--easing-emphasized,ease-out)',
              width !== 'desktop' && 'border-x',
            )}
            style={{ maxWidth: widths.find((w) => w.id === width)?.width }}
          >
            <Block />
          </div>
        </div>
      ) : (
        <CodeBlock code={toProjectImports(source)} className="mt-3" />
      )}
    </div>
  )
}
