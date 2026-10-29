'use client'

import { BookmarkIcon, CheckIcon, ChevronDownIcon, PlusIcon } from 'lucide-react'
import * as React from 'react'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface Collection {
  id: string
  name: string
}

export interface SaveButtonLabels {
  save: string
  /** The button once saved, with where. */
  saved: (collection: string) => string
  /** Opens the collections. */
  choose: string
  /** Heads the strip. */
  savedTo: string
  newCollection: string
  create: string
  remove: string
}

export const defaultSaveButtonLabels: SaveButtonLabels = {
  save: 'Save',
  saved: (collection) => `Saved to ${collection}`,
  choose: 'Choose a collection',
  savedTo: 'Saved to',
  newCollection: 'New collection',
  create: 'Create',
  remove: 'Remove from saved',
}

/** How long the strip stays after a save, unless it is being used. */
const STRIP_MS = 4000

export interface SaveButtonProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  collections: Collection[]
  /** The collection it is saved in, or `null`. */
  value: string | null
  onValueChange: (collection: string | null) => void
  /** Makes a collection from a name and returns its id. Leave out for no "New collection". */
  onCreate?: (name: string) => string
  /** Where a tap saves to. Default the last one used, or the first. */
  defaultCollection?: string
  labels?: Partial<SaveButtonLabels>
}

/**
 * A bookmark button that files into collections. A tap saves to the last collection used, and a
 * strip opens to move it to another or make a new one; the arrow beside it opens the strip at
 * any time, and a tap on a saved item takes it out.
 */
function SaveButton({
  collections,
  value,
  onValueChange,
  onCreate,
  defaultCollection,
  labels: labelsProp,
  className,
  ...props
}: SaveButtonProps) {
  const labels = useLabels('save-button', defaultSaveButtonLabels, labelsProp)
  const [open, setOpen] = React.useState(false)
  const [last, setLast] = React.useState(defaultCollection ?? collections[0]?.id)
  const [name, setName] = React.useState('')
  // In use: the strip a save opened stays while the pointer or focus is in it.
  const busy = React.useRef(false)
  const timer = React.useRef(0)
  const saved = collections.find((c) => c.id === value)

  React.useEffect(() => () => window.clearTimeout(timer.current), [])
  const pick = (id: string) => {
    setLast(id)
    onValueChange(id)
  }
  // Opened by a save, it closes by itself unless something in it is being used.
  const peek = () => {
    setOpen(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      if (!busy.current) setOpen(false)
    }, STRIP_MS)
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        window.clearTimeout(timer.current)
        setOpen(next)
      }}
    >
      <PopoverAnchor asChild>
        <div
          data-slot="save-button"
          data-saved={saved ? '' : undefined}
          className={cn(
            'inline-flex h-9 items-center rounded-lg border bg-background shadow-xs pointer-coarse:h-11',
            className,
          )}
          {...props}
        >
          <button
            type="button"
            aria-pressed={!!saved}
            onClick={() => {
              if (saved) {
                onValueChange(null)
                setOpen(false)
                return
              }
              const target = collections.find((c) => c.id === last) ?? collections[0]
              if (!target) return
              pick(target.id)
              peek()
            }}
            className="flex h-full items-center gap-1.5 rounded-l-lg px-3 font-medium text-sm outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:size-4"
          >
            <BookmarkIcon
              aria-hidden="true"
              className={cn(
                'transition-[scale,fill] duration-(--duration-normal,200ms) motion-reduce:transition-none',
                saved && 'scale-110 fill-current',
              )}
            />
            <span className="max-w-40 truncate">
              {saved ? labels.saved(saved.name) : labels.save}
            </span>
          </button>
          <button
            type="button"
            aria-label={labels.choose}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="flex h-full items-center rounded-r-lg border-l px-2 text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <ChevronDownIcon aria-hidden="true" className="size-4" />
          </button>
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="w-64 p-2"
        onFocusCapture={() => {
          busy.current = true
        }}
        onBlurCapture={() => {
          busy.current = false
        }}
        onPointerEnter={() => {
          busy.current = true
        }}
        onPointerLeave={() => {
          busy.current = false
        }}
      >
        <p className="px-1.5 pt-0.5 pb-2 text-muted-foreground text-xs">{labels.savedTo}</p>
        <div className="flex flex-wrap gap-1.5">
          {collections.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={c.id === value}
              onClick={() => pick(c.id)}
              className="relative flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground pointer-coarse:after:absolute pointer-coarse:after:-inset-y-2"
            >
              {c.id === value && <CheckIcon aria-hidden="true" className="size-3" />}
              {c.name}
            </button>
          ))}
        </div>
        {onCreate && (
          <form
            className="mt-2 flex gap-1.5 border-t pt-2"
            onSubmit={(event) => {
              event.preventDefault()
              const trimmed = name.trim()
              if (!trimmed) return
              pick(onCreate(trimmed))
              setName('')
            }}
          >
            <input
              aria-label={labels.newCollection}
              placeholder={labels.newCollection}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-8 min-w-0 flex-1 rounded-md border border-input bg-transparent px-2 text-base outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:h-11 md:text-sm"
            />
            <button
              type="submit"
              aria-label={labels.create}
              disabled={!name.trim()}
              className="flex size-8 shrink-0 items-center justify-center rounded-md border outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-40 pointer-coarse:size-11"
            >
              <PlusIcon aria-hidden="true" className="size-4" />
            </button>
          </form>
        )}
        {saved && (
          <button
            type="button"
            onClick={() => {
              onValueChange(null)
              setOpen(false)
            }}
            className="mt-2 w-full rounded-md px-1.5 py-1.5 text-left text-destructive text-xs outline-none hover:bg-destructive/10 focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:min-h-11"
          >
            {labels.remove}
          </button>
        )}
      </PopoverContent>
    </Popover>
  )
}

export { SaveButton }
