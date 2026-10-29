import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { GlitchText } from '@/components/ui/glitch-text'

const words = ['Signal lost', 'Reconnecting', 'Signal found']

export default function GlitchTextDemo() {
  const [at, setAt] = useState(0)
  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <p className="font-bold font-mono text-4xl tracking-tight">
        <GlitchText text="Hover me" />
      </p>
      <p className="font-mono text-2xl">
        <GlitchText text={words[at % words.length] ?? ''} trigger="change" />
      </p>
      <Button variant="outline" size="sm" onClick={() => setAt(at + 1)}>
        Change the text
      </Button>
    </div>
  )
}
