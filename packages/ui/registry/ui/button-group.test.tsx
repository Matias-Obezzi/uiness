import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ButtonGroup, ButtonGroupItem } from './button-group'

function Example({ orientation }: { orientation?: 'horizontal' | 'vertical' }) {
  return (
    <ButtonGroup aria-label="Range" orientation={orientation}>
      <ButtonGroupItem aria-pressed>Day</ButtonGroupItem>
      <ButtonGroupItem>Week</ButtonGroupItem>
      <ButtonGroupItem asChild>
        <a href="#month">Month</a>
      </ButtonGroupItem>
    </ButtonGroup>
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

const highlight = () =>
  document.querySelector<HTMLElement>('[data-slot=button-group-highlight]') as HTMLElement

describe('ButtonGroup', () => {
  it('is a named group of buttons', () => {
    render(<Example />)
    const group = screen.getByRole('group', { name: 'Range' })
    expect(group.dataset.orientation).toBe('horizontal')
    expect(screen.getByRole('button', { name: 'Week' }).getAttribute('type')).toBe('button')
  })

  it('renders links through asChild, keeping them links', () => {
    render(<Example />)
    const link = screen.getByRole('link', { name: 'Month' })
    expect(link.dataset.slot).toBe('button-group-item')
    expect(link.hasAttribute('type')).toBe(false)
  })

  it('moves the highlight to the hovered button and hides it on leave', () => {
    render(<Example />)
    const week = screen.getByRole('button', { name: 'Week' })
    fireEvent.pointerEnter(week, { pointerType: 'mouse' })
    expect(highlight().style.opacity).toBe('1')
    expect(week.hasAttribute('data-highlighted')).toBe(true)

    fireEvent.pointerEnter(screen.getByRole('button', { name: 'Day' }), { pointerType: 'mouse' })
    expect(week.hasAttribute('data-highlighted')).toBe(false)

    fireEvent.pointerLeave(screen.getByRole('group'))
    expect(highlight().style.opacity).toBe('0')
  })

  it('follows keyboard focus', async () => {
    // jsdom does not track the keyboard heuristic behind :focus-visible.
    const matches = Element.prototype.matches
    vi.spyOn(Element.prototype, 'matches').mockImplementation(function (this: Element, q: string) {
      return q === ':focus-visible' ? this === document.activeElement : matches.call(this, q)
    })
    render(<Example />)
    await userEvent.tab()
    await userEvent.tab()
    const week = screen.getByRole('button', { name: 'Week' })
    expect(document.activeElement).toBe(week)
    expect(week.hasAttribute('data-highlighted')).toBe(true)
    await userEvent.tab()
    expect(screen.getByRole('link', { name: 'Month' }).hasAttribute('data-highlighted')).toBe(true)
  })

  it('stacks in a column when vertical', () => {
    render(<Example orientation="vertical" />)
    const group = screen.getByRole('group')
    expect(group.dataset.orientation).toBe('vertical')
    expect(group.className).toContain('flex-col')
  })

  it('passes clicks through', async () => {
    const onClick = vi.fn()
    render(
      <ButtonGroup>
        <ButtonGroupItem onClick={onClick}>Go</ButtonGroupItem>
      </ButtonGroup>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Go' }))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
