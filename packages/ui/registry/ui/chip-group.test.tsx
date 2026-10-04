import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ChipGroup, ChipGroupItem } from './chip-group'
import { FormControl, FormField, FormLabel } from './form'

function Filters(props: Partial<React.ComponentProps<typeof ChipGroup>>) {
  return (
    <ChipGroup type="multiple" aria-label="Filters" {...(props as object)}>
      <ChipGroupItem value="open">Open</ChipGroupItem>
      <ChipGroupItem value="draft">Draft</ChipGroupItem>
      <ChipGroupItem value="closed" disabled>
        Closed
      </ChipGroupItem>
    </ChipGroup>
  )
}

describe('ChipGroup', () => {
  it('presses several chips in multiple mode', async () => {
    const onValueChange = vi.fn()
    render(<Filters onValueChange={onValueChange} />)
    const open = screen.getByRole('button', { name: 'Open' })
    expect(screen.getByRole('group', { name: 'Filters' })).toBeTruthy()
    await userEvent.click(open)
    await userEvent.click(screen.getByRole('button', { name: 'Draft' }))
    expect(onValueChange).toHaveBeenLastCalledWith(['open', 'draft'])
    expect(open.getAttribute('aria-pressed')).toBe('true')
    expect(open.getAttribute('data-state')).toBe('on')
  })

  it('keeps one chip at a time in single mode, as radios', async () => {
    const onValueChange = vi.fn()
    render(
      <ChipGroup type="single" aria-label="Sort" defaultValue="new" onValueChange={onValueChange}>
        <ChipGroupItem value="new">Newest</ChipGroupItem>
        <ChipGroupItem value="top">Top</ChipGroupItem>
      </ChipGroup>,
    )
    expect(screen.getByRole('radiogroup', { name: 'Sort' })).toBeTruthy()
    expect(screen.getByRole('radio', { name: 'Newest' }).getAttribute('aria-checked')).toBe('true')
    await userEvent.click(screen.getByRole('radio', { name: 'Top' }))
    expect(onValueChange).toHaveBeenLastCalledWith('top')
    expect(screen.getByRole('radio', { name: 'Newest' }).getAttribute('aria-checked')).toBe('false')
  })

  it('moves with the arrow keys, skips disabled chips and toggles with Space', async () => {
    render(<Filters />)
    await userEvent.tab()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Open' }))
    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Draft' }))
    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Open' }))
    await userEvent.keyboard(' ')
    expect(screen.getByRole('button', { name: 'Open' }).getAttribute('aria-pressed')).toBe('true')
  })

  it('follows a controlled value', () => {
    const { rerender } = render(<Filters value={['open']} />)
    expect(screen.getByRole('button', { name: 'Open' }).getAttribute('aria-pressed')).toBe('true')
    rerender(<Filters value={['draft']} />)
    expect(screen.getByRole('button', { name: 'Open' }).getAttribute('aria-pressed')).toBe('false')
    expect(screen.getByRole('button', { name: 'Draft' }).getAttribute('aria-pressed')).toBe('true')
  })

  it('posts the picked chips with a form and takes a form label', () => {
    render(
      <form>
        <FormField name="status">
          <FormLabel>Status</FormLabel>
          <FormControl>
            <ChipGroup type="multiple" name="status" defaultValue={['open', 'draft']}>
              <ChipGroupItem value="open">Open</ChipGroupItem>
              <ChipGroupItem value="draft">Draft</ChipGroupItem>
            </ChipGroup>
          </FormControl>
        </FormField>
      </form>,
    )
    const form = document.querySelector('form') as HTMLFormElement
    expect(new FormData(form).getAll('status')).toEqual(['open', 'draft'])
    expect(screen.getByRole('group', { name: 'Status' })).toBeTruthy()
  })
})
