import { RotateCcwIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SplitText } from '@/components/ui/split-text'

export default function SplitTextDemo() {
  const [run, setRun] = useState(0)
  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <h3 className="max-w-md text-balance font-bold text-4xl tracking-tight">
        <SplitText key={run} text="Every letter finds its place" trigger="mount" />
      </h3>
      <Button variant="outline" size="sm" onClick={() => setRun((n) => n + 1)}>
        <RotateCcwIcon /> Replay
      </Button>
    </div>
  )
}
