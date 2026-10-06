import { useEffect, useRef, useState } from 'react'
import {
  type ChatDraft,
  type ChatMessage,
  ChatThread,
  type ChatUser,
} from '@/components/ui/chat-thread'

const users: ChatUser[] = [
  { id: 'me', name: 'Alex Morgan' },
  { id: 'maya', name: 'Maya Chen', avatar: '/img/gallery-1-tiny.png' },
  { id: 'leo', name: 'Leo Park', avatar: '/img/gallery-3-tiny.png' },
]

const today = new Date()
const at = (hours: number, minutes: number, daysAgo = 0) =>
  new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysAgo, hours, minutes)

const initial: ChatMessage[] = [
  {
    id: '1',
    authorId: 'leo',
    text: 'First pass of the launch page is up, hero shot below.',
    createdAt: at(17, 40, 1),
    attachments: [{ id: 'img', name: 'Launch hero', url: '/img/gallery-2.png', kind: 'image' }],
  },
  { id: '2', authorId: 'me', text: 'Love the colors. Ship it 🚢', createdAt: at(17, 52, 1) },
  { id: '3', authorId: 'maya', text: 'Morning! Pushed the new pricing copy.', createdAt: at(9, 4) },
  {
    id: '4',
    authorId: 'maya',
    text: 'Can someone give it a read before 3?',
    createdAt: at(9, 5),
    reactions: [{ emoji: '👍', userIds: ['leo'] }],
  },
  {
    id: '5',
    authorId: 'me',
    text: 'On it. Notes from the last review attached.',
    createdAt: at(9, 12),
    attachments: [
      { id: 'pdf', name: 'pricing-review.pdf', type: 'application/pdf', size: 1_240_000 },
    ],
    reactions: [{ emoji: '🙏', userIds: ['maya'] }],
    seenBy: ['maya', 'leo'],
  },
]

const replies = [
  'Perfect, thank you!',
  'Ha, fair point. Fixing it now.',
  'Agreed. Leo, can you update the hero too?',
  'Sounds good to me 🎉',
]

export default function ChatThreadDemo() {
  const [messages, setMessages] = useState(initial)
  const [typing, setTyping] = useState<string[]>([])
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const replyCount = useRef(0)

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const send = ({ text, files }: ChatDraft) => {
    const id = crypto.randomUUID()
    setMessages((list) => [
      ...list,
      {
        id,
        authorId: 'me',
        text,
        createdAt: new Date(),
        attachments: files.map((file, i) => ({
          id: `${id}-${i}`,
          name: file.name,
          type: file.type,
          size: file.size,
          url: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        })),
      },
    ])
    // Maya reads it, types for a moment and answers.
    timers.current.push(
      setTimeout(() => {
        setMessages((list) => list.map((m) => (m.id === id ? { ...m, seenBy: ['maya'] } : m)))
        setTyping(['maya'])
      }, 900),
      setTimeout(() => {
        setTyping([])
        const reply = replies[replyCount.current++ % replies.length] as string
        setMessages((list) => [
          ...list,
          { id: crypto.randomUUID(), authorId: 'maya', text: reply, createdAt: new Date() },
        ])
      }, 2600),
    )
  }

  const react = (messageId: string, emoji: string, added: boolean) => {
    setMessages((list) =>
      list.map((message) => {
        if (message.id !== messageId) return message
        const reactions = [...(message.reactions ?? [])]
        const index = reactions.findIndex((r) => r.emoji === emoji)
        const current = reactions[index]
        if (current) {
          const userIds = added
            ? [...current.userIds, 'me']
            : current.userIds.filter((u) => u !== 'me')
          reactions[index] = { emoji, userIds }
        } else if (added) reactions.push({ emoji, userIds: ['me'] })
        return { ...message, reactions: reactions.filter((r) => r.userIds.length > 0) }
      }),
    )
  }

  return (
    <ChatThread
      className="h-[520px] w-full max-w-xl"
      messages={messages}
      users={users}
      currentUserId="me"
      typing={typing}
      onSend={send}
      onReact={react}
      aria-label="Launch team chat"
    />
  )
}
