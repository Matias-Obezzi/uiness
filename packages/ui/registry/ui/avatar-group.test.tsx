import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { AvatarGroup } from './avatar-group'

const people = [
  'Ada Lovelace',
  'Grace Hopper',
  'Alan Turing',
  'Linus Torvalds',
  'Margaret Hamilton',
  'Ken Thompson',
].map((name) => ({ name }))

const avatars = () =>
  document.querySelectorAll(
    '[data-slot=avatar-group] > * [data-slot=avatar], [data-slot=avatar-group] > [data-slot=avatar]',
  )

describe('AvatarGroup', () => {
  it('shows up to max avatars and a counter for the rest', () => {
    render(<AvatarGroup items={people} max={3} />)
    expect(avatars()).toHaveLength(3)
    expect(screen.getByRole('button', { name: 'Show 3 more' }).textContent).toBe('+3')
    expect(
      screen.getByRole('group', { name: 'Ada Lovelace, Grace Hopper, Alan Turing and 3 more' }),
    ).toBeTruthy()
  })

  it('uses initials until a picture loads', () => {
    render(<AvatarGroup items={[{ name: 'Grace Hopper' }, { name: 'Ken', initials: 'KT' }]} />)
    expect(screen.getByText('GH')).toBeTruthy()
    expect(screen.getByText('KT')).toBeTruthy()
  })

  it('shows the last one instead of a +1 counter', () => {
    render(<AvatarGroup items={people.slice(0, 5)} max={4} />)
    expect(avatars()).toHaveLength(5)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('lists everyone else in a popover, and the count past what was loaded', async () => {
    render(<AvatarGroup items={people} max={4} total={40} />)
    const counter = screen.getByRole('button', { name: 'Show 36 more' })
    await userEvent.click(counter)
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Margaret Hamilton')).toBeTruthy()
    expect(within(dialog).getByText('Ken Thompson')).toBeTruthy()
    expect(within(dialog).getByText('and 34 more')).toBeTruthy()
  })
})
