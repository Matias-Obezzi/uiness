import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FormControl, FormField, FormLabel } from './form'
import { InlineEdit } from './inline-edit'

const text = () => document.querySelector('[data-slot=inline-edit-text]') as HTMLElement
const input = () => screen.queryByRole('textbox') as HTMLInputElement | null

describe('InlineEdit', () => {
  it('reads the name and the value, and opens a field on click', async () => {
    render(<InlineEdit aria-label="Project name" defaultValue="Acme" />)
    const button = screen.getByRole('button', { name: 'Project name Acme' })
    await userEvent.click(button)
    expect(input()?.value).toBe('Acme')
    expect(document.activeElement).toBe(input())
    expect(input()?.selectionStart).toBe(0)
    expect(input()?.selectionEnd).toBe(4)
  })

  it('saves with Enter and hands focus back to the text', async () => {
    const onSave = vi.fn()
    render(<InlineEdit aria-label="Name" defaultValue="Acme" onSave={onSave} />)
    await userEvent.click(text())
    await userEvent.keyboard('Globex{Enter}')
    expect(onSave).toHaveBeenCalledWith('Globex')
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(input()).toBeNull()
    expect(text().textContent).toBe('Globex')
    expect(document.activeElement).toBe(text())
  })

  it('puts the old text back with Escape', async () => {
    const onSave = vi.fn()
    const onCancel = vi.fn()
    render(<InlineEdit aria-label="Name" defaultValue="Acme" onSave={onSave} onCancel={onCancel} />)
    await userEvent.click(text())
    await userEvent.keyboard('Nope{Escape}')
    expect(text().textContent).toBe('Acme')
    expect(onSave).not.toHaveBeenCalled()
    expect(onCancel).toHaveBeenCalled()
  })

  it('saves when it loses focus', async () => {
    const onSave = vi.fn()
    render(
      <>
        <InlineEdit aria-label="Name" defaultValue="Acme" onSave={onSave} />
        <button type="button">Other</button>
      </>,
    )
    await userEvent.click(text())
    await userEvent.keyboard('Initech')
    await userEvent.click(screen.getByText('Other'))
    expect(onSave).toHaveBeenCalledWith('Initech')
    expect(text().textContent).toBe('Initech')
  })

  it('refuses a draft that fails validation and says why', async () => {
    const onSave = vi.fn()
    render(
      <InlineEdit
        aria-label="Name"
        defaultValue="Acme"
        onSave={onSave}
        validate={(v) => (v.trim() ? null : 'A name is required.')}
      />,
    )
    await userEvent.click(text())
    await userEvent.clear(input() as HTMLInputElement)
    await userEvent.keyboard('{Enter}')
    const message = screen.getByText('A name is required.')
    expect(onSave).not.toHaveBeenCalled()
    expect(input()?.getAttribute('aria-invalid')).toBe('true')
    expect(input()?.getAttribute('aria-describedby')).toContain(message.id)
  })

  it('waits on an async save, then shows the new text', async () => {
    let resolve: () => void = () => {}
    const onSave = vi.fn(() => new Promise<void>((r) => (resolve = r)))
    render(<InlineEdit aria-label="Name" defaultValue="Acme" onSave={onSave} />)
    await userEvent.click(text())
    await userEvent.keyboard('Umbrella{Enter}')
    expect(input()?.getAttribute('aria-busy')).toBe('true')
    expect(input()?.readOnly).toBe(true)
    await act(async () => resolve())
    expect(input()).toBeNull()
    expect(text().textContent).toBe('Umbrella')
  })

  it('keeps the field open with the message when an async save fails', async () => {
    const onSave = vi.fn(() => Promise.reject(new Error('Name taken.')))
    render(<InlineEdit aria-label="Name" defaultValue="Acme" onSave={onSave} />)
    await userEvent.click(text())
    await userEvent.keyboard('Taken{Enter}')
    expect(await screen.findByText('Name taken.')).toBeTruthy()
    expect(input()?.value).toBe('Taken')
  })

  it('takes its name from a form field', async () => {
    render(
      <FormField name="title">
        <FormLabel>Title</FormLabel>
        <FormControl>
          <InlineEdit defaultValue="Draft" />
        </FormControl>
      </FormField>,
    )
    expect(screen.getByRole('button', { name: 'Title Draft' })).toBeTruthy()
    await userEvent.click(text())
    expect(screen.getByLabelText('Title')).toBe(input())
  })
})
