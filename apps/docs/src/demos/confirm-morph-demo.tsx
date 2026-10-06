import { Trash2Icon } from 'lucide-react'
import { ConfirmMorph } from '@/components/ui/confirm-morph'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default function ConfirmMorphDemo() {
  return (
    <ConfirmMorph
      question="Delete this project?"
      confirmLabel="Delete"
      pendingLabel="Deleting…"
      successLabel="Project deleted"
      onConfirm={() => wait(1200)}
      onUndo={() => wait(400)}
    >
      <Trash2Icon />
      Delete project
    </ConfirmMorph>
  )
}
