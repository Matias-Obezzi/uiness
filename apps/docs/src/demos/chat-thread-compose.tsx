import { useState } from 'react'
import {
  ChatBubble,
  ChatComposer,
  ChatMessageGroup,
  ChatMessages,
  ChatTypingIndicator,
} from '@/components/ui/chat-thread'

const bot = { id: 'bot', name: 'Helper' }

export default function ChatThreadCompose() {
  const [lines, setLines] = useState([
    { id: 1, self: false, text: 'Hi! Ask me anything about your order.' },
  ])
  const [thinking, setThinking] = useState(false)

  return (
    <div className="flex h-[380px] w-full max-w-md flex-col overflow-hidden rounded-xl border">
      <ChatMessages
        aria-label="Support chat"
        scrollKey={lines.filter((l) => l.self).length}
        status={<ChatTypingIndicator users={thinking ? [bot] : []} />}
      >
        {lines.map((line) => (
          <ChatMessageGroup key={line.id} self={line.self} author={bot} showName={false}>
            <ChatBubble self={line.self}>{line.text}</ChatBubble>
          </ChatMessageGroup>
        ))}
      </ChatMessages>
      <ChatComposer
        className="border-t"
        placeholder="Ask about your order"
        allowAttachments={false}
        onSend={({ text }) => {
          setLines((l) => [...l, { id: l.length + 1, self: true, text }])
          setThinking(true)
          setTimeout(() => {
            setThinking(false)
            setLines((l) => [
              ...l,
              { id: l.length + 1, self: false, text: 'It ships tomorrow and lands on Friday.' },
            ])
          }, 1500)
        }}
      />
    </div>
  )
}
