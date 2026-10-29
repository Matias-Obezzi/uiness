import { useState } from 'react'
import { type BranchMessage, ChatBranches } from '@/components/ui/chat-branches'

const start: BranchMessage[] = [
  { id: 'u1', parentId: null, role: 'user', text: 'Name a dog that is good with kids.' },
  {
    id: 'a1',
    parentId: 'u1',
    role: 'assistant',
    text: 'A golden retriever: patient, gentle and playful.',
  },
  { id: 'u2', parentId: 'a1', role: 'user', text: 'And for a small flat?' },
  {
    id: 'a2',
    parentId: 'u2',
    role: 'assistant',
    text: 'A cavalier King Charles spaniel adapts well to small homes.',
  },
]

let seq = 0

export default function ChatBranchesDemo() {
  const [messages, setMessages] = useState(start)
  return (
    <ChatBranches
      className="w-full max-w-xl"
      messages={messages}
      onEdit={(id, text) => {
        const original = messages.find((m) => m.id === id)
        if (!original) return
        const user = `edit-${++seq}`
        setMessages((list) => [
          ...list,
          { id: user, parentId: original.parentId, role: 'user', text },
          {
            id: `${user}-reply`,
            parentId: user,
            role: 'assistant',
            text: `Here is another take on “${text}”: a beagle is friendly, curious and sturdy.`,
          },
        ])
      }}
    />
  )
}
