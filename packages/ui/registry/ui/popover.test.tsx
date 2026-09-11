import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

function Example() {
  return (
    <Popover>
      <PopoverTrigger>Open</PopoverTrigger>
      <PopoverContent>
        <button type="button">Inside</button>
      </PopoverContent>
    </Popover>
  )
}

describe('Popover', () => {
  it('stays closed until the trigger is used', async () => {
    render(<Example />)
    expect(screen.queryByText('Inside')).toBeNull()

    await userEvent.click(screen.getByText('Open'))
    expect(await screen.findByText('Inside')).toBeTruthy()
  })

  // The trigger says whether the thing it controls is showing, which is all a screen reader has
  // to go on: the content lives in a portal, nowhere near it in the tree.
  it('tells assistive tech whether it is open', async () => {
    render(<Example />)
    const trigger = screen.getByText('Open')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')

    await userEvent.click(trigger)
    await screen.findByText('Inside')
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
  })

  it('opens from the keyboard alone', async () => {
    render(<Example />)
    await userEvent.tab()
    expect(document.activeElement).toBe(screen.getByText('Open'))

    await userEvent.keyboard('{Enter}')
    expect(await screen.findByText('Inside')).toBeTruthy()
  })

  // Escape has to both close it and hand focus back, or a keyboard user is dropped at the top of
  // the document with no way back to where they were.
  it('closes on escape and returns focus to the trigger', async () => {
    render(<Example />)
    const trigger = screen.getByText('Open')
    await userEvent.click(trigger)
    await screen.findByText('Inside')

    await userEvent.keyboard('{Escape}')
    expect(screen.queryByText('Inside')).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })
})
