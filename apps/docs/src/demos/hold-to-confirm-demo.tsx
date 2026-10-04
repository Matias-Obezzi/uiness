import { RocketIcon, Trash2Icon } from 'lucide-react'
import { HoldToConfirm } from '@/ui/hold-to-confirm'

export default function HoldToConfirmDemo() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      <HoldToConfirm onConfirm={() => {}} confirmedLabel="Deleted">
        <Trash2Icon />
        Hold to delete
      </HoldToConfirm>
      <HoldToConfirm
        variant="default"
        duration={2000}
        onConfirm={() => new Promise((resolve) => setTimeout(resolve, 1000))}
        confirmedLabel="Deployed"
      >
        <RocketIcon />
        Hold to deploy
      </HoldToConfirm>
    </div>
  )
}
