import { HashIcon } from 'lucide-react'
import { useState } from 'react'
import { MentionInput, type MentionTrigger, type MentionValue } from '@/components/ui/mention-input'

const people = [
  { id: 'u1', label: 'Lucía Ortega', description: 'Engineering' },
  { id: 'u2', label: 'Samir Khan', description: 'Research' },
  { id: 'u3', label: 'Greta Holm', description: 'Platform' },
  { id: 'u4', label: 'Malik Grant', description: 'Data' },
  { id: 'u5', label: 'Chiara Bianchi', description: 'Mobile' },
]

const channels = ['general', 'design', 'releases', 'random', 'support']

function Initials({ name }: { name: string }) {
  const letters = name
    .split(' ')
    .map((w) => w[0])
    .join('')
  return (
    <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-muted font-medium text-[0.65rem] text-muted-foreground">
      {letters}
    </span>
  )
}

const triggers: MentionTrigger[] = [
  {
    char: '@',
    label: 'People',
    items: people.map((p) => ({ ...p, icon: <Initials name={p.label} /> })),
  },
  {
    char: '#',
    label: 'Channels',
    items: channels.map((c) => ({ id: c, label: c, icon: <HashIcon /> })),
  },
]

export default function MentionInputDemo() {
  const [value, setValue] = useState<MentionValue>({ text: '', mentions: [] })
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <MentionInput
        aria-label="Message"
        placeholder="Type @ for people, # for channels"
        triggers={triggers}
        value={value}
        onValueChange={setValue}
      />
      <ul className="flex min-h-6 flex-wrap gap-1.5 text-xs">
        {value.mentions.map((m) => (
          <li key={`${m.start}-${m.id}`} className="rounded-md bg-muted px-2 py-1 font-mono">
            {m.trigger}
            {m.id} [{m.start}, {m.end})
          </li>
        ))}
      </ul>
    </div>
  )
}
