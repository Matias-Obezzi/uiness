import { GlobeIcon, ImageIcon, SquareTerminalIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Model } from '@/components/ui/model-selector'
import { PromptInput, type PromptMessage } from '@/components/ui/prompt-input'

const models: Model[] = [
  { id: 'swift', name: 'Swift', efforts: ['Low', 'High'] },
  { id: 'sage', name: 'Sage', efforts: ['Low', 'Medium', 'High', 'Max'] },
]

export default function PromptInputDemo() {
  const [last, setLast] = useState<PromptMessage | null>(null)
  const [streaming, setStreaming] = useState(false)
  // A pretend reply that takes a few seconds, so Stop has something to stop.
  useEffect(() => {
    if (!streaming) return
    const timer = setTimeout(() => setStreaming(false), 4000)
    return () => clearTimeout(timer)
  }, [streaming])

  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <p className="min-h-10 text-muted-foreground text-sm">
        {streaming
          ? 'Replying…'
          : last
            ? `Sent “${last.text}” to ${last.model?.model}${last.files.length ? ` with ${last.files.length} file(s)` : ''}${last.tools.length ? `, tools: ${last.tools.join(', ')}` : ''}.`
            : 'Type / for commands, paste or drop an image, pick tools and a model.'}
      </p>
      <PromptInput
        models={models}
        accept="image/*,.pdf"
        streaming={streaming}
        onStop={() => setStreaming(false)}
        onSubmit={(message) => {
          setLast(message)
          setStreaming(true)
        }}
        tools={[
          { id: 'web', label: 'Search the web', icon: <GlobeIcon /> },
          { id: 'image', label: 'Create an image', icon: <ImageIcon /> },
          { id: 'code', label: 'Run code', icon: <SquareTerminalIcon /> },
        ]}
        commands={[
          { name: 'summarize', description: 'Summarize the conversation' },
          { name: 'translate', description: 'Translate to another language' },
          { name: 'explain', description: 'Explain step by step' },
        ]}
      />
    </div>
  )
}
