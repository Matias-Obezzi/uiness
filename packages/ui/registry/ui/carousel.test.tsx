import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselVideo,
} from './carousel'

/* jsdom lays nothing out: every offset and every width is zero, so a carousel that reads the
 * scroll position has nothing to read. These give the run a made up geometry — four items 200
 * wide in a 200 wide box — and a scrollTo that moves scrollLeft and fires a scroll, which is all
 * the component ever asks of the platform. Without it the tests below would pass on any code. */
const ITEM_WIDTH = 200
const VIEWPORT = 200

function layOut(scroller: HTMLElement, items: HTMLElement[]) {
  let left = 0
  Object.defineProperty(scroller, 'clientWidth', { value: VIEWPORT, configurable: true })
  Object.defineProperty(scroller, 'clientLeft', { value: 0, configurable: true })
  Object.defineProperty(scroller, 'scrollWidth', {
    value: ITEM_WIDTH * items.length,
    configurable: true,
  })
  for (const item of items) {
    Object.defineProperty(item, 'offsetLeft', { value: left, configurable: true })
    left += ITEM_WIDTH
  }
  scroller.scrollTo = ((options: ScrollToOptions) => {
    scroller.scrollLeft = options.left ?? 0
    fireEvent.scroll(scroller)
  }) as HTMLElement['scrollTo']
}

function setup(count = 4) {
  const view = render(
    <Carousel label="Highlights">
      <CarouselContent>
        {Array.from({ length: count }, (_, i) => (
          <CarouselItem key={String(i)}>Item {i + 1}</CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
      <CarouselDots />
    </Carousel>,
  )
  const scroller = view.container.querySelector('[data-slot="carousel-content"]') as HTMLElement
  layOut(scroller, Array.from(scroller.children) as HTMLElement[])
  fireEvent.scroll(scroller)
  return { ...view, scroller }
}

/** Move the run and let the component read the new position. */
function scrollTo(scroller: HTMLElement, left: number) {
  scroller.scrollLeft = left
  fireEvent.scroll(scroller)
}

beforeEach(() => {
  // The component batches its reads into a frame, and jsdom never paints one. Running the
  // callback straight away keeps each assertion about the scroll it just made.
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0)
    return 0
  })
  vi.stubGlobal('cancelAnimationFrame', () => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Carousel', () => {
  it('renders the items as a named list', () => {
    setup(3)
    const list = screen.getByRole('list', { name: 'Highlights items' })
    expect(list).toBeTruthy()
    expect(screen.getAllByRole('listitem').length).toBe(3)
  })

  // Everything past the first screenful is unreachable without this: a scrolling box that no
  // key can enter is a box a keyboard user cannot read.
  it('puts the scrolling run on the tab order', async () => {
    setup()
    const list = screen.getByRole('list')
    expect(list.getAttribute('tabindex')).toBe('0')

    await userEvent.tab()
    expect(document.activeElement).toBe(list)
  })

  it('holds the arrows at the ends of the run', () => {
    const { scroller } = setup()
    const previous = screen.getByLabelText('Previous') as HTMLButtonElement
    const next = screen.getByLabelText('Next') as HTMLButtonElement
    expect(previous.disabled).toBe(true)
    expect(next.disabled).toBe(false)

    scrollTo(scroller, ITEM_WIDTH * 3)
    expect((screen.getByLabelText('Previous') as HTMLButtonElement).disabled).toBe(false)
    expect((screen.getByLabelText('Next') as HTMLButtonElement).disabled).toBe(true)
  })

  it('moves one item at a time with the arrows', async () => {
    const { scroller } = setup()
    await userEvent.click(screen.getByLabelText('Next'))
    expect(scroller.scrollLeft).toBe(ITEM_WIDTH)

    await userEvent.click(screen.getByLabelText('Next'))
    expect(scroller.scrollLeft).toBe(ITEM_WIDTH * 2)

    await userEvent.click(screen.getByLabelText('Previous'))
    expect(scroller.scrollLeft).toBe(ITEM_WIDTH)
  })

  it('does not run off either end', async () => {
    const { scroller } = setup()
    scrollTo(scroller, ITEM_WIDTH * 3)
    await userEvent.click(screen.getByLabelText('Next'))
    expect(scroller.scrollLeft).toBe(ITEM_WIDTH * 3)
  })

  describe('dots', () => {
    it('gives one dot per item and marks where the run is', () => {
      const { scroller } = setup(4)
      const dots = screen.getAllByRole('button', { name: /Go to item/ })
      expect(dots.length).toBe(4)
      expect(dots[0]?.getAttribute('aria-current')).toBe('true')

      scrollTo(scroller, ITEM_WIDTH * 2)
      const moved = screen.getAllByRole('button', { name: /Go to item/ })
      expect(moved[2]?.getAttribute('aria-current')).toBe('true')
      expect(moved[0]?.getAttribute('aria-current')).toBeNull()
    })

    it('jumps the run when one is pressed', async () => {
      const { scroller } = setup(4)
      await userEvent.click(screen.getByRole('button', { name: 'Go to item 3 of 4' }))
      expect(scroller.scrollLeft).toBe(ITEM_WIDTH * 2)
    })

    it('says nothing when there is nothing to page through', () => {
      setup(1)
      expect(screen.queryByRole('button', { name: /Go to item/ })).toBeNull()
    })
  })

  // Items are not assumed to match: the run is read by start edge, so a wide item next to a
  // narrow one still reports the one actually snapped.
  it('tracks items of different widths', () => {
    const view = render(
      <Carousel label="Mixed">
        <CarouselContent>
          <CarouselItem>Narrow</CarouselItem>
          <CarouselItem>Wide</CarouselItem>
          <CarouselItem>Narrow again</CarouselItem>
        </CarouselContent>
        <CarouselDots />
      </Carousel>,
    )
    const scroller = view.container.querySelector('[data-slot="carousel-content"]') as HTMLElement
    const items = Array.from(scroller.children) as HTMLElement[]
    const offsets = [0, 120, 620]
    Object.defineProperty(scroller, 'clientWidth', { value: 200, configurable: true })
    Object.defineProperty(scroller, 'clientLeft', { value: 0, configurable: true })
    Object.defineProperty(scroller, 'scrollWidth', { value: 800, configurable: true })
    items.forEach((item, i) => {
      Object.defineProperty(item, 'offsetLeft', { value: offsets[i], configurable: true })
    })

    scrollTo(scroller, 620)
    const dots = screen.getAllByRole('button', { name: /Go to item/ })
    expect(dots[2]?.getAttribute('aria-current')).toBe('true')
  })
})

describe('CarouselVideo', () => {
  it('is a muted looping video that plays without taking over the page', () => {
    const { container } = render(<CarouselVideo src="/clip.mp4" />)
    const video = container.querySelector('video') as HTMLVideoElement
    expect(video.muted).toBe(true)
    expect(video.loop).toBe(true)
    expect(video.getAttribute('playsinline')).not.toBeNull()
  })

  // Under a reduced motion preference it must not start on its own. Controls take its place, so
  // the clip is still watchable by anyone who wants to watch it.
  it('does not autoplay when motion is unwelcome, and offers controls instead', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
    const observe = vi.fn()
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe = observe
        unobserve = () => {}
        disconnect = () => {}
      },
    )

    const { container } = render(<CarouselVideo src="/clip.mp4" />)
    const video = container.querySelector('video') as HTMLVideoElement
    expect(video.controls).toBe(true)
    // Nothing is watched for visibility, so nothing is ever asked to play.
    expect(observe).not.toHaveBeenCalled()
  })
})
