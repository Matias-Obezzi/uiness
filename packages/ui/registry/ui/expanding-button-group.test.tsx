import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ExpandingButton, ExpandingButtonGroup } from './expanding-button-group'

const Icon = () => <svg data-testid="icon" />

function Example({ onReply }: { onReply?: () => void }) {
  return (
    <ExpandingButtonGroup aria-label="Message actions">
      <ExpandingButton icon={<Icon />} label="Reply" onClick={onReply} />
      <ExpandingButton icon={<Icon />} label="Forward" />
      <ExpandingButton icon={<Icon />} label="Archive" />
    </ExpandingButtonGroup>
  )
}

const expanded = () =>
  screen
    .getAllByRole('button')
    .filter((b) => b.hasAttribute('data-expanded'))
    .map((b) => b.textContent)

describe('ExpandingButtonGroup', () => {
  // The labels are collapsed, not removed, so every button keeps its name at rest.
  it('names every button by its label even while collapsed', () => {
    render(<Example />)
    expect(screen.getByRole('group', { name: 'Message actions' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Reply' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Archive' })).toBeTruthy()
    expect(expanded()).toEqual([])
  })

  it('opens the hovered button, one at a time', () => {
    render(<Example />)
    fireEvent.pointerEnter(screen.getByRole('button', { name: 'Reply' }), { pointerType: 'mouse' })
    expect(expanded()).toEqual(['Reply'])
    fireEvent.pointerEnter(screen.getByRole('button', { name: 'Forward' }), {
      pointerType: 'mouse',
    })
    expect(expanded()).toEqual(['Forward'])
    fireEvent.pointerLeave(screen.getByRole('group'))
    expect(expanded()).toEqual([])
  })

  it('opens the focused button and closes when focus leaves', async () => {
    render(
      <>
        <Example />
        <button type="button">After</button>
      </>,
    )
    await userEvent.tab()
    expect(expanded()).toEqual(['Reply'])
    await userEvent.tab()
    expect(expanded()).toEqual(['Forward'])
    await userEvent.tab()
    await userEvent.tab()
    expect(document.activeElement?.textContent).toBe('After')
    expect(expanded()).toEqual([])
  })

  it('keeps a button open with expanded', () => {
    render(
      <ExpandingButtonGroup>
        <ExpandingButton icon={<Icon />} label="Copied" expanded />
      </ExpandingButtonGroup>,
    )
    expect(expanded()).toEqual(['Copied'])
  })

  it('hides the icon from screen readers and passes clicks through', async () => {
    const onReply = vi.fn()
    render(<Example onReply={onReply} />)
    expect(screen.getAllByTestId('icon')[0]?.parentElement?.getAttribute('aria-hidden')).toBe(
      'true',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Reply' }))
    expect(onReply).toHaveBeenCalledOnce()
  })
})
