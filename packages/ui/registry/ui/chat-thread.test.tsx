import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import {
  ChatComposer,
  type ChatMessage,
  ChatThread,
  type ChatUser,
  formatBytes,
  groupChatMessages,
} from './chat-thread'

const users: ChatUser[] = [
  { id: 'me', name: 'Matias Obezzi' },
  { id: 'ada', name: 'Ada Lovelace' },
  { id: 'grace', name: 'Grace Hopper' },
]

const today = new Date()
today.setHours(10, 0, 0, 0)
const at = (minutes: number, days = 0) =>
  new Date(today.getTime() + minutes * 60_000 - days * 86_400_000)

const messages: ChatMessage[] = [
  { id: '1', authorId: 'ada', text: 'Yesterday news', createdAt: at(0, 1) },
  { id: '2', authorId: 'ada', text: 'Morning', createdAt: at(0) },
  {
    id: '3',
    authorId: 'ada',
    text: 'Look at this',
    createdAt: at(1),
    reactions: [{ emoji: '👍', userIds: ['me', 'grace'] }],
  },
  {
    id: '4',
    authorId: 'me',
    text: 'Nice',
    createdAt: at(2),
    seenBy: ['ada'],
    attachments: [{ id: 'a', name: 'spec.pdf', type: 'application/pdf', size: 2_400_000 }],
  },
]

describe('groupChatMessages', () => {
  it('breaks on author, day and long gaps', () => {
    const rows = groupChatMessages([
      ...messages,
      { id: '5', authorId: 'me', text: 'Later', createdAt: at(30) },
    ])
    expect(rows.map((row) => (row.type === 'day' ? 'day' : row.messages.length))).toEqual([
      'day',
      1,
      'day',
      2,
      1,
      1,
    ])
  })
})

describe('ChatThread', () => {
  it('groups messages under one avatar with day separators', () => {
    render(<ChatThread messages={messages} users={users} currentUserId="me" />)
    const log = screen.getByRole('log', { name: 'Messages' })
    expect(
      within(log)
        .getAllByRole('separator')
        .map((s) => s.getAttribute('aria-label')),
    ).toEqual(['Yesterday', 'Today'])
    const groups = log.querySelectorAll('[data-slot=chat-message-group]')
    expect(groups).toHaveLength(3)
    // Ada's two messages from this morning share one header.
    expect(within(groups[1] as HTMLElement).getAllByText('Ada Lovelace')).toHaveLength(1)
    expect(groups[2]?.hasAttribute('data-self')).toBe(true)
    expect(screen.getByText('spec.pdf')).toBeTruthy()
    expect(screen.getByRole('img', { name: 'Seen by Ada Lovelace' })).toBeTruthy()
  })

  it('toggles reactions and reports whether one was added', async () => {
    const user = userEvent.setup()
    const onReact = vi.fn()
    render(<ChatThread messages={messages} users={users} currentUserId="me" onReact={onReact} />)
    const thumbs = screen.getByRole('button', { name: '👍 2' })
    expect(thumbs.getAttribute('aria-pressed')).toBe('true')
    await user.click(thumbs)
    expect(onReact).toHaveBeenLastCalledWith('3', '👍', false)
    await user.click(screen.getAllByRole('button', { name: 'Add reaction' })[0] as HTMLElement)
    await user.click(await screen.findByRole('button', { name: 'React with 🎉' }))
    expect(onReact).toHaveBeenLastCalledWith('1', '🎉', true)
  })

  it('shows who is typing', () => {
    render(<ChatThread messages={messages} users={users} currentUserId="me" typing={['grace']} />)
    expect(screen.getByRole('status').textContent).toContain('Grace Hopper is typing')
  })

  it('has no composer without onSend', () => {
    render(<ChatThread messages={messages} users={users} currentUserId="me" />)
    expect(screen.queryByRole('textbox')).toBeNull()
  })
})

describe('ChatComposer', () => {
  it('sends on Enter, keeps Shift+Enter as a new line and empties', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<ChatComposer onSend={onSend} />)
    const field = screen.getByRole('textbox', { name: 'Message' }) as HTMLTextAreaElement
    const send = screen.getByRole('button', { name: 'Send' }) as HTMLButtonElement
    expect(send.disabled).toBe(true)
    await user.type(field, 'Hello{Shift>}{Enter}{/Shift}there')
    expect(field.value).toBe('Hello\nthere')
    expect(send.disabled).toBe(false)
    await user.keyboard('{Enter}')
    expect(onSend).toHaveBeenCalledWith({ text: 'Hello\nthere', files: [] })
    expect(field.value).toBe('')
  })

  it('attaches files from the picker and sends them', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    const { container } = render(<ChatComposer onSend={onSend} />)
    const input = container.querySelector('input[type=file]') as HTMLInputElement
    const file = new File(['%PDF'], 'notes.pdf', { type: 'application/pdf' })
    await user.upload(input, file)
    expect(screen.getByText('notes.pdf')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Send' }))
    expect(onSend).toHaveBeenCalledWith({ text: '', files: [file] })
  })

  it('does not send while an IME is composing', () => {
    const onSend = vi.fn()
    render(<ChatComposer onSend={onSend} />)
    const field = screen.getByRole('textbox')
    fireEvent.change(field, { target: { value: 'にほん' } })
    fireEvent.keyDown(field, { key: 'Enter', isComposing: true })
    expect(onSend).not.toHaveBeenCalled()
  })
})

describe('formatBytes', () => {
  it('reads in the right unit', () => {
    expect(formatBytes(2_400_000, 'en-US')).toBe('2.4 MB')
    expect(formatBytes(512, 'en-US')).toBe('512 byte')
  })
})
