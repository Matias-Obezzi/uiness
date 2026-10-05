import { fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ScrollFade } from './scroll-fade'

beforeEach(() => {
  // Run each scheduled frame at once, so a scroll event updates the fades synchronously. The
  // id 0 tells the component no frame is pending any more.
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0)
    return 0
  })
  vi.stubGlobal('cancelAnimationFrame', () => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
})

/** jsdom lays nothing out: give the scroller its sizes by hand. */
function size(
  el: HTMLElement,
  box: { scrollHeight?: number; clientHeight?: number; scrollWidth?: number; clientWidth?: number },
) {
  for (const [key, value] of Object.entries(box)) {
    Object.defineProperty(el, key, { configurable: true, value })
  }
}

/** jsdom keeps scroll positions at 0, so set them the same way, then announce the scroll. */
const scrollTo = (el: HTMLElement, at: { top?: number; left?: number }) => {
  if (at.top !== undefined)
    Object.defineProperty(el, 'scrollTop', { configurable: true, value: at.top })
  if (at.left !== undefined)
    Object.defineProperty(el, 'scrollLeft', { configurable: true, value: at.left })
  fireEvent.scroll(el)
}

const fade = (el: HTMLElement, edge: string) => el.style.getPropertyValue(`--scroll-fade-${edge}`)

describe('ScrollFade', () => {
  it('renders a vertical scroller with a mask', () => {
    const { container } = render(<ScrollFade className="h-40">Content</ScrollFade>)
    const el = container.firstElementChild as HTMLElement
    expect(el.dataset.slot).toBe('scroll-fade')
    expect(el.dataset.orientation).toBe('vertical')
    expect(el.className).toContain('overflow-y-auto')
    expect(el.className).toContain('h-40')
    expect(el.style.maskImage).toContain('linear-gradient(to bottom')
  })

  it('fades only the edges with more content past them', () => {
    const { container } = render(<ScrollFade size={32}>Content</ScrollFade>)
    const el = container.firstElementChild as HTMLElement
    size(el, { scrollHeight: 500, clientHeight: 100 })

    scrollTo(el, { top: 0 })
    expect(fade(el, 'top')).toBe('0px')
    expect(fade(el, 'bottom')).toBe('32px')
    expect(el.hasAttribute('data-fade-top')).toBe(false)
    expect(el.hasAttribute('data-fade-bottom')).toBe(true)

    scrollTo(el, { top: 200 })
    expect(fade(el, 'top')).toBe('32px')
    expect(fade(el, 'bottom')).toBe('32px')

    scrollTo(el, { top: 400 })
    expect(fade(el, 'top')).toBe('32px')
    expect(fade(el, 'bottom')).toBe('0px')
    expect(el.hasAttribute('data-fade-bottom')).toBe(false)
  })

  it('grows the fade with the distance to the edge, up to its size', () => {
    const { container } = render(<ScrollFade size={40}>Content</ScrollFade>)
    const el = container.firstElementChild as HTMLElement
    size(el, { scrollHeight: 300, clientHeight: 100 })
    scrollTo(el, { top: 10 })
    expect(fade(el, 'top')).toBe('10px')
    scrollTo(el, { top: 185 })
    expect(fade(el, 'bottom')).toBe('15px')
  })

  it('shows no fade when everything fits', () => {
    const { container } = render(<ScrollFade>Content</ScrollFade>)
    const el = container.firstElementChild as HTMLElement
    size(el, { scrollHeight: 100, clientHeight: 100 })
    scrollTo(el, { top: 0 })
    expect(fade(el, 'top')).toBe('0px')
    expect(fade(el, 'bottom')).toBe('0px')
  })

  it('fades left and right when horizontal', () => {
    const { container } = render(
      <ScrollFade orientation="horizontal" size={24} hideScrollbar>
        Content
      </ScrollFade>,
    )
    const el = container.firstElementChild as HTMLElement
    expect(el.className).toContain('overflow-x-auto')
    expect(el.className).toContain('[scrollbar-width:none]')
    expect(el.style.maskImage).toContain('linear-gradient(to right')
    size(el, { scrollWidth: 400, clientWidth: 200 })
    scrollTo(el, { left: 100 })
    expect(fade(el, 'left')).toBe('24px')
    expect(fade(el, 'right')).toBe('24px')
    expect(fade(el, 'top')).toBe('0px')
    scrollTo(el, { left: 200 })
    expect(fade(el, 'right')).toBe('0px')
  })

  it('intersects both masks when both axes scroll', () => {
    const { container } = render(<ScrollFade orientation="both">Content</ScrollFade>)
    const el = container.firstElementChild as HTMLElement
    expect(el.className).toContain('overflow-auto')
    expect(el.style.maskImage).toContain('to bottom')
    expect(el.style.maskImage).toContain('to right')
  })

  it('fades an element of its own with asChild, keeping its ref', () => {
    const ref = { current: null as HTMLElement | null }
    const { getByRole } = render(
      <ScrollFade asChild className="extra">
        <nav ref={ref} aria-label="Pages" className="own">
          Links
        </nav>
      </ScrollFade>,
    )
    const nav = getByRole('navigation')
    expect(ref.current).toBe(nav)
    expect(nav.dataset.orientation).toBe('vertical')
    expect(nav.className).toContain('own')
    expect(nav.className).toContain('extra')
    expect(nav.style.maskImage).toContain('linear-gradient')
  })

  it('starts the top fade below a stuck sticky header', () => {
    const { container, getByText } = render(
      <ScrollFade>
        <div data-scroll-fade-sticky style={{ position: 'sticky', top: 0 }}>
          Header
        </div>
        <p>Content</p>
      </ScrollFade>,
    )
    const el = container.firstElementChild as HTMLElement
    const header = getByText('Header')
    size(el, { scrollHeight: 500, clientHeight: 100 })
    const rect = (top: number, height: number) =>
      ({ top, bottom: top + height, left: 0, right: 100, width: 100, height }) as DOMRect
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(rect(50, 100))
    vi.spyOn(header, 'getBoundingClientRect').mockReturnValue(rect(50, 30))
    scrollTo(el, { top: 120 })
    expect(el.style.getPropertyValue('--scroll-fade-top-offset')).toBe('30px')
    // Back at the top there is no fade, so nothing to push down.
    scrollTo(el, { top: 0 })
    expect(el.style.getPropertyValue('--scroll-fade-top-offset')).toBe('0px')
  })

  it('cleans up its listeners on unmount', () => {
    const { container, unmount } = render(<ScrollFade>Content</ScrollFade>)
    const el = container.firstElementChild as HTMLElement
    const remove = vi.spyOn(el, 'removeEventListener')
    unmount()
    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function))
  })
})
