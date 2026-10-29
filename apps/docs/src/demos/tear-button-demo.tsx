import { useState } from 'react'
import { TearButton } from '@/components/ui/tear-button'

export default function TearButtonDemo() {
  // A new key brings a fresh ticket.
  const [round, setRound] = useState(0)
  return (
    <div className="flex flex-col items-center gap-3">
      <TearButton key={round} confirmedLabel="Order cancelled" onConfirm={() => {}}>
        Cancel order #4821
      </TearButton>
      <button
        type="button"
        onClick={() => setRound(round + 1)}
        className="text-muted-foreground text-xs underline-offset-4 hover:underline"
      >
        Reset
      </button>
    </div>
  )
}
