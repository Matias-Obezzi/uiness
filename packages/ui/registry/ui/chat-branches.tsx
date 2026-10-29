'use client'

import { ChevronLeftIcon, ChevronRightIcon, PencilIcon } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface BranchMessage {
  id: string
  /** The message it answers or follows; `null` for the first ones. */
  parentId: string | null
  role: 'user' | 'assistant'
  text: string
}

export interface ChatBranchesLabels {
  /** Names the conversation. */
  conversation: string
  /** Names the tree of versions. */
  tree: string
  /** A dot of the tree. */
  node: (depth: number, version: number, of: number) => string
  version: (index: number, total: number) => string
  previous: string
  next: string
  edit: string
  save: string
  cancel: string
}

export const defaultChatBranchesLabels: ChatBranchesLabels = {
  conversation: 'Conversation',
  tree: 'Versions',
  node: (depth, version, of) => `Message ${depth}, version ${version} of ${of}`,
  version: (index, total) => `Version ${index} of ${total}`,
  previous: 'Previous version',
  next: 'Next version',
  edit: 'Edit',
  save: 'Save and send',
  cancel: 'Cancel',
}

const STEP = 16

export interface ChatBranchesProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  messages: BranchMessage[]
  /**
   * Called when a message is edited: add a new message with the same `parentId` and the new
   * text, and its reply. The new branch is shown once it arrives.
   */
  onEdit: (id: string, text: string) => void
  labels?: Partial<ChatBranchesLabels>
}

/**
 * A chat where editing a message starts a new branch instead of overwriting it. Messages with
 * other versions get arrows to move between them, and a small tree beside the chat shows every
 * version; a dot in it jumps to that branch.
 */
