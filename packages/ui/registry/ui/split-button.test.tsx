import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DropdownMenuItem } from './dropdown-menu'
import { SplitButton, SplitButtonAction, SplitButtonMenu } from './split-button'

function Example(props: { onSave?: () => void; onDraft?: () => void; disabled?: boolean }) {
  return (
    <SplitButton aria-label="Save" variant="outline" size="sm" disabled={props.disabled}>
      <SplitButtonAction onClick={props.onSave}>Save</SplitButtonAction>
      <SplitButtonMenu label="More save options">
        <DropdownMenuItem onSelect={props.onDraft}>Save as draft</DropdownMenuItem>
        <DropdownMenuItem>Save and close</DropdownMenuItem>
      </SplitButtonMenu>
    </SplitButton>
  )
}

describe('SplitButton', () => {
  it('runs the main action on its own', async () => {
    const onSave = vi.fn()
    render(<Example onSave={onSave} />)
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledOnce()
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('names the chevron and says it opens a menu', () => {
    render(<Example />)
    const trigger = screen.getByRole('button', { name: 'More save options' })
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  it('opens the menu from the keyboard and runs the picked item', async () => {
    const onDraft = vi.fn()
    render(<Example onDraft={onDraft} />)
    await userEvent.tab()
    await userEvent.tab()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'More save options' }))
    await userEvent.keyboard('{Enter}')
    const item = await screen.findByRole('menuitem', { name: 'Save as draft' })
    await userEvent.click(item)
    expect(onDraft).toHaveBeenCalledOnce()
  })

  it('passes the variant and size to both halves', () => {
    render(<Example />)
    const action = screen.getByRole('button', { name: 'Save' })
    const trigger = screen.getByRole('button', { name: 'More save options' })
    expect(action.className).toContain('border')
    expect(action.className).toContain('h-8')
    expect(trigger.className).toContain('h-8')
    expect(trigger.className).toContain('rounded-l-none')
  })

  it('disables both halves together', () => {
    render(<Example disabled />)
    expect((screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(true)
    expect(
      (screen.getByRole('button', { name: 'More save options' }) as HTMLButtonElement).disabled,
    ).toBe(true)
  })
})
