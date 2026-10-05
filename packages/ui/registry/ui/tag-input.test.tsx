import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FormControl, FormField, FormLabel } from './form'
import { TagInput } from './tag-input'

const field = () => screen.getByRole('textbox') as HTMLInputElement
const tags = () =>
  Array.from(document.querySelectorAll('[data-slot=tag-input-tag]')).map((t) => t.textContent)

describe('TagInput', () => {
  it('adds a tag on Enter and on a comma', async () => {
    const onValueChange = vi.fn()
    render(<TagInput aria-label="Tags" onValueChange={onValueChange} />)
    await userEvent.type(field(), 'react{Enter}vue,')
    expect(tags()).toEqual(['react', 'vue'])
    expect(field().value).toBe('')
    expect(onValueChange).toHaveBeenLastCalledWith(['react', 'vue'])
  })

  it('splits a pasted list', async () => {
    render(<TagInput aria-label="Tags" />)
    await userEvent.click(field())
    await userEvent.paste('one, two\nthree')
    expect(tags()).toEqual(['one', 'two', 'three'])
  })

  it('removes the last tag with Backspace in an empty field', async () => {
    render(<TagInput aria-label="Tags" defaultValue={['a', 'b']} />)
    await userEvent.click(field())
    await userEvent.keyboard('{Backspace}')
    expect(tags()).toEqual(['a'])
  })

  it('walks the tags with the arrow keys and removes the focused one', async () => {
    render(<TagInput aria-label="Tags" defaultValue={['a', 'b', 'c']} />)
    await userEvent.click(field())
    await userEvent.keyboard('{ArrowLeft}')
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Remove c' }))
    await userEvent.keyboard('{ArrowLeft}')
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Remove b' }))
    await userEvent.keyboard('{Backspace}')
    expect(tags()).toEqual(['a', 'c'])
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Remove a' }))
    await userEvent.keyboard('{ArrowRight}{ArrowRight}')
    expect(document.activeElement).toBe(field())
  })

  it('turns away duplicates, ignoring case, and keeps the text', async () => {
    const onReject = vi.fn()
    render(<TagInput aria-label="Tags" defaultValue={['React']} onReject={onReject} />)
    await userEvent.type(field(), 'react{Enter}')
    expect(tags()).toEqual(['React'])
    expect(field().value).toBe('react')
    expect(onReject).toHaveBeenCalledWith('react', 'duplicate', expect.any(String))
  })

  it('stops at the maximum', async () => {
    const onReject = vi.fn()
    render(<TagInput aria-label="Tags" max={2} onReject={onReject} />)
    await userEvent.type(field(), 'a{Enter}b{Enter}c{Enter}')
    expect(tags()).toEqual(['a', 'b'])
    expect(onReject).toHaveBeenCalledWith('c', 'max', expect.any(String))
  })

  it('shows the message from validate and links it to the field', async () => {
    render(
      <TagInput
        aria-label="Emails"
        validate={(tag) => (tag.includes('@') ? true : 'Not an email address.')}
      />,
    )
    await userEvent.type(field(), 'nope{Enter}')
    const message = screen.getByText('Not an email address.')
    expect(field().getAttribute('aria-invalid')).toBe('true')
    expect(field().getAttribute('aria-describedby')).toContain(message.id)
    await userEvent.type(field(), 'x')
    expect(screen.queryByText('Not an email address.')).toBeNull()
  })

  it('adds what is left when it loses focus', async () => {
    render(<TagInput aria-label="Tags" />)
    await userEvent.type(field(), 'pending')
    fireEvent.blur(field())
    expect(tags()).toEqual(['pending'])
  })

  it('lets Enter in an empty field submit the form', async () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault())
    render(
      <form onSubmit={onSubmit}>
        <TagInput aria-label="Tags" name="tags" defaultValue={['x', 'y']} />
        <button type="submit">Save</button>
      </form>,
    )
    await userEvent.click(field())
    await userEvent.keyboard('{Enter}')
    expect(onSubmit).toHaveBeenCalled()
    const form = document.querySelector('form') as HTMLFormElement
    expect(new FormData(form).getAll('tags')).toEqual(['x', 'y'])
  })

  it('takes its label from a form field', () => {
    render(
      <FormField name="labels">
        <FormLabel>Labels</FormLabel>
        <FormControl>
          <TagInput />
        </FormControl>
      </FormField>,
    )
    expect(screen.getByLabelText('Labels')).toBe(field())
  })
})
