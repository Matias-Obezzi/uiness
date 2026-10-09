import { GiftIcon } from 'lucide-react'
import { useState } from 'react'
import { ScratchReveal } from '@/components/ui/scratch-reveal'

export default function ScratchRevealDemo() {
  const [won, setWon] = useState(false)
  return (
    <div className="flex flex-col items-center gap-4">
      <ScratchReveal
        onReveal={() => setWon(true)}
        className="h-44 w-80 border"
        cover="var(--secondary)"
      >
        <div className="flex size-full flex-col items-center justify-center gap-2 bg-card">
          <GiftIcon className="size-6 text-primary" />
          <p className="font-mono font-semibold text-2xl tracking-widest">SAVE-25</p>
          <p className="text-muted-foreground text-xs">25% off your next order</p>
        </div>
      </ScratchReveal>
      <p className="text-muted-foreground text-sm">
        {won ? 'Revealed. The code is yours.' : 'Scratch the card, or focus it and press Enter.'}
      </p>
    </div>
  )
}
