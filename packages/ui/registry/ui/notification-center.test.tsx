import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import {
  NotificationBell,
  NotificationCenter,
  type NotificationData,
  NotificationPanel,
} from './notification-center'

const now = new Date(2026, 9, 4, 12, 0)
const ago = (minutes: number) => new Date(now.getTime() - minutes * 60_000)

const notifications: NotificationData[] = [
  {
    id: 'n1',
    title: 'Ada mentioned you',
    description: 'Can you check the spacing?',
    createdAt: ago(5),
    name: 'Ada Lovelace',
    category: 'Mentions',
  },
  {
    id: 'n2',
    title: 'Grace invited you to Design',
    createdAt: ago(60 * 3),
    name: 'Grace Hopper',
    actions: [
      { id: 'accept', label: 'Accept' },
      { id: 'decline', label: 'Decline' },
    ],
  },
  { id: 'n3', title: 'Deploy finished', createdAt: ago(60 * 26), read: true, icon: '🚀' },
]

describe('NotificationBell', () => {
  it('names the unread count and caps the badge', () => {
    const { rerender } = render(<NotificationBell count={3} />)
    expect(screen.getByRole('button', { name: 'Notifications, 3 unread' })).toBeTruthy()
    rerender(<NotificationBell count={150} />)
    expect(screen.getByText('99+')).toBeTruthy()
    rerender(<NotificationBell count={0} />)
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeTruthy()
  })
})

describe('NotificationPanel', () => {
  it('groups by day, newest first', () => {
    render(<NotificationPanel notifications={notifications} now={now} locale="en" />)
    const today = screen.getByRole('region', { name: 'Today' })
    expect(within(today).getAllByRole('listitem')).toHaveLength(2)
    expect(within(today).getAllByRole('listitem')[0]?.textContent).toContain('Ada mentioned you')
    expect(screen.getByRole('region', { name: 'Yesterday' })).toBeTruthy()
  })

  it('marks one or all as read and reports actions', async () => {
    const user = userEvent.setup()
    const onRead = vi.fn()
    const onReadAll = vi.fn()
    const onAction = vi.fn()
    render(
      <NotificationPanel
        notifications={notifications}
        onRead={onRead}
        onReadAll={onReadAll}
        onAction={onAction}
        now={now}
      />,
    )
    expect(screen.getAllByRole('button', { name: 'Mark as read' })).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: 'Ada mentioned you' }))
    expect(onRead).toHaveBeenCalledWith('n1')
    await user.click(screen.getByRole('button', { name: 'Accept' }))
    expect(onAction).toHaveBeenCalledWith('n2', 'accept')
    await user.click(screen.getByRole('button', { name: /Mark all as read/ }))
    expect(onReadAll).toHaveBeenCalled()
  })

  it('filters by tab and shows an empty state', async () => {
    const user = userEvent.setup()
    render(
      <NotificationPanel
        notifications={notifications.map((n) => ({ ...n, read: n.id !== 'n1' }))}
        tabs={[
          { value: 'mentions', label: 'Mentions', filter: (n) => n.category === 'Mentions' },
          { value: 'teams', label: 'Teams', filter: (n) => n.category === 'Teams' },
        ]}
        now={now}
      />,
    )
    await user.click(screen.getByRole('tab', { name: /Unread/ }))
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    await user.click(screen.getByRole('tab', { name: 'Mentions' }))
    expect(screen.getByText('Ada mentioned you')).toBeTruthy()
    await user.click(screen.getByRole('tab', { name: 'Teams' }))
    expect(screen.getByText('No notifications')).toBeTruthy()
  })
})

describe('NotificationCenter', () => {
  it('opens the panel from the bell, with a footer', async () => {
    const user = userEvent.setup()
    render(
      <NotificationCenter
        notifications={notifications}
        now={now}
        footer={<button type="button">View all</button>}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Notifications, 2 unread' }))
    const dialog = await screen.findByRole('dialog', { name: 'Notifications' })
    expect(within(dialog).getByRole('tablist')).toBeTruthy()
    expect(within(dialog).getByRole('button', { name: 'View all' })).toBeTruthy()
  })

  it('slides in notifications that arrive while it is open', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<NotificationCenter notifications={notifications} now={now} />)
    await user.click(screen.getByRole('button', { name: /Notifications/ }))
    const fresh: NotificationData = { id: 'n4', title: 'New comment', createdAt: now }
    rerender(<NotificationCenter notifications={[fresh, ...notifications]} now={now} />)
    const item = (await screen.findByText('New comment')).closest('li') as HTMLElement
    expect(item.className).toContain('animate-in')
    const old = screen.getByText('Ada mentioned you').closest('li') as HTMLElement
    expect(old.className).not.toContain('animate-in')
  })
})
