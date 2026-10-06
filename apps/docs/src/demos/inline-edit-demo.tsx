import { useState } from 'react'
import { InlineEdit } from '@/components/ui/inline-edit'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default function InlineEditDemo() {
  const [name, setName] = useState('Website redesign')
  const [owner, setOwner] = useState('Ravi Menon')
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <h3 className="font-semibold text-2xl tracking-tight">
        <InlineEdit
          aria-label="Project name"
          value={name}
          validate={(v) => (v.trim() ? null : 'A project needs a name.')}
          onSave={async (v) => {
            await wait(700)
            setName(v.trim())
          }}
        />
      </h3>
      <p className="text-muted-foreground text-sm">
        Owned by{' '}
        <InlineEdit
          aria-label="Owner"
          value={owner}
          onSave={setOwner}
          className="text-foreground"
        />
        , due in two weeks.
      </p>
    </div>
  )
}
