import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { SegmentedControl, SegmentedControlItem } from './segmented-control'

function Example(props: React.ComponentProps<typeof SegmentedControl>) {
  return (
    <SegmentedControl aria-label="View" {...props}>
      <SegmentedControlItem value="list">List</SegmentedControlItem>
      <SegmentedControlItem value="board">Board</SegmentedControlItem>
      <SegmentedControlItem value="calendar">Calendar</SegmentedControlItem>
    </SegmentedControl>
  )
}

const checked = () =>
  screen
    .getAllByRole('radio')
    .filter((r) => r.getAttribute('aria-checked') === 'true')
    .map((r) => r.textContent)

describe('SegmentedControl', () => {
  it('is a named radio group with the default selected', () => {
    render(<Example defaultValue="board" />)
    expect(screen.getByRole('radiogroup', { name: 'View' })).toBeTruthy()
    expect(checked()).toEqual(['Board'])
  })

  it('selects on click and reports the value', async () => {
    const onValueChange = vi.fn()
    render(<Example defaultValue="list" onValueChange={onValueChange} />)
    await userEvent.click(screen.getByRole('radio', { name: 'Calendar' }))
    expect(checked()).toEqual(['Calendar'])
    expect(onValueChange).toHaveBeenCalledWith('calendar')
  })

  it('moves with the arrow keys and selects with Space', async () => {
    render(<Example defaultValue="list" />)
    await userEvent.tab()
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'List' }))
    // The arrows walk the group; a browser also selects as it goes, jsdom does not.
    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'Board' }))
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'Calendar' }))
    await userEvent.keyboard(' ')
    expect(checked()).toEqual(['Calendar'])
  })

  it('follows a controlled value', async () => {
    function Controlled() {
      const [value, setValue] = React.useState('list')
      return (
        <>
          <Example value={value} onValueChange={setValue} />
          <output>{value}</output>
        </>
      )
    }
    render(<Controlled />)
    await userEvent.click(screen.getByRole('radio', { name: 'Board' }))
    expect(screen.getByRole('status').textContent).toBe('board')
    expect(checked()).toEqual(['Board'])
  })

  it('stays put when controlled and the parent says no', async () => {
    render(<Example value="list" onValueChange={() => {}} />)
    await userEvent.click(screen.getByRole('radio', { name: 'Board' }))
    expect(checked()).toEqual(['List'])
  })

  it('places the thumb once measured, and hides it with nothing selected', () => {
    render(<Example defaultValue="list" />)
    const group = screen.getByRole('radiogroup')
    const thumb = group.querySelector<HTMLElement>('[data-slot=segmented-control-thumb]')
    expect(group.dataset.ready).toBe('true')
    expect(thumb?.style.opacity).toBe('1')
    render(<Example />)
    const empty = screen.getAllByRole('radiogroup')[1]
    expect(
      empty?.querySelector<HTMLElement>('[data-slot=segmented-control-thumb]')?.style.opacity,
    ).toBe('0')
  })

  it('stretches with fullWidth', () => {
    render(<Example defaultValue="list" fullWidth />)
    expect(screen.getByRole('radiogroup').className).toContain('w-full')
    expect(screen.getByRole('radio', { name: 'List' }).className).toContain('flex-1')
  })
})