function ChatBranches({
  messages,
  onEdit,
  labels: labelsProp,
  className,
  ...props
}: ChatBranchesProps) {
  const labels = useLabels('chat-branches', defaultChatBranchesLabels, labelsProp)
  // Which child is shown under each parent; the newest by default.
  const [picked, setPicked] = React.useState<Record<string, string>>({})
  const [editing, setEditing] = React.useState<{ id: string; text: string } | null>(null)

  const children = React.useMemo(() => {
    const map = new Map<string | null, BranchMessage[]>()
    for (const m of messages) map.set(m.parentId, [...(map.get(m.parentId) ?? []), m])
    return map
  }, [messages])
  const key = (parentId: string | null) => parentId ?? ''
  const shown = (parentId: string | null) => {
    const list = children.get(parentId) ?? []
    return list.find((m) => m.id === picked[key(parentId)]) ?? list.at(-1)
  }

  // The path shown, from the first message down.
  const path: BranchMessage[] = []
  for (let node = shown(null); node; node = shown(node.id)) path.push(node)

  /** Shows `id` and, under it, the newest of everything. */
  const showBranch = (id: string) => {
    const next: Record<string, string> = { ...picked }
    for (let node = messages.find((m) => m.id === id); node; ) {
      next[key(node.parentId)] = node.id
      const parentId = node.parentId
      node = parentId === null ? undefined : messages.find((m) => m.id === parentId)
    }
    // Below it, back to the newest.
    const below = (parentId: string) => {
      for (const child of children.get(parentId) ?? []) {
        delete next[key(parentId)]
        below(child.id)
      }
    }
    below(id)
    setPicked(next)
  }

  // The tree: each message a dot, by depth down and by branch across.
  const layout = React.useMemo(() => {
    const dots: { node: BranchMessage; x: number; y: number }[] = []
    let column = 0
    const place = (node: BranchMessage, depth: number): number => {
      const kids = children.get(node.id) ?? []
      const xs = kids.map((kid) => place(kid, depth + 1))
      const x = xs.length ? ((xs[0] as number) + (xs.at(-1) as number)) / 2 : column++ * STEP
      dots.push({ node, x, y: depth * STEP })
      return x
    }
    for (const root of children.get(null) ?? []) place(root, 0)
    return {
      dots,
      width: Math.max(column, 1) * STEP,
      height: (Math.max(0, ...dots.map((d) => d.y)) || 0) + STEP,
    }
  }, [children])
  const onPath = new Set(path.map((m) => m.id))
  const at = (id: string | null) => layout.dots.find((d) => d.node.id === id)

  return (
    <div
      data-slot="chat-branches"
      className={cn('flex flex-col gap-4 sm:flex-row', className)}
      {...props}
    >
      <ol aria-label={labels.conversation} className="flex min-w-0 flex-1 flex-col gap-3">
        {path.map((message) => {
          const siblings = children.get(message.parentId) ?? []
          const index = siblings.indexOf(message)
          const mine = message.role === 'user'
          return (
            <li
              key={message.id}
              className={cn('flex flex-col gap-1', mine ? 'items-end' : 'items-start')}
            >
              {editing?.id === message.id ? (
                <form
                  className="flex w-full max-w-[85%] flex-col gap-2"
                  onSubmit={(event) => {
                    event.preventDefault()
                    if (editing.text.trim()) onEdit(message.id, editing.text.trim())
                    // The new version is the newest, so it is shown once it arrives.
                    setPicked((prev) => {
                      const next = { ...prev }
                      delete next[key(message.parentId)]
                      return next
                    })
                    setEditing(null)
                  }}
                >
                  <textarea
                    // biome-ignore lint/a11y/noAutofocus: opened by the Edit button, to type in at once
                    autoFocus
                    aria-label={labels.edit}
                    value={editing.text}
                    onChange={(event) => setEditing({ id: message.id, text: event.target.value })}
                    className="field-sizing-content min-h-16 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditing(null)}
                    >
                      {labels.cancel}
                    </Button>
                    <Button type="submit" size="sm">
                      {labels.save}
                    </Button>
                  </div>
                </form>
              ) : (
                <div
                  className={cn(
                    'max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm',
                    mine ? 'bg-primary text-primary-foreground' : 'bg-muted',
                  )}
                >
                  {message.text}
                </div>
              )}
              {editing?.id !== message.id && (siblings.length > 1 || mine) && (
                <div className="flex items-center gap-0.5 text-muted-foreground text-xs">
                  {siblings.length > 1 && (
                    <>
                      <SmallButton
                        label={labels.previous}
                        disabled={index === 0}
                        onClick={() => showBranch((siblings[index - 1] as BranchMessage).id)}
                      >
                        <ChevronLeftIcon />
                      </SmallButton>
                      <span className="tabular-nums" aria-hidden="true">
                        {index + 1}/{siblings.length}
                      </span>
                      <span className="sr-only">{labels.version(index + 1, siblings.length)}</span>
                      <SmallButton
                        label={labels.next}
                        disabled={index === siblings.length - 1}
                        onClick={() => showBranch((siblings[index + 1] as BranchMessage).id)}
                      >
                        <ChevronRightIcon />
                      </SmallButton>
                    </>
                  )}
                  {mine && (
                    <SmallButton
                      label={labels.edit}
                      onClick={() => setEditing({ id: message.id, text: message.text })}
                    >
                      <PencilIcon />
                    </SmallButton>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ol>

      {layout.dots.length > 1 && (
        <nav aria-label={labels.tree} className="shrink-0 self-start rounded-xl border bg-card p-3">
          <div className="relative" style={{ width: layout.width, height: layout.height }}>
            <svg
              aria-hidden="true"
              className="absolute inset-0 overflow-visible"
              width={layout.width}
              height={layout.height}
            >
              {layout.dots.map(({ node, x, y }) => {
                const parent = at(node.parentId)
                if (!parent) return null
                return (
                  <line
                    key={node.id}
                    x1={parent.x + STEP / 2}
                    y1={parent.y + STEP / 2}
                    x2={x + STEP / 2}
                    y2={y + STEP / 2}
                    strokeWidth={1.5}
                    className={onPath.has(node.id) ? 'stroke-primary' : 'stroke-border'}
                  />
                )
              })}
            </svg>
            {layout.dots.map(({ node, x, y }) => {
              const siblings = children.get(node.parentId) ?? []
              return (
                <button
                  key={node.id}
                  type="button"
                  aria-label={labels.node(
                    Math.round(y / STEP) + 1,
                    siblings.indexOf(node) + 1,
                    siblings.length,
                  )}
                  aria-current={onPath.has(node.id) || undefined}
                  onClick={() => showBranch(node.id)}
                  className="absolute flex size-4 items-center justify-center rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  style={{ left: x, top: y }}
                >
                  <span
                    className={cn(
                      'size-2 rounded-full',
                      onPath.has(node.id) ? 'bg-primary' : 'bg-muted-foreground/40',
                      node.role === 'assistant' && 'rounded-[2px]',
                    )}
                  />
                </button>
              )
            })}
          </div>
        </nav>
      )}
    </div>
  )
}

function SmallButton({
  label,
  className,
  ...props
}: React.ComponentProps<'button'> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        'relative flex size-6 items-center justify-center rounded-md outline-none hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-40 pointer-coarse:after:absolute pointer-coarse:after:-inset-2.5 [&_svg]:size-3.5',
        className,
      )}
      {...props}
    />
  )
}

export { ChatBranches }
