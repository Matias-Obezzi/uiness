import { CheckIcon, LoaderIcon, SaveIcon } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/ui/button'
import { TextMorph } from '@/ui/text-morph'

const labels = { idle: 'Save changes', saving: 'Saving', saved: 'Saved' } as const

function SaveButton() {
  const [state, setState] = React.useState<keyof typeof labels>('idle')
  React.useEffect(() => {
    if (state === 'idle') return
    const next = state === 'saving' ? 'saved' : 'idle'
    const timer = setTimeout(() => setState(next), state === 'saving' ? 1400 : 1800)
    return () => clearTimeout(timer)
  }, [state])
  const Icon = state === 'saving' ? LoaderIcon : state === 'saved' ? CheckIcon : SaveIcon
  return (
    <Button onClick={() => state === 'idle' && setState('saving')} aria-live="polite">
      <Icon
        className={state === 'saving' ? 'animate-spin motion-reduce:animate-none' : undefined}
      />
      <TextMorph>{labels[state]}</TextMorph>
    </Button>
  )
}

const statuses = ['Connecting', 'Connected', 'Reconnecting', 'Disconnected']

function Status() {
  const [index, setIndex] = React.useState(0)
  React.useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % statuses.length), 2000)
    return () => clearInterval(timer)
  }, [])
  return (
    <p className="text-muted-foreground text-sm">
      Server: <TextMorph className="font-medium text-foreground">{statuses[index] ?? ''}</TextMorph>
    </p>
  )
}

export default function TextMorphDemo() {
  return (
    <div className="grid justify-items-center gap-6">
      <SaveButton />
      <Status />
    </div>
  )
}
