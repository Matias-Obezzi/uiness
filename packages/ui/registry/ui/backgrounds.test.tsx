import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Aurora } from './aurora'
import { Sparkles } from './sparkles'
import { TracingBeam } from './tracing-beam'

describe('Aurora', () => {
  // A background layer, not a wrapper: it is placed beside the content it sits behind, it takes
  // no pointer events, and it is hidden from screen readers because it says nothing.
  it('is decoration that never intercepts the page', () => {
    const { container } = render(<Aurora />)
    const root = container.querySelector('[data-slot="aurora"]') as HTMLElement | null
    expect(root?.getAttribute('aria-hidden')).toBe('true')
    expect(root?.className).toContain('pointer-events-none')
  })

  it('takes the drift duration as a custom property rather than a hardcoded animation', () => {
    const { container } = render(<Aurora duration={30} />)
    const root = container.querySelector('[data-slot="aurora"]') as HTMLElement | null
    expect(root).toBeTruthy()
    expect(root?.outerHTML).toContain('30')
  })
})

describe('Sparkles', () => {
  // jsdom hands back no 2D context, which is the same thing an old browser or a blocked canvas
  // does. Drawing is decoration: failing to get a context must not take the page down with it.
  it('survives having no canvas context at all', () => {
    expect(() => render(<Sparkles />)).not.toThrow()
    const canvas = document.querySelector('canvas')
    expect(canvas).toBeTruthy()
  })

  it('keeps the canvas out of the accessibility tree', () => {
    render(<Sparkles />)
    const canvas = document.querySelector('canvas')
    expect(canvas?.getAttribute('aria-hidden')).toBe('true')
  })
})

describe('TracingBeam', () => {
  it('renders the content it traces', () => {
    render(
      <TracingBeam>
        <p>A long article</p>
      </TracingBeam>,
    )
    expect(screen.getByText('A long article')).toBeTruthy()
  })

  it('draws the line as decoration, not as something to read', () => {
    const { container } = render(
      <TracingBeam>
        <p>A long article</p>
      </TracingBeam>,
    )
    // The beam is a plain element, not an image: hidden from assistive tech, while the article
    // it runs alongside stays readable.
    const hidden = container.querySelector('[aria-hidden="true"]')
    expect(hidden).toBeTruthy()
    expect(screen.getByText('A long article')).toBeTruthy()
  })
})
