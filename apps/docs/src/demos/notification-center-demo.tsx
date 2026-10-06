import { GitMergeIcon, RocketIcon, ShieldAlertIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/ui/button'
import { NotificationCenter, type NotificationData } from '@/ui/notification-center'
import { toast } from '@/ui/toast'

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000)

const initial: NotificationData[] = [
  {
    id: 'n1',
    title: (
      <>
        <b className="font-medium">Zara Ahmed</b> mentioned you in Homepage hero
      </>
    ),
    description: '"@Alex could we try a shorter headline?"',
    createdAt: minutesAgo(4),
    name: 'Zara Ahmed',
    avatar: '/img/gallery-1-tiny.png',
    category: 'Mentions',
  },
  {
    id: 'n2',
    title: (
      <>
        <b className="font-medium">Diego Santos</b> invited you to Design Systems
      </>
    ),
    createdAt: minutesAgo(52),
    name: 'Diego Santos',
    avatar: '/img/gallery-3-tiny.png',
    actions: [
      { id: 'accept', label: 'Accept' },
      { id: 'decline', label: 'Decline' },
    ],
  },
  {
    id: 'n3',
    title: 'Pull request #128 was merged',
    description: 'feat: notification center',
    createdAt: minutesAgo(60 * 3),
    icon: <GitMergeIcon />,
    read: true,
  },
  {
    id: 'n4',
    title: 'Production deploy finished',
    description: 'uiness-docs went live in 48s.',
    createdAt: minutesAgo(60 * 26),
    icon: <RocketIcon />,
    read: true,
  },
]

const incoming: Omit<NotificationData, 'id' | 'createdAt'>[] = [
  {
    title: 'New sign in from Firefox on Linux',
    description: 'If this was not you, secure your account.',
    icon: <ShieldAlertIcon />,
    actions: [{ id: 'review', label: 'Review' }],
  },
  {
    title: (
      <>
        <b className="font-medium">Diego Santos</b> mentioned you in Pricing
      </>
    ),
    description: '"@Alex the toggle needs a focus ring."',
    name: 'Diego Santos',
    avatar: '/img/gallery-3-tiny.png',
    category: 'Mentions',
  },
]

let counter = 0

export default function NotificationCenterDemo() {
  const [notifications, setNotifications] = useState(initial)

  const read = (id: string) =>
    setNotifications((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)))

  return (
    <div className="flex w-full max-w-lg items-center justify-between gap-3 rounded-xl border bg-card px-4 py-2.5 shadow-xs">
      <span className="font-semibold text-sm">Acme</span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const next = incoming[counter++ % incoming.length] as (typeof incoming)[number]
            setNotifications((list) => [
              { ...next, id: `new-${counter}`, createdAt: new Date() },
              ...list,
            ])
          }}
        >
          Send one
        </Button>
        <NotificationCenter
          notifications={notifications}
          tabs={[
            { value: 'mentions', label: 'Mentions', filter: (n) => n.category === 'Mentions' },
          ]}
          onRead={read}
          onReadAll={() => setNotifications((list) => list.map((n) => ({ ...n, read: true })))}
          onAction={(id, action) => {
            read(id)
            if (action === 'accept' || action === 'decline') {
              setNotifications((list) =>
                list.map((n) => (n.id === id ? { ...n, actions: undefined } : n)),
              )
            }
            toast(`${action[0]?.toUpperCase()}${action.slice(1)}`)
          }}
          footer={
            <Button variant="ghost" size="sm" className="w-full">
              View all notifications
            </Button>
          }
        />
      </div>
    </div>
  )
}
