import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible'

function Example(props: React.ComponentProps<typeof Collapsible>) {
  return (
    <Collapsible {...props}>
      <CollapsibleTrigger>Notifications</CollapsibleTrigger>
      <CollapsibleContent>Email me about new comments</CollapsibleContent>
    </Collapsible>
  )
}

const content = () =>
  screen
    .getByText('Email me about new comments')
    .closest('[data-slot=collapsible-content]') as HTMLElement

describe('Collapsible', () => {
  // The point of this component: closed content is still in the page, so search engines index
  // it and the browser's find in page can reach it, instead of being unmounted.
  it('keeps closed content in the page, hidden until found', () => {
    render(<Example />)
    expect(content().getAttribute('hidden')).toBe('until-found')
    expect(content().getAttribute('data-state')).toBe('closed')
  })

  it('opens and closes from the trigger, telling assistive tech', async () => {
    const onOpenChange = vi.fn()
    render(<Example onOpenChange={onOpenChange} />)
    const trigger = screen.getByRole('button', { name: 'Notifications' })
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(trigger.getAttribute('aria-controls')).toBe(content().id)

    await userEvent.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(content().hasAttribute('hidden')).toBe(false)
    expect(onOpenChange).toHaveBeenLastCalledWith(true)

    await userEvent.click(trigger)
    expect(content().getAttribute('hidden')).toBe('until-found')
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
  })

  it('opens when find in page matches inside the closed content', () => {
    const onOpenChange = vi.fn()
    render(<Example onOpenChange={onOpenChange} />)
    act(() => {
      content().dispatchEvent(new Event('beforematch'))
    })
    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(content().hasAttribute('hidden')).toBe(false)
    expect(screen.getByRole('button').getAttribute('aria-expanded')).toBe('true')
  })

  it('goes through the owner when controlled', async () => {
    function Controlled() {
      const [open, setOpen] = React.useState(false)
      return (
        <>
          <span>{open ? 'shown' : 'not shown'}</span>
          <Example open={open} onOpenChange={setOpen} />
        </>
      )
    }
    render(<Controlled />)
    act(() => {
      content().dispatchEvent(new Event('beforematch'))
    })
    expect(screen.getByText('shown')).toBeTruthy()
    expect(content().hasAttribute('hidden')).toBe(false)

    await userEvent.click(screen.getByRole('button'))
    expect(screen.getByText('not shown')).toBeTruthy()
  })

  it('keeps disabled content plainly hidden and ignores the trigger', async () => {
    const onOpenChange = vi.fn()
    render(<Example disabled onOpenChange={onOpenChange} />)
    expect(content().getAttribute('hidden')).toBe('')

    await userEvent.click(screen.getByRole('button'))
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('starts open with defaultOpen', () => {
    render(<Example defaultOpen />)
    expect(content().hasAttribute('hidden')).toBe(false)
    expect(content().getAttribute('data-state')).toBe('open')
  })

  // React only writes `hidden` as a boolean, so the server sends a plain `hidden`; it becomes
  // `until-found` on hydration. What matters for search engines is that the text is there.
  it('sends closed content in the server HTML', () => {
    const html = renderToString(<Example />)
    expect(html).toContain('Email me about new comments')
    expect(html).toMatch(/data-slot="collapsible-content"[^>]*hidden=""/)
  })
})
