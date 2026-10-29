import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { type Memory, MemoryList, remember } from '@/components/ui/memory-list'

const facts = [
  { key: 'diet', text: 'Is vegetarian' },
  { key: 'city', text: 'Lives in Lisbon' },
  { text: 'Prefers short answers' },
  { key: 'city', text: 'Moved to Porto' },
  { key: 'pet', text: 'Has a cat named Miso' },
  { key: 'diet', text: 'Is vegan now' },
]

export default function MemoryListDemo() {
  const [memories, setMemories] = useState<Memory[]>(() =>
    facts.slice(0, 2).reduce<Memory[]>((list, fact) => remember(list, fact), []),
  )
  const [next, setNext] = useState(2)
  const fact = facts[next]
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <MemoryList memories={memories} onMemoriesChange={setMemories} />
      <Button
        size="sm"
        variant="outline"
        className="self-start"
        disabled={!fact}
        onClick={() => {
          if (!fact) return
          setMemories((list) => remember(list, fact))
          setNext(next + 1)
        }}
      >
        {fact ? `It learns: “${fact.text}”` : 'Nothing more to learn'}
      </Button>
    </div>
  )
}
