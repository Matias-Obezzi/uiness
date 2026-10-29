import { useState } from 'react'
import { SlideToConfirm } from '@/components/ui/slide-to-confirm'

export default function SlideToConfirmDemo() {
  // A new key puts it back at the start.
  const [round, setRound] = useState(0)
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      <SlideToConfirm
        key={round}
        confirmedLabel="Paid $24.00"
        onConfirm={() => new Promise((resolve) => setTimeout(resolve, 1200))}
      >
        Slide to pay $24.00
      </SlideToConfirm>
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
