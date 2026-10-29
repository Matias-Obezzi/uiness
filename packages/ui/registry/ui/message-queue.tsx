'use client'

import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  CornerDownLeftIcon,
  PencilIcon,
  SendIcon,
  XIcon,
} from 'lucide-react'
import * as React from 'react'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface QueuedMessage {
  id: string
  text: string
}

export interface MessageQueueLabels {
  /** Names the list, with how many are waiting. */
  queue: (count: number) => string
  placeholder: string
  send: string
  /** The send button while the agent works. */
  queueIt: string
  sendNow: string
  edit: string
  save: string
  remove: string
  moveUp: string
  moveDown: string
}

export const defaultMessageQueueLabels: MessageQueueLabels = {
  queue: (count) => `${count} queued ${count === 1 ? 'message' : 'messages'}`,
  placeholder: 'Send a message…',
  send: 'Send',
  queueIt: 'Queue',
  sendNow: 'Send now',
  edit: 'Edit',
  save: 'Save',
  remove: 'Remove',
  moveUp: 'Move up',
  moveDown: 'Move down',
}

let seq = 0

export interface MessageQueueProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** The agent is working: new messages wait in the queue. */
  busy: boolean
  /** Sends a message to the agent. */
  onSend: (text: string) => void
  labels?: Partial<MessageQueueLabels>
}

/**
 * A composer that keeps taking messages while the agent works. Follow-ups stack above it, where
 * they can be reordered, edited, removed or sent at once; when the run ends they go in one by
 * one, each after the reply to the one before.
 */
function MessageQueue({
  busy,
  onSend,
  labels: labelsProp,
  className,
  ...props
}: MessageQueueProps) {
  const labels = useLabels('message-queue', defaultMessageQueueLabels, labelsProp)
  const [queue, setQueue] = React.useState<QueuedMessage[]>([])
  const [text, setText] = React.useState('')
  const [editing, setEditing] = React.useState<QueuedMessage | null>(null)
  const sendRef = React.useRef(onSend)
  React.useEffect(() => {
    sendRef.current = onSend
  })

  // Each time the agent goes idle, the next message goes in.
  const next = queue[0]
  React.useEffect(() => {
    if (busy || !next) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the agent going idle is what sends the next one
    setQueue((prev) => prev.slice(1))
    sendRef.current(next.text)
  }, [busy, next])

  const submit = () => {
    const value = text.trim()
    if (!value) return
    if (busy || queue.length) setQueue((prev) => [...prev, { id: `queued-${++seq}`, text: value }])
    else onSend(value)
    setText('')
  }
  const move = (i: number, by: number) =>
    setQueue((prev) => {
      const list = [...prev]
      const [item] = list.splice(i, 1)
      if (item) list.splice(i + by, 0, item)
      return list
    })

  return (
    <div data-slot="message-queue" className={cn('flex flex-col gap-2', className)} {...props}>
      {queue.length > 0 && (
        <ol aria-label={labels.queue(queue.length)} className="flex flex-col gap-1.5">
          {queue.map((item, i) => (
            <li
              key={item.id}
              className="flex items-center gap-1 rounded-xl border border-dashed bg-muted/40 py-1 pr-1 pl-3 text-sm animate-in fade-in slide-in-from-bottom-1 motion-reduce:animate-none"
            >
              {editing?.id === item.id ? (
                <form
                  className="flex min-w-0 flex-1 items-center gap-1"
                  onSubmit={(event) => {
                    event.preventDefault()
                    const value = editing.text.trim()
                    setQueue((prev) =>
                      value
                        ? prev.map((q) => (q.id === item.id ? { ...q, text: value } : q))
                        : prev.filter((q) => q.id !== item.id),
                    )
                    setEditing(null)
                  }}
                >
                  <input
                    // biome-ignore lint/a11y/noAutofocus: opened by the Edit button, to type in at once
                    autoFocus
                    aria-label={labels.edit}
                    value={editing.text}
                    onChange={(event) => setEditing({ ...item, text: event.target.value })}
                    onKeyDown={(event) => event.key === 'Escape' && setEditing(null)}
                    className="h-8 min-w-0 flex-1 bg-transparent text-base outline-none md:text-sm"
                  />
                  <QueueButton type="submit" label={labels.save}>
                    <CheckIcon />
                  </QueueButton>
                </form>
              ) : (
                <>
                  <span className="w-5 shrink-0 text-muted-foreground text-xs tabular-nums">
                    {i + 1}
                  </span>
                  <p className="min-w-0 flex-1 truncate">{item.text}</p>
                  <QueueButton label={labels.moveUp} disabled={i === 0} onClick={() => move(i, -1)}>
                    <ArrowUpIcon />
                  </QueueButton>
                  <QueueButton
                    label={labels.moveDown}
                    disabled={i === queue.length - 1}
                    onClick={() => move(i, 1)}
                  >
                    <ArrowDownIcon />
                  </QueueButton>
                  <QueueButton label={labels.edit} onClick={() => setEditing(item)}>
                    <PencilIcon />
                  </QueueButton>
                  <QueueButton
                    label={labels.sendNow}
                    onClick={() => {
                      setQueue((prev) => prev.filter((q) => q.id !== item.id))
                      onSend(item.text)
                    }}
                  >
                    <CornerDownLeftIcon />
                  </QueueButton>
                  <QueueButton
                    label={labels.remove}
                    onClick={() => setQueue((prev) => prev.filter((q) => q.id !== item.id))}
                  >
                    <XIcon />
                  </QueueButton>
                </>
              )}
            </li>
          ))}
        </ol>
      )}
      <form
        className="flex items-end gap-2 rounded-2xl border bg-background p-2 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50"
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <textarea
          aria-label={labels.placeholder}
          placeholder={labels.placeholder}
          rows={1}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault()
              submit()
            }
          }}
          className="field-sizing-content max-h-40 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-base outline-none placeholder:text-muted-foreground md:text-sm"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="relative flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary px-3.5 font-medium text-primary-foreground text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-40 pointer-coarse:h-11 [&_svg]:size-4"
        >
          <SendIcon aria-hidden="true" />
          {busy ? labels.queueIt : labels.send}
        </button>
      </form>
    </div>
  )
}

function QueueButton({
  label,
  className,
  ...props
}: React.ComponentProps<'button'> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        'relative flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-30 pointer-coarse:size-9 [&_svg]:size-3.5',
        className,
      )}
      {...props}
    />
  )
}

export { MessageQueue }
