'use client'

import { BrainIcon, CheckIcon, PencilIcon, Trash2Icon, XIcon } from 'lucide-react'
import * as React from 'react'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface Memory {
  id: string
  /** What it is about, such as `diet` or `home city`. A new fact with the same key replaces this one. */
  key?: string
  text: string
  /** The text it replaced, shown struck out for a moment. */
  replaced?: string
}

let seq = 0

/**
 * Adds a fact to the memories. One with the same `key` as an old one replaces it, keeping its
 * place and noting what it said before; anything else goes to the top.
 */
export function remember(memories: Memory[], fact: { key?: string; text: string }): Memory[] {
  const old = fact.key ? memories.find((m) => m.key === fact.key) : undefined
  if (old)
    return memories.map((m) => (m === old ? { ...m, text: fact.text, replaced: old.text } : m))
  return [{ id: `memory-${++seq}`, key: fact.key, text: fact.text }, ...memories]
}

export interface MemoryListLabels {
  title: string
  /** How many memories, under the title. */
  count: (count: number) => string
  empty: string
  edit: string
  save: string
  cancel: string
  forget: string
  updated: string
}

export const defaultMemoryListLabels: MemoryListLabels = {
  title: 'Memory',
  count: (count) => (count === 1 ? '1 thing it remembers' : `${count} things it remembers`),
  empty: 'Nothing saved yet. What it learns about you shows up here.',
  edit: 'Edit',
  save: 'Save',
  cancel: 'Cancel',
  forget: 'Forget',
  updated: 'Updated',
}

export interface MemoryListProps extends Omit<React.ComponentProps<'section'>, 'children'> {
  memories: Memory[]
  onMemoriesChange: (memories: Memory[]) => void
  labels?: Partial<MemoryListLabels>
}

/**
 * What an assistant has learned about the person, as a list they can edit or forget item by
 * item. Facts arrive with `remember`: a new one comes in at the top, and one that contradicts
 * an older fact replaces it in place, the old wording struck out beside it for a moment.
 */
function MemoryList({
  memories,
  onMemoriesChange,
  labels: labelsProp,
  className,
  ...props
}: MemoryListProps) {
  const labels = useLabels('memory-list', defaultMemoryListLabels, labelsProp)
  const [editing, setEditing] = React.useState<{ id: string; text: string } | null>(null)
  const update = (id: string, patch: Partial<Memory> | null) =>
    onMemoriesChange(
      patch === null
        ? memories.filter((m) => m.id !== id)
        : memories.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    )

  // The struck-out wording fades after a few seconds.
  const stale = memories
    .filter((m) => m.replaced)
    .map((m) => m.id)
    .join()
  const latest = React.useRef(memories)
  React.useEffect(() => {
    latest.current = memories
  })
  React.useEffect(() => {
    if (!stale) return
    const timer = window.setTimeout(() => {
      onMemoriesChange(latest.current.map((m) => (m.replaced ? { ...m, replaced: undefined } : m)))
    }, 4000)
    return () => window.clearTimeout(timer)
  }, [stale, onMemoriesChange])

  return (
    <section
      data-slot="memory-list"
      aria-label={labels.title}
      className={cn('flex flex-col gap-3 rounded-xl border bg-card p-4 text-sm', className)}
      {...props}
    >
      <header className="flex items-center gap-2">
        <BrainIcon aria-hidden="true" className="size-4 text-muted-foreground" />
        <h3 className="font-medium">{labels.title}</h3>
        <p className="ml-auto text-muted-foreground text-xs">{labels.count(memories.length)}</p>
      </header>
      {memories.length === 0 ? (
        <p className="text-muted-foreground">{labels.empty}</p>
      ) : (
        <ul className="flex flex-col divide-y">
          {memories.map((memory) => (
            <li
              key={memory.id}
              className="flex items-start gap-2 py-2 first:pt-0 last:pb-0 animate-in fade-in slide-in-from-top-1 motion-reduce:animate-none"
            >
              {editing?.id === memory.id ? (
                <form
                  className="flex min-w-0 flex-1 items-center gap-1"
                  onSubmit={(event) => {
                    event.preventDefault()
                    const text = editing.text.trim()
                    update(memory.id, text ? { text, replaced: undefined } : null)
                    setEditing(null)
                  }}
                >
                  <input
                    // biome-ignore lint/a11y/noAutofocus: opened by the Edit button, to type in at once
                    autoFocus
                    aria-label={labels.edit}
                    value={editing.text}
                    onChange={(event) => setEditing({ id: memory.id, text: event.target.value })}
                    onKeyDown={(event) => event.key === 'Escape' && setEditing(null)}
                    className="h-8 min-w-0 flex-1 rounded-md border border-input bg-transparent px-2 text-base outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
                  />
                  <ItemButton type="submit" label={labels.save}>
                    <CheckIcon />
                  </ItemButton>
                  <ItemButton label={labels.cancel} onClick={() => setEditing(null)}>
                    <XIcon />
                  </ItemButton>
                </form>
              ) : (
                <>
                  <div className="min-w-0 flex-1 pt-1">
                    <p>
                      {memory.text}
                      {memory.replaced && (
                        <span className="ml-2 rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] text-primary">
                          {labels.updated}
                        </span>
                      )}
                    </p>
                    {memory.replaced && (
                      <p className="text-muted-foreground text-xs line-through">
                        {memory.replaced}
                      </p>
                    )}
                  </div>
                  <ItemButton
                    label={labels.edit}
                    onClick={() => setEditing({ id: memory.id, text: memory.text })}
                  >
                    <PencilIcon />
                  </ItemButton>
                  <ItemButton label={labels.forget} onClick={() => update(memory.id, null)}>
                    <Trash2Icon />
                  </ItemButton>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function ItemButton({
  label,
  className,
  ...props
}: React.ComponentProps<'button'> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        'relative flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:size-9 [&_svg]:size-3.5',
        className,
      )}
      {...props}
    />
  )
}

export { MemoryList }
