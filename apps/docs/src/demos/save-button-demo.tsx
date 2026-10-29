import { useState } from 'react'
import { type Collection, SaveButton } from '@/components/ui/save-button'

let seq = 0

export default function SaveButtonDemo() {
  const [collections, setCollections] = useState<Collection[]>([
    { id: 'later', name: 'Read later' },
    { id: 'recipes', name: 'Recipes' },
    { id: 'trips', name: 'Trips' },
  ])
  const [value, setValue] = useState<string | null>(null)
  return (
    <div className="flex w-full max-w-sm items-center justify-between gap-3 rounded-xl border p-4">
      <div className="min-w-0">
        <p className="truncate font-medium text-sm">Slow-cooked ragù</p>
        <p className="text-muted-foreground text-xs">35 min read</p>
      </div>
      <SaveButton
        collections={collections}
        value={value}
        onValueChange={setValue}
        onCreate={(name) => {
          const id = `new-${++seq}`
          setCollections((list) => [...list, { id, name }])
          return id
        }}
      />
    </div>
  )
}
