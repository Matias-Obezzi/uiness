'use client'

import { ExternalLinkIcon } from 'lucide-react'
import * as React from 'react'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface CitationSource {
  id: string
  title: string
  url: string
  /** A short quote from the page that backs the claim. */
  snippet?: string
  /** The site's icon. */
  favicon?: string
}

export interface CitedSegment {
  text: string
  /** Ids of the sources that back this part. */
  sources?: string[]
}

export interface CitationsLabels {
  /** A chip, read out with its number and the source's title. */
  chip: (index: number, title: string) => string
  /** Names the stack of sources being read. */
  reading: (count: number) => string
}

export const defaultCitationsLabels: CitationsLabels = {
  chip: (index, title) => `Source ${index}: ${title}`,
  reading: (count) => `Reading ${count} ${count === 1 ? 'source' : 'sources'}`,
}

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export interface CitationsProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  segments: CitedSegment[]
  sources: CitationSource[]
  labels?: Partial<CitationsLabels>
}

/**
 * An answer with numbered source chips after the claims they back. Hover or focus a chip and
 * one preview card glides over to it, while the sentence it backs lights up.
 */
function Citations({ segments, sources, labels: labelsProp, className, ...props }: CitationsProps) {
  const labels = useLabels('citations', defaultCitationsLabels, labelsProp)
  const root = React.useRef<HTMLDivElement>(null)
  const [active, setActive] = React.useState<{
    segment: number
    source: string
    x: number
    y: number
  } | null>(null)
  const order = sources.map((s) => s.id)
  const previewId = React.useId()

  const show = (segment: number, source: string, chip: HTMLElement) => {
    const box = root.current?.getBoundingClientRect()
    const at = chip.getBoundingClientRect()
    if (!box) return
    setActive({ segment, source, x: at.left - box.left + at.width / 2, y: at.bottom - box.top + 6 })
  }
  const preview = active && sources.find((s) => s.id === active.source)

  return (
    <div
      ref={root}
      data-slot="citations"
      className={cn('relative text-sm leading-7', className)}
      onPointerLeave={() => setActive(null)}
      {...props}
    >
      <p>
        {segments.map((segment, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: segments are positional
          <React.Fragment key={i}>
            <span
              className={cn(
                'rounded-sm transition-colors duration-(--duration-fast,150ms)',
                active?.segment === i && 'bg-primary/15',
              )}
            >
              {segment.text}
            </span>
            {segment.sources?.map((id) => {
              const source = sources.find((s) => s.id === id)
              if (!source) return null
              const n = order.indexOf(id) + 1
              return (
                <a
                  key={id}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={labels.chip(n, source.title)}
                  aria-describedby={
                    active?.source === id && active.segment === i ? previewId : undefined
                  }
                  onPointerEnter={(event) => show(i, id, event.currentTarget)}
                  onFocus={(event) => show(i, id, event.currentTarget)}
                  onBlur={() => setActive(null)}
                  className="relative mx-0.5 inline-flex h-5 min-w-5 -translate-y-px items-center justify-center rounded-md bg-muted px-1.5 align-middle font-medium text-[11px] text-muted-foreground no-underline outline-none transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:after:absolute pointer-coarse:after:-inset-3"
                >
                  {n}
                </a>
              )
            })}{' '}
          </React.Fragment>
        ))}
      </p>
      {preview && active && (
        <div
          id={previewId}
          role="tooltip"
          className="pointer-events-none absolute z-10 w-64 max-w-[calc(100%-1rem)] -translate-x-1/2 rounded-lg border bg-popover p-3 text-popover-foreground shadow-md transition-[left,top] duration-(--duration-normal,200ms) ease-(--easing-emphasized,cubic-bezier(0.16,1,0.3,1)) motion-reduce:transition-none"
          style={{
            left: `clamp(8rem, ${active.x}px, calc(100% - 8rem))`,
            top: active.y,
          }}
        >
          <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
            {preview.favicon && (
              <img src={preview.favicon} alt="" className="size-3.5 rounded-sm" />
            )}
            {hostOf(preview.url)}
            <ExternalLinkIcon aria-hidden="true" className="size-3" />
          </p>
          <p className="mt-1 font-medium leading-snug">{preview.title}</p>
          {preview.snippet && (
            <p className="mt-1 line-clamp-3 text-muted-foreground text-xs leading-relaxed">
              {preview.snippet}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export interface SourceStackProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** The sources read so far, in the order they were read. */
  sources: CitationSource[]
  /** Icons shown before the rest become a count. Default 4. */
  max?: number
  labels?: Partial<CitationsLabels>
}

/** The sources an answer is reading, as overlapping site icons that stack up as each one is read. */
function SourceStack({
  sources,
  max = 4,
  labels: labelsProp,
  className,
  ...props
}: SourceStackProps) {
  const labels = useLabels('citations', defaultCitationsLabels, labelsProp)
  const shown = sources.slice(-max)
  const rest = sources.length - shown.length
  return (
    <div
      data-slot="source-stack"
      role="status"
      className={cn('flex items-center gap-2 text-muted-foreground text-xs', className)}
      {...props}
    >
      <span aria-hidden="true" className="flex -space-x-1.5">
        {shown.map((s) => (
          <span
            key={s.id}
            className="flex size-5 items-center justify-center overflow-hidden rounded-full border-2 border-background bg-muted font-medium text-[9px] uppercase animate-in fade-in zoom-in-50 motion-reduce:animate-none"
          >
            {s.favicon ? (
              <img src={s.favicon} alt="" className="size-full object-cover" />
            ) : (
              hostOf(s.url).charAt(0)
            )}
          </span>
        ))}
        {rest > 0 && (
          <span className="flex size-5 items-center justify-center rounded-full border-2 border-background bg-muted font-medium text-[9px]">
            +{rest}
          </span>
        )}
      </span>
      {labels.reading(sources.length)}
    </div>
  )
}

export { Citations, SourceStack }
