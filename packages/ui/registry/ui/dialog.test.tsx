import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog'

const classes = (el: Element | null) => (el?.getAttribute('class') ?? '').split(' ')
const slot = (name: string) => document.querySelector(`[data-slot=${name}]`)

// jsdom has no layout, so these check the classes that do the work: a panel no taller than the
// screen, a header and footer that do not shrink, and a body that does and scrolls.
describe('Dialog', () => {
  it('keeps the panel within the screen, scrolling it whole when there is no body', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terms</DialogTitle>
            <DialogDescription>Read them all.</DialogDescription>
          </DialogHeader>
          <p>Long text</p>
          <DialogFooter>
            <button type="button">Accept</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    )
    const content = screen.getByRole('dialog', { name: 'Terms' })
    expect(content.dataset.slot).toBe('dialog-content')
    expect(classes(content)).toEqual(
      expect.arrayContaining(['flex', 'flex-col', 'max-h-[calc(100dvh-2rem)]', 'overflow-y-auto']),
    )
    expect(classes(content)).not.toContain('grid')
    expect(classes(slot('dialog-header'))).toContain('shrink-0')
    expect(classes(slot('dialog-footer'))).toContain('shrink-0')
    expect(slot('dialog-body')).toBeNull()
    // The close button is still there, after the children.
    expect(content.lastElementChild?.getAttribute('data-slot')).toBe('dialog-close')
  })

  it('scrolls only the body between a fixed header and footer', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terms</DialogTitle>
          </DialogHeader>
          <DialogBody data-testid="body">
            <p>Long text</p>
          </DialogBody>
          <DialogFooter>
            <button type="button">Accept</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    )
    const body = screen.getByTestId('body')
    expect(body.dataset.slot).toBe('dialog-body')
    expect(classes(body)).toEqual(expect.arrayContaining(['min-h-0', 'flex-1', 'overflow-y-auto']))
    const content = screen.getByRole('dialog')
    expect([...content.children].map((el) => el.getAttribute('data-slot'))).toEqual([
      'dialog-header',
      'dialog-body',
      'dialog-footer',
      'dialog-close',
    ])
  })

  it('puts contentClassName on the body, and lets the body’s own class win', () => {
    render(
      <Dialog open>
        <DialogContent className="sm:max-w-2xl" contentClassName="bg-muted px-8 py-2">
          <DialogTitle>Terms</DialogTitle>
          <DialogBody className="py-4">Long text</DialogBody>
        </DialogContent>
      </Dialog>,
    )
    const content = screen.getByRole('dialog')
    expect(classes(content)).toContain('sm:max-w-2xl')
    expect(classes(content)).not.toContain('bg-muted')
    const body = slot('dialog-body')
    expect(classes(body)).toEqual(expect.arrayContaining(['bg-muted', 'px-8', 'py-4']))
    expect(classes(body)).not.toContain('px-6')
    expect(classes(body)).not.toContain('py-2')
  })

  it('renders a body outside DialogContent without its class', () => {
    render(<DialogBody data-testid="loose">Text</DialogBody>)
    expect(classes(screen.getByTestId('loose'))).toContain('overflow-y-auto')
  })
})
