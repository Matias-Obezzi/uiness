import { ArchiveIcon, MailIcon, MailOpenIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/ui/button'
import { SwipeActions, SwipeActionsRow } from '@/ui/swipe-actions'

const inbox = [
  {
    id: 1,
    from: 'Bruna Lima',
    subject: 'Lunch on Friday?',
    preview: 'There is a new place by the river…',
  },
  {
    id: 2,
    from: 'Billing',
    subject: 'Your invoice for October',
    preview: 'Thanks for your payment of $24.00',
  },
  {
    id: 3,
    from: 'Kenji',
    subject: 'Design review notes',
    preview: 'Left a few comments on the tree view',
  },
  {
    id: 4,
    from: 'GitHub',
    subject: '[uiness] New pull request',
    preview: 'feat: navigation surfaces',
  },
]

export default function SwipeActionsDemo() {
  const [mail, setMail] = useState(inbox.map((m) => ({ ...m, unread: m.id % 2 === 1 })))
  const remove = (id: number) => setMail((list) => list.filter((m) => m.id !== id))
  const toggleRead = (id: number) =>
    setMail((list) => list.map((m) => (m.id === id ? { ...m, unread: !m.unread } : m)))

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <SwipeActions aria-label="Inbox" className="rounded-lg border">
        {mail.map((m) => (
          <SwipeActionsRow
            key={m.id}
            label={m.subject}
            leading={[
              {
                label: m.unread ? 'Read' : 'Unread',
                icon: m.unread ? <MailOpenIcon /> : <MailIcon />,
                tone: 'primary',
                keepRow: true,
                onSelect: () => toggleRead(m.id),
              },
            ]}
            trailing={[
              {
                label: 'Delete',
                icon: <Trash2Icon />,
                tone: 'destructive',
                onSelect: () => remove(m.id),
              },
              { label: 'Archive', icon: <ArchiveIcon />, onSelect: () => remove(m.id) },
            ]}
          >
            <div className="flex items-start gap-3 py-3 pl-4">
              <span
                aria-hidden="true"
                className={`mt-1.5 size-2 shrink-0 rounded-full ${m.unread ? 'bg-primary' : 'bg-transparent'}`}
              />
              <div className="min-w-0">
                <p className="flex items-baseline gap-2 text-sm">
                  <span className={m.unread ? 'font-semibold' : 'font-medium'}>{m.from}</span>
                  {m.unread && <span className="sr-only">unread</span>}
                </p>
                <p className="truncate text-sm">{m.subject}</p>
                <p className="truncate text-muted-foreground text-xs">{m.preview}</p>
              </div>
            </div>
          </SwipeActionsRow>
        ))}
      </SwipeActions>
      {mail.length < inbox.length && (
        <Button
          variant="ghost"
          size="sm"
          className="self-center"
          onClick={() => setMail(inbox.map((m) => ({ ...m, unread: m.id % 2 === 1 })))}
        >
          Bring them back
        </Button>
      )}
    </div>
  )
}
