import { CalendarIcon, PackageIcon } from 'lucide-react'
import { useState } from 'react'
import { type NotificationData, NotificationPanel } from '@/components/ui/notification-center'

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000)

const initial: NotificationData[] = [
  {
    id: 'p1',
    title: 'Your order has shipped',
    description: 'Arrives Friday. Track it from your orders page.',
    createdAt: hoursAgo(1),
    icon: <PackageIcon />,
  },
  {
    id: 'p2',
    title: 'Design review moved to 3:30 PM',
    createdAt: hoursAgo(30),
    icon: <CalendarIcon />,
    read: true,
  },
]

export default function NotificationCenterPanel() {
  const [notifications, setNotifications] = useState(initial)
  return (
    <NotificationPanel
      className="w-full max-w-sm overflow-hidden rounded-xl border shadow-sm"
      title="Inbox"
      notifications={notifications}
      onRead={(id) =>
        setNotifications((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)))
      }
      onReadAll={() => setNotifications((list) => list.map((n) => ({ ...n, read: true })))}
    />
  )
}
