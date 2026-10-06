import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Compare } from './compare'

const root = () => document.querySelector('[data-slot="compare"]') as HTMLElement

describe('Compare', () => {
  it('moves the divider in bigger steps with Page Up and Page Down', () => {
    render(<Compare before={<div>b</div>} after={<div>a</div>} initial={50} />)
    const handle = screen.getByRole('slider')
    fireEvent.keyDown(handle, { key: 'PageUp' })
    expect(handle.getAttribute('aria-valuenow')).toBe('60')
    fireEvent.keyDown(handle, { key: 'PageDown' })
    fireEvent.keyDown(handle, { key: 'PageDown' })
    expect(handle.getAttribute('aria-valuenow')).toBe('40')
  })

  it('stops at the edges on Page Up', () => {
    render(<Compare before={<div>b</div>} after={<div>a</div>} initial={95} />)
    const handle = screen.getByRole('slider')
    fireEvent.keyDown(handle, { key: 'PageUp' })
    expect(handle.getAttribute('aria-valuenow')).toBe('100')
  })

  it('reads out the text it is given for the position', () => {
    render(
      <Compare
        before={<div>b</div>}
        after={<div>a</div>}
        initial={30}
        getValueText={(value) => `${Math.round(value)}% edited`}
      />,
    )
    const handle = screen.getByRole('slider')
    expect(handle.getAttribute('aria-valuetext')).toBe('30% edited')
    fireEvent.keyDown(handle, { key: 'ArrowRight' })
    expect(handle.getAttribute('aria-valuetext')).toBe('32% edited')
  })

  it('reads the number alone without getValueText', () => {
    render(<Compare before={<div>b</div>} after={<div>a</div>} />)
    expect(screen.getByRole('slider').hasAttribute('aria-valuetext')).toBe(false)
  })

  it('draws no box for an empty label', () => {
    render(<Compare before={<div>b</div>} after={<div>a</div>} labels={['', 'After']} />)
    const boxes = document.querySelectorAll('[data-slot="compare-label"]')
    expect(boxes.length).toBe(1)
    expect(boxes[0]?.textContent).toBe('After')
  })

  // touch-none would hold the page still under a finger on a photo as wide as the phone.
  it('lets the page scroll vertically over it while it drags sideways', () => {
    render(<Compare before={<div>b</div>} after={<div>a</div>} />)
    expect(root().className).toContain('touch-pan-y')
    expect(root().className).not.toContain('touch-none')
  })

  it('draws the divider and its labels in theme colors', () => {
    render(<Compare before={<div>b</div>} after={<div>a</div>} labels={['Before', 'After']} />)
    const html = root().outerHTML
    expect(html).not.toMatch(/bg-white|bg-black|text-white|text-black/)
    expect(screen.getByRole('slider').className).toContain('bg-background')
  })
})

describe('Compare on touch', () => {
  const rect = (el: Element) =>
    Object.defineProperty(el, 'getBoundingClientRect', {
      value: () => ({ left: 0, top: 0, width: 200, height: 100, right: 200, bottom: 100 }),
      configurable: true,
    })

  // The page scrolling under the finger ends in pointercancel; the divider must not have moved.
  it('leaves the divider alone when a touch turns into a page scroll', () => {
    render(<Compare before={<div>b</div>} after={<div>a</div>} />)
    rect(root())
    fireEvent.pointerDown(root(), { button: 0, pointerId: 1, pointerType: 'touch', clientX: 20 })
    fireEvent.pointerCancel(root(), { pointerId: 1, pointerType: 'touch' })
    expect(screen.getByRole('slider').getAttribute('aria-valuenow')).toBe('50')
  })

  it('follows a sideways drag, and a tap puts it where it lands', () => {
    render(<Compare before={<div>b</div>} after={<div>a</div>} />)
    rect(root())
    fireEvent.pointerDown(root(), { button: 0, pointerId: 1, pointerType: 'touch', clientX: 100 })
    fireEvent.pointerMove(root(), { pointerId: 1, pointerType: 'touch', clientX: 150 })
    expect(screen.getByRole('slider').getAttribute('aria-valuenow')).toBe('75')
    fireEvent.pointerUp(root(), { pointerId: 1, pointerType: 'touch', clientX: 150 })

    fireEvent.pointerDown(root(), { button: 0, pointerId: 2, pointerType: 'touch', clientX: 40 })
    fireEvent.pointerUp(root(), { pointerId: 2, pointerType: 'touch', clientX: 40 })
    expect(screen.getByRole('slider').getAttribute('aria-valuenow')).toBe('20')
  })
})
