import { useDraggable, useDropTarget } from '@uiness/dnd'
import { Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

function Note({ id, onTrash }: { id: string; onTrash: (id: string) => void }) {
  const drag = useDraggable({
    id,
    bounds: 'parent',
    grid: 24,
    // Touch: hold to pick up, so a swipe over a note still scrolls the page.
    activationDelay: 200,
    haptics: true,
    onDropOn: () => onTrash(id),
  })
  const element = drag.getElementProps()
  const handle = drag.getHandleProps()
  return (
    <div
      {...element}
      {...handle}
      style={{ ...element.style, ...handle.style }}
      className={cn(
        'w-28 cursor-grab rounded-lg border bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[dragging]:shadow-lg',
        drag.over && 'opacity-60',
      )}
    >
      {id}
    </div>
  )
}

export default function DndTargets() {
  const [notes, setNotes] = useState(['Call Ana', 'Book venue', 'Send invites'])
  const trash = useDropTarget({ id: 'trash' })
  return (
    <div className="w-full space-y-3">
      <div className="relative flex h-60 w-full items-start gap-3 overflow-hidden rounded-xl border bg-[radial-gradient(circle,var(--border)_1px,transparent_1px)] bg-[size:24px_24px] p-4">
        {notes.map((id) => (
          <Note
            key={id}
            id={id}
            onTrash={(gone) => setNotes((all) => all.filter((n) => n !== gone))}
          />
        ))}
        <div
          ref={trash.ref}
          className={cn(
            'absolute right-4 bottom-4 flex size-16 items-center justify-center rounded-xl border border-dashed text-muted-foreground transition-colors',
            trash.isOver && 'border-destructive bg-destructive/10 text-destructive',
          )}
        >
          <Trash2Icon />
        </div>
      </div>
      <p className="text-muted-foreground text-sm">
        Notes snap to the 24 px grid. Drop one on the bin to throw it away
        {notes.length < 3 && (
          <>
            , or{' '}
            <button
              type="button"
              className="underline underline-offset-4"
              onClick={() => setNotes(['Call Ana', 'Book venue', 'Send invites'])}
            >
              bring them back
            </button>
          </>
        )}
        .
      </p>
    </div>
  )
}
