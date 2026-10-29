import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ContextMeter } from '@/components/ui/context-meter'

export default function ContextMeterDemo() {
  const [turns, setTurns] = useState(96_000)
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className="flex items-center gap-2 rounded-2xl border p-2 pl-4 text-muted-foreground text-sm">
        <span className="flex-1">Ask anything…</span>
        <ContextMeter
          limit={200_000}
          onCompact={() => setTurns(12_000)}
          sources={[
            { label: 'System prompt', tokens: 4_000 },
            { label: 'Files', tokens: 58_000 },
            { label: 'Conversation', tokens: turns },
            { label: 'Tool results', tokens: 21_000 },
          ]}
        />
      </div>
      <Button
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => setTurns(turns + 20_000)}
      >
        Keep chatting (+20K)
      </Button>
    </div>
  )
}
