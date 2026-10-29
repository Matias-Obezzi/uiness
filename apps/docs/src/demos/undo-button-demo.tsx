import { ArchiveIcon } from 'lucide-react'
import { useState } from 'react'
import { UndoButton } from '@/components/ui/undo-button'

export default function UndoButtonDemo() {
  const [archived, setArchived] = useState(0)
  return (
    <div className="flex flex-col items-center gap-3">
      <UndoButton onCommit={() => setArchived((n) => n + 1)}>
        <ArchiveIcon aria-hidden="true" />
        Archive
      </UndoButton>
      <p className="text-muted-foreground text-sm">Archived: {archived}</p>
    </div>
  )
}
