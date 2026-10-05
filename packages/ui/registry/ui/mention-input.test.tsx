import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import {
  MentionInput,
  type MentionTrigger,
  type MentionValue,
  serializeMentions,
} from './mention-input'

const triggers: MentionTrigger[] = [
  {
    char: '@',
    label: 'People',
    items: [
      { id: 'ada', label: 'Ada Lovelace' },
      { id: 'alan', label: 'Alan Turing' },
      { id: 'grace', label: 'Grace Hopper' },
    ],
  },
  {
    char: '#',
    label: 'Channels',
    items: (q) =>
      ['general', 'design', 'releases']
        .filter((c) => c.startsWith(q))
        .map((c) => ({ id: c, label: c })),
  },
]

const box = () => screen.getByRole('textbox') as HTMLTextAreaElement

describe('MentionInput', () => {
  it('opens people on @ and filters them as you type', async () => {
    render(<MentionInput triggers={triggers} aria-label="Message" />)
    await userEvent.type(box(), 'Hi @')
    expect(await screen.findByRole('listbox', { name: 'People' })).toBeTruthy()
    expect(screen.getAllByRole('option')).toHaveLength(3)
    await userEvent.type(box(), 'gr')
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['@Grace Hopper'])
  })

  it('points the textarea at the active suggestion', async () => {
    render(<MentionInput triggers={triggers} aria-label="Message" />)
    await userEvent.type(box(), '@a')
    const options = await screen.findAllByRole('option')
    expect(box().getAttribute('aria-activedescendant')).toBe(options[0]?.id)
    await userEvent.keyboard('{ArrowDown}')
    expect(box().getAttribute('aria-activedescendant')).toBe(options[1]?.id)
    expect(options[1]?.getAttribute('aria-selected')).toBe('true')
  })

  it('inserts a picked mention as a token and reports it', async () => {
    const onValueChange = vi.fn()
    render(<MentionInput triggers={triggers} onValueChange={onValueChange} aria-label="Message" />)
    await userEvent.type(box(), 'Hi @ad')
    await screen.findByRole('listbox')
    await userEvent.keyboard('{Enter}')
    expect(box().value).toBe('Hi @Ada Lovelace ')
    expect(onValueChange.mock.lastCall?.[0]).toEqual({
      text: 'Hi @Ada Lovelace ',
      mentions: [{ trigger: '@', id: 'ada', label: 'Ada Lovelace', start: 3, end: 16 }],
    })
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(box().selectionStart).toBe(17)
  })

  it('opens channels on # from a function', async () => {
    const onValueChange = vi.fn()
    render(<MentionInput triggers={triggers} onValueChange={onValueChange} aria-label="Message" />)
    await userEvent.type(box(), 'see #de')
    expect(await screen.findByRole('listbox', { name: 'Channels' })).toBeTruthy()
    await userEvent.keyboard('{Tab}')
    expect(onValueChange.mock.lastCall?.[0].mentions[0]).toMatchObject({
      trigger: '#',
      id: 'design',
    })
  })

  it('deletes a mention as a whole', async () => {
    const onValueChange = vi.fn()
    render(<MentionInput triggers={triggers} onValueChange={onValueChange} aria-label="Message" />)
    await userEvent.type(box(), 'Hi @al')
    await screen.findByRole('listbox')
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard('{Backspace}')
    expect(box().value).toBe('Hi @Alan Turing')
    await userEvent.keyboard('{Backspace}')
    expect(box().value).toBe('Hi ')
    expect(onValueChange.mock.lastCall?.[0].mentions).toEqual([])
  })

  it('keeps mentions in place when text is typed before them', async () => {
    const value: MentionValue = {
      text: '@Ada Lovelace hi',
      mentions: [{ trigger: '@', id: 'ada', label: 'Ada Lovelace', start: 0, end: 13 }],
    }
    const onValueChange = vi.fn()
    render(
      <MentionInput
        triggers={triggers}
        defaultValue={value}
        onValueChange={onValueChange}
        aria-label="Message"
      />,
    )
    await userEvent.type(box(), 'Hey ', { initialSelectionStart: 0, initialSelectionEnd: 0 })
    expect(onValueChange.mock.lastCall?.[0].mentions[0]).toMatchObject({ start: 4, end: 17 })
  })

  it('drops a mention whose text is edited by hand', async () => {
    const value: MentionValue = {
      text: '@Ada Lovelace',
      mentions: [{ trigger: '@', id: 'ada', label: 'Ada Lovelace', start: 0, end: 13 }],
    }
    const onValueChange = vi.fn()
    render(
      <MentionInput
        triggers={triggers}
        defaultValue={value}
        onValueChange={onValueChange}
        aria-label="Message"
      />,
    )
    await userEvent.type(box(), 'X', { initialSelectionStart: 0, initialSelectionEnd: 5 })
    expect(onValueChange.mock.lastCall?.[0].mentions).toEqual([])
  })

  it('closes on Escape and stays closed for that trigger', async () => {
    render(<MentionInput triggers={triggers} aria-label="Message" />)
    await userEvent.type(box(), '@')
    await screen.findByRole('listbox')
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).toBeNull()
    await userEvent.type(box(), 'a')
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('only opens at the start of a word', async () => {
    render(<MentionInput triggers={triggers} aria-label="Message" />)
    await userEvent.type(box(), 'mail me at me@ex')
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('serializes mentions for storage and fills hidden inputs', () => {
    const value: MentionValue = {
      text: 'Ping @Ada Lovelace in #general',
      mentions: [
        { trigger: '@', id: 'ada', label: 'Ada Lovelace', start: 5, end: 18 },
        { trigger: '#', id: 'general', label: 'general', start: 22, end: 30 },
      ],
    }
    expect(serializeMentions(value, (m) => `<${m.trigger}${m.id}>`)).toBe(
      'Ping <@ada> in <#general>',
    )
    const { container } = render(
      <MentionInput triggers={triggers} value={value} name="body" aria-label="Message" />,
    )
    expect(container.querySelector<HTMLInputElement>('input[name="body"]')?.value).toBe(value.text)
    expect(
      JSON.parse(
        container.querySelector<HTMLInputElement>('input[name="body.mentions"]')?.value ?? '',
      ),
    ).toHaveLength(2)
    expect(container.querySelectorAll('[data-slot="mention-input-token"]')).toHaveLength(2)
  })
})
