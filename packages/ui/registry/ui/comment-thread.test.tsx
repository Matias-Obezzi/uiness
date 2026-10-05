import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Confirmer } from './alert-dialog'
import {
  CommentThread,
  type CommentUser,
  formatRelativeTime,
  parseMentions,
  type ThreadComment,
} from './comment-thread'

const users: CommentUser[] = [
  { id: 'me', name: 'Matias Obezzi' },
  { id: 'ada', name: 'Ada Lovelace' },
  { id: 'grace', name: 'Grace Hopper', handle: 'grace.h' },
]

const now = new Date('2026-10-04T12:00:00Z')
const ago = (minutes: number) => new Date(now.getTime() - minutes * 60_000)

const comments: ThreadComment[] = [
  {
    id: 'c1',
    authorId: 'ada',
    body: 'Can @grace.h check the spacing? cc @Matias',
    createdAt: ago(90),
    reactions: [{ emoji: '👍', userIds: ['me'] }],
    replies: [
      { id: 'r1', authorId: 'grace', body: 'On it.', createdAt: ago(60) },
      { id: 'r2', authorId: 'me', body: 'Thanks!', createdAt: ago(5), editedAt: ago(4) },
    ],
  },
]

function renderThread(props: Partial<React.ComponentProps<typeof CommentThread>> = {}) {
  return render(
    <>
      <Confirmer />
      <CommentThread
        comments={comments}
        users={users}
        currentUserId="me"
        now={now}
        locale="en"
        {...props}
      />
    </>,
  )
}

describe('formatRelativeTime', () => {
  it('picks a unit that reads naturally', () => {
    expect(formatRelativeTime(ago(0.2), now, 'en')).toBe('now')
    expect(formatRelativeTime(ago(5), now, 'en')).toBe('5 minutes ago')
    expect(formatRelativeTime(ago(90), now, 'en')).toBe('2 hours ago')
    expect(formatRelativeTime(ago(60 * 24), now, 'en')).toBe('yesterday')
    expect(formatRelativeTime(ago(60 * 24 * 14), now, 'en')).toBe('2 weeks ago')
    expect(formatRelativeTime(new Date(now.getTime() + 3 * 3600_000), now, 'en')).toBe('in 3 hours')
  })
})

describe('parseMentions', () => {
  it('finds known users by handle, first name or full name, and leaves emails alone', () => {
    const segments = parseMentions(
      'hi @grace.h and @ada, also @AdaLovelace, not @nobody or me@ada.dev',
      users,
    )
    expect(segments.filter((s) => s.type === 'mention').map((s) => s.value)).toEqual([
      '@grace.h',
      '@ada',
      '@AdaLovelace',
    ])
    expect(segments.map((s) => s.value).join('')).toBe(
      'hi @grace.h and @ada, also @AdaLovelace, not @nobody or me@ada.dev',
    )
  })
})

describe('CommentThread', () => {
  it('renders comments, replies, mentions and relative times', () => {
    renderThread()
    expect(screen.getByRole('heading', { name: 'Comments' })).toBeTruthy()
    const first = screen.getByRole('article', { name: 'Comment by Ada Lovelace' })
    const mentions = first.querySelectorAll('[data-slot=mention]')
    expect(Array.from(mentions).map((m) => m.getAttribute('title'))).toEqual([
      'Grace Hopper',
      'Matias Obezzi',
    ])
    expect(within(first).getByText('2 hours ago')).toBeTruthy()
    expect(screen.getByText('(edited)')).toBeTruthy()
  })

  it('collapses and expands replies', async () => {
    const user = userEvent.setup()
    renderThread()
    const toggle = screen.getByRole('button', { name: 'Hide replies' })
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    await user.click(toggle)
    expect(screen.queryByText('On it.')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Show 2 replies' }))
    expect(screen.getByText('On it.')).toBeTruthy()
  })

  it('replies to a reply in the same thread, starting with a mention', async () => {
    const user = userEvent.setup()
    const onComment = vi.fn()
    renderThread({ onComment })
    const grace = screen.getByRole('article', { name: 'Comment by Grace Hopper' })
    await user.click(within(grace).getByRole('button', { name: 'Reply' }))
    const field = screen.getByRole('textbox', { name: 'Write a reply' }) as HTMLTextAreaElement
    expect(field.value).toBe('@grace.h ')
    await user.type(field, 'done{Control>}{Enter}{/Control}')
    expect(onComment).toHaveBeenCalledWith('@grace.h done', 'c1')
    await user.type(screen.getByRole('textbox', { name: 'Add a comment' }), 'Top level')
    await user.click(screen.getByRole('button', { name: 'Comment' }))
    expect(onComment).toHaveBeenLastCalledWith('Top level')
  })

  it('edits your own comment in place', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    renderThread({ onEdit })
    // Only your own comments have the menu.
    expect(screen.getAllByRole('button', { name: 'More actions' })).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'More actions' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Edit' }))
    const field = screen.getByRole('textbox', { name: 'Edit comment' })
    await user.clear(field)
    await user.type(field, 'Thanks a lot!')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(onEdit).toHaveBeenCalledWith('r2', 'Thanks a lot!')
  })

  it('deletes only after the confirm', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    renderThread({ onDelete })
    await user.click(screen.getByRole('button', { name: 'More actions' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Delete' }))
    const dialog = await screen.findByRole('alertdialog', { name: 'Delete this comment?' })
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(onDelete).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'More actions' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Delete' }))
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Delete' }),
    )
    expect(onDelete).toHaveBeenCalledWith('r2')
  })

  it('toggles reactions', async () => {
    const user = userEvent.setup()
    const onReact = vi.fn()
    renderThread({ onReact })
    await user.click(screen.getByRole('button', { name: '👍 1' }))
    expect(onReact).toHaveBeenCalledWith('c1', '👍', false)
  })

  it('is read only while resolved and reopens', async () => {
    const user = userEvent.setup()
    const onResolvedChange = vi.fn()
    renderThread({ resolved: true, onResolvedChange, onComment: vi.fn(), onEdit: vi.fn() })
    expect(screen.getByText('Resolved')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Reply' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'More actions' })).toBeNull()
    expect(screen.queryByRole('textbox')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Reopen' }))
    expect(onResolvedChange).toHaveBeenCalledWith(false)
  })
})
