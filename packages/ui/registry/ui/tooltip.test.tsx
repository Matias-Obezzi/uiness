import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'

function Example() {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger>Save</TooltipTrigger>
        <TooltipContent>Saves your work</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

describe('Tooltip', () => {
  it('stays hidden until something asks for it', () => {
    render(<Example />)
    expect(screen.queryByText('Saves your work')).toBeNull()
  })

  // Focus, not just hover: a tooltip that only answers the mouse is invisible to anyone moving
  // through the page with Tab, which is the audience most likely to need the label.
  it('opens on focus, not only on hover', async () => {
    render(<Example />)
    await userEvent.tab()
    expect(document.activeElement).toBe(screen.getByText('Save'))
    expect(await screen.findByRole('tooltip')).toBeTruthy()
  })

  it('opens on hover too', async () => {
    render(<Example />)
    await userEvent.hover(screen.getByText('Save'))
    expect(await screen.findByRole('tooltip')).toBeTruthy()
  })

  it('names the trigger through the tooltip it owns', async () => {
    render(<Example />)
    await userEvent.tab()
    await screen.findByRole('tooltip')
    expect(screen.getAllByText('Saves your work').length).toBeGreaterThan(0)
  })

  it('closes on escape while the trigger still has focus', async () => {
    render(<Example />)
    await userEvent.tab()
    await screen.findByRole('tooltip')

    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('tooltip')).toBeNull()
  })
})
