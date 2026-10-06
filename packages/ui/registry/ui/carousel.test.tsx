import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
  CarouselPlayPause,
  CarouselPrevious,
  type CarouselProps,
  CarouselVideo,
  useCarousel,
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

function setup(count = 4, props: Partial<CarouselProps> = {}) {
  const view = render(
    <Carousel label="Highlights" {...props}>
      <CarouselContent>
        {Array.from({ length: count }, (_, i) => (
          <CarouselItem key={String(i)}>Item {i + 1}</CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
      <CarouselDots />
      <CarouselPlayPause />
    </Carousel>,
  )
  const scroller = view.container.querySelector('[data-slot="carousel-content"]') as HTMLElement
  layOut(scroller, Array.from(scroller.children) as HTMLElement[])
  fireEvent.scroll(scroller)
  return { ...view, scroller }
}

/** Under a reduced motion preference, or not. */
function prefersReducedMotion(reduce: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: reduce, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  )
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

describe('Carousel loop', () => {
  it('keeps the arrows live at both ends', () => {
    const { scroller } = setup(4, { loop: true })
    expect((screen.getByLabelText('Previous') as HTMLButtonElement).disabled).toBe(false)
    scrollTo(scroller, ITEM_WIDTH * 3)
    expect((screen.getByLabelText('Next') as HTMLButtonElement).disabled).toBe(false)
  })

  it('wraps from the last item to the first, and back', async () => {
    const { scroller } = setup(4, { loop: true })
    scrollTo(scroller, ITEM_WIDTH * 3)
    await userEvent.click(screen.getByLabelText('Next'))
    expect(scroller.scrollLeft).toBe(0)

    await userEvent.click(screen.getByLabelText('Previous'))
    expect(scroller.scrollLeft).toBe(ITEM_WIDTH * 3)
  })

  it('does not wrap a single item', () => {
    setup(1, { loop: true })
    expect((screen.getByLabelText('Next') as HTMLButtonElement).disabled).toBe(true)
  })
})

describe('Carousel autoplay', () => {
  beforeEach(() => {
    // Timeouts only: the frame stub above keeps every scroll read synchronous.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    prefersReducedMotion(false)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  /** In small steps, each in its own act, so a timeout set by the last move gets to run too. */
  const tick = (ms: number) => {
    for (let t = 0; t < ms; t += 50) act(() => vi.advanceTimersByTime(Math.min(50, ms - t)))
  }

  it('moves to the next item every interval', () => {
    const { scroller } = setup(4, { autoplay: true, interval: 1000 })
    tick(999)
    expect(scroller.scrollLeft).toBe(0)
    tick(1)
    expect(scroller.scrollLeft).toBe(ITEM_WIDTH)
    tick(1000)
    expect(scroller.scrollLeft).toBe(ITEM_WIDTH * 2)
  })

  it('stops at the end without loop, and wraps with it', () => {
    const { scroller, unmount } = setup(3, { autoplay: true, interval: 1000 })
    tick(5000)
    expect(scroller.scrollLeft).toBe(ITEM_WIDTH * 2)
    unmount()

    const looped = setup(3, { autoplay: true, interval: 1000, loop: true })
    tick(2000)
    expect(looped.scroller.scrollLeft).toBe(ITEM_WIDTH * 2)
    tick(1000)
    expect(looped.scroller.scrollLeft).toBe(0)
  })

  it('pauses while a mouse rests on it, and goes on when it leaves', () => {
    const { scroller, container } = setup(4, { autoplay: true, interval: 1000 })
    const root = container.querySelector('[data-slot="carousel"]') as HTMLElement
    fireEvent.pointerEnter(root, { pointerType: 'mouse' })
    tick(3000)
    expect(scroller.scrollLeft).toBe(0)

    fireEvent.pointerLeave(root, { pointerType: 'mouse' })
    tick(1000)
    expect(scroller.scrollLeft).toBe(ITEM_WIDTH)
  })

  // What is being read must not slide away. A mouse click leaving focus on an arrow is not
  // reading, so it does not stop the run for good.
  it('pauses while keyboard focus is inside it', () => {
    const { scroller } = setup(4, { autoplay: true, interval: 1000 })
    const next = screen.getByLabelText('Next')
    act(() => next.focus())
    tick(3000)
    expect(scroller.scrollLeft).toBe(0)

    act(() => next.blur())
    tick(1000)
    expect(scroller.scrollLeft).toBe(ITEM_WIDTH)

    fireEvent.pointerDown(next)
    act(() => next.focus())
    tick(1000)
    expect(scroller.scrollLeft).toBe(ITEM_WIDTH * 2)
  })

  it('has a pause button that stops it until it is pressed again', () => {
    const { scroller } = setup(4, { autoplay: true, interval: 1000 })
    const toggle = screen.getByRole('button', { name: 'Pause automatic scrolling' })
    fireEvent.click(toggle)
    // The pointer is still over it after the click; leaving must not restart it.
    fireEvent.pointerLeave(toggle)
    tick(5000)
    expect(scroller.scrollLeft).toBe(0)

    fireEvent.click(screen.getByRole('button', { name: 'Start automatic scrolling' }))
    tick(1000)
    expect(scroller.scrollLeft).toBe(ITEM_WIDTH)
  })

  it('keeps the live region quiet while it moves on its own', () => {
    const { container } = setup(4, { autoplay: true, interval: 1000 })
    const status = container.querySelector('[data-slot="carousel-status"]') as HTMLElement
    expect(status.getAttribute('aria-live')).toBe('off')

    fireEvent.click(screen.getByRole('button', { name: 'Pause automatic scrolling' }))
    expect(status.getAttribute('aria-live')).toBe('polite')
  })

  it('never runs under a reduced motion preference, and offers no button for it', () => {
    prefersReducedMotion(true)
    const { scroller } = setup(4, { autoplay: true, interval: 1000 })
    tick(5000)
    expect(scroller.scrollLeft).toBe(0)
    expect(screen.queryByRole('button', { name: /automatic scrolling/ })).toBeNull()
  })

  it('shows no pause button when autoplay is off', () => {
    setup(4)
    expect(screen.queryByRole('button', { name: /automatic scrolling/ })).toBeNull()
  })
})

describe('Carousel API', () => {
  it('reads out where the run is once it moves, politely without autoplay', () => {
    const { scroller, container } = setup(4)
    const status = container.querySelector('[data-slot="carousel-status"]') as HTMLElement
    expect(status.getAttribute('aria-live')).toBe('polite')
    expect(status.textContent).toBe('')
    scrollTo(scroller, ITEM_WIDTH)
    expect(status.textContent).toBe('Item 2 of 4')
  })

  it('drives it from a part inside with useCarousel', async () => {
    function Readout() {
      const { index, count, canPrev, canNext, goTo } = useCarousel()
      return (
        <button type="button" onClick={() => goTo(2)}>
          {`${index + 1}/${count} ${canPrev} ${canNext}`}
        </button>
      )
    }
    const view = render(
      <Carousel>
        <CarouselContent>
          {['a', 'b', 'c', 'd'].map((id) => (
            <CarouselItem key={id}>{id}</CarouselItem>
          ))}
        </CarouselContent>
        <Readout />
      </Carousel>,
    )
    const scroller = view.container.querySelector('[data-slot="carousel-content"]') as HTMLElement
    layOut(scroller, Array.from(scroller.children) as HTMLElement[])
    fireEvent.scroll(scroller)
    expect(screen.getByRole('button').textContent).toBe('1/4 false true')

    await userEvent.click(screen.getByRole('button'))
    expect(scroller.scrollLeft).toBe(ITEM_WIDTH * 2)
    expect(screen.getByRole('button').textContent).toBe('3/4 true true')
  })

  it('drives it from outside with apiRef, and reports moves', () => {
    const api = { current: null as CarouselApi | null }
    const onIndexChange = vi.fn()
    const { scroller } = setup(4, { apiRef: api, onIndexChange, loop: true })
    expect(api.current?.count).toBe(4)

    act(() => api.current?.next())
    expect(scroller.scrollLeft).toBe(ITEM_WIDTH)
    expect(api.current?.index).toBe(1)
    expect(onIndexChange).toHaveBeenLastCalledWith(1)

    act(() => api.current?.goTo(3))
    act(() => api.current?.next())
    expect(scroller.scrollLeft).toBe(0)
    expect(onIndexChange).toHaveBeenLastCalledWith(0)
  })
})

describe('Carousel overlay controls', () => {
  it('puts every control in the on-image look', () => {
    setup(4, { controls: 'overlay', autoplay: true })
    for (const name of ['Previous', 'Next', 'Pause automatic scrolling']) {
      expect(screen.getByRole('button', { name }).dataset.variant).toBe('overlay')
    }
    const dots = document.querySelector('[data-slot="carousel-dots"]') as HTMLElement
    expect(dots.dataset.variant).toBe('overlay')
  })

  it('lets a single control keep the default look', () => {
    render(
      <Carousel controls="overlay">
        <CarouselContent>
          <CarouselItem>a</CarouselItem>
        </CarouselContent>
        <CarouselNext variant="default" />
      </Carousel>,
    )
    expect(screen.getByRole('button', { name: 'Next' }).dataset.variant).toBe('default')
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
