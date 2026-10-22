import { act, fireEvent, render, screen } from '@testing-library/react'
import { HeartIcon } from 'lucide-react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  VerticalFeed,
  VerticalFeedAction,
  VerticalFeedActions,
  VerticalFeedCaptions,
} from './vertical-feed'

let report: IntersectionObserverCallback = () => {}

beforeEach(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: IntersectionObserverCallback) {
        report = callback
      }
      observe() {}
      disconnect() {}
    },
  )
})
afterEach(() => {
  vi.unstubAllGlobals()
})

const onScreen = (target: Element) =>
  act(() =>
    report(
      [
        {
          target,
          isIntersecting: true,
          intersectionRatio: 1,
        } as unknown as IntersectionObserverEntry,
      ],
      {} as IntersectionObserver,
    ),
  )

describe('VerticalFeed', () => {
  it('is a feed of articles, and plays only the one on screen', () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
    const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    const onActiveChange = vi.fn()
    render(
      <VerticalFeed onActiveChange={onActiveChange}>
        {['one', 'two', 'three'].map((name) => (
          <div key={name}>
            {/* biome-ignore lint/a11y/useMediaCaption: a test clip */}
            <video data-testid={name} />
          </div>
        ))}
      </VerticalFeed>,
    )
    const articles = screen.getAllByRole('article')
    expect(screen.getByRole('feed', { name: 'Feed' })).toBeTruthy()
    expect(articles.map((a) => a.getAttribute('aria-posinset'))).toEqual(['1', '2', '3'])
    expect(articles[0]?.getAttribute('aria-setsize')).toBe('3')
    expect(onActiveChange).toHaveBeenLastCalledWith(0)

    play.mockClear()
    pause.mockClear()
    onScreen(articles[1] as HTMLElement)
    expect(onActiveChange).toHaveBeenLastCalledWith(1)
    expect(articles[1]?.hasAttribute('data-active')).toBe(true)
    expect(play.mock.contexts).toEqual([screen.getByTestId('two')])
    expect(pause.mock.contexts).toEqual([screen.getByTestId('one'), screen.getByTestId('three')])
  })

  it('moves one item for Page Down and the arrows, but not while typing', () => {
    const scrollTo = vi.fn()
    Element.prototype.scrollTo = scrollTo
    render(
      <VerticalFeed>
        <input aria-label="Comment" />
        <p>two</p>
      </VerticalFeed>,
    )
    const [first, second] = screen.getAllByRole('article') as HTMLElement[]
    fireEvent.keyDown(first as HTMLElement, { key: 'PageDown' })
    expect(scrollTo).toHaveBeenCalledTimes(1)
    expect(document.activeElement).toBe(second)

    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Comment' }), { key: 'ArrowDown' })
    expect(scrollTo).toHaveBeenCalledTimes(1)
  })

  it('draws the captions itself, turns them off, and drags them within the item', () => {
    // jsdom has no text tracks: one that holds a cue.
    const track = Object.assign(new EventTarget(), {
      kind: 'captions',
      mode: 'disabled',
      activeCues: [{ text: 'A wall of fire.' }],
    })
    vi.spyOn(HTMLMediaElement.prototype, 'textTracks', 'get').mockReturnValue([
      track,
    ] as unknown as TextTrackList)
    const Item = ({ show }: { show: boolean }) => (
      <VerticalFeed>
        <div>
          {/* biome-ignore lint/a11y/useMediaCaption: the track is faked above */}
          <video />
          <VerticalFeedCaptions show={show} />
        </div>
      </VerticalFeed>
    )
    const { container, rerender } = render(<Item show />)
    const captions = container.querySelector('[data-slot=vertical-feed-captions]') as HTMLElement
    // The browser draws nothing; the cue is shown here.
    expect(track.mode).toBe('hidden')
    expect(captions.textContent).toBe('A wall of fire.')

    // A 360 by 640 item with the captions near its bottom.
    const rect = (left: number, top: number, right: number, bottom: number) =>
      ({ left, top, right, bottom }) as DOMRect
    vi.spyOn(screen.getByRole('article'), 'getBoundingClientRect').mockReturnValue(
      rect(0, 0, 360, 640),
    )
    vi.spyOn(captions, 'getBoundingClientRect').mockReturnValue(rect(100, 560, 260, 590))
    fireEvent.pointerDown(captions, { pointerId: 1, clientX: 150, clientY: 570 })
    fireEvent.pointerMove(captions, { pointerId: 1, clientX: -500, clientY: -500 })
    fireEvent.pointerUp(captions, { pointerId: 1 })
    // It stops 8px from the top left corner.
    expect(captions.style.translate).toBe('-92px -552px')

    rerender(<Item show={false} />)
    expect(track.mode).toBe('disabled')
    expect(captions.hidden).toBe(true)
  })

  it('names its actions with their counts', () => {
    render(
      <VerticalFeedActions>
        <VerticalFeedAction label="Like" count="12K" pressed>
          <HeartIcon />
        </VerticalFeedAction>
      </VerticalFeedActions>,
    )
    expect(screen.getByRole('button', { name: 'Like 12K', pressed: true })).toBeTruthy()
  })
})
