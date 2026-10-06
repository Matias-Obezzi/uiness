import { useState } from 'react'
import { CommentThread, type CommentUser, type ThreadComment } from '@/ui/comment-thread'

const users: CommentUser[] = [
  { id: 'me', name: 'Jordan Blake' },
  { id: 'aiyana', name: 'Aiyana Brooks', avatar: '/img/gallery-1-tiny.png' },
  { id: 'felix', name: 'Felix Wagner', avatar: '/img/gallery-3-tiny.png' },
]

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000)

const initial: ThreadComment[] = [
  {
    id: 'c1',
    authorId: 'aiyana',
    body: 'The hero headline wraps onto three lines on small phones. @Felix could we try a shorter one?',
    createdAt: minutesAgo(180),
    reactions: [{ emoji: '👀', userIds: ['felix', 'me'] }],
    replies: [
      {
        id: 'c2',
        authorId: 'felix',
        body: 'Good catch. "Ship faster, together" fits in two.',
        createdAt: minutesAgo(150),
      },
      {
        id: 'c3',
        authorId: 'me',
        body: 'Works for me. I will update the copy doc.',
        createdAt: minutesAgo(12),
        reactions: [{ emoji: '👍', userIds: ['aiyana'] }],
      },
    ],
  },
  {
    id: 'c4',
    authorId: 'felix',
    body: 'Also: the pricing toggle needs a focus ring.',
    createdAt: minutesAgo(3),
  },
]

let counter = 10

export default function CommentThreadDemo() {
  const [comments, setComments] = useState(initial)
  const [resolved, setResolved] = useState(false)

  // Applies a change to whichever comment has the id, top level or reply.
  const update = (id: string, change: (c: ThreadComment) => ThreadComment | null) =>
    setComments((list) =>
      list.flatMap((comment) => {
        if (comment.id === id) {
          const next = change(comment)
          return next ? [next] : []
        }
        const replies = comment.replies?.flatMap((reply) => {
          if (reply.id !== id) return [reply]
          const next = change(reply)
          return next ? [next] : []
        })
        return [{ ...comment, replies }]
      }),
    )

  return (
    <CommentThread
      className="w-full max-w-xl"
      title="Homepage hero"
      comments={comments}
      users={users}
      currentUserId="me"
      resolved={resolved}
      onResolvedChange={setResolved}
      onComment={(body, parentId) => {
        const comment = { id: `c${++counter}`, authorId: 'me', body, createdAt: new Date() }
        setComments((list) =>
          parentId
            ? list.map((c) =>
                c.id === parentId ? { ...c, replies: [...(c.replies ?? []), comment] } : c,
              )
            : [...list, comment],
        )
      }}
      onEdit={(id, body) => update(id, (c) => ({ ...c, body, editedAt: new Date() }))}
      onDelete={(id) => update(id, () => null)}
      onReact={(id, emoji, added) =>
        update(id, (c) => {
          const list = c.reactions ?? []
          const all = list.some((r) => r.emoji === emoji) ? list : [...list, { emoji, userIds: [] }]
          const reactions = all
            .map((r) => {
              if (r.emoji !== emoji) return r
              const others = r.userIds.filter((u) => u !== 'me')
              return { emoji, userIds: added ? [...others, 'me'] : others }
            })
            .filter((r) => r.userIds.length > 0)
          return { ...c, reactions }
        })
      }
    />
  )
}
