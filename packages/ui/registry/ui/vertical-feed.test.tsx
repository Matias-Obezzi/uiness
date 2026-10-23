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

  describe('captions', () => {
    // jsdom has no text tracks or layout: a track per video holding a cue, a 360 by 640 item,
    // and captions 160 by 30 near its bottom, moved by their translate.
    let box = { left: 100, top: 560, right: 260, bottom: 590 }
    const tracks: (EventTarget & { kind: string; mode: string; activeCues: { text: string }[] })[] =
      []
    const rect = ({ left, top, right, bottom }: typeof box) =>
      ({ left, top, right, bottom, width: right - left, height: bottom - top }) as DOMRect
    const shift = (el: HTMLElement) =>
      el.style.translate.split(' ').map((n) => Number.parseFloat(n))

    beforeEach(() => {
      localStorage.clear()
      box = { left: 100, top: 560, right: 260, bottom: 590 }
      tracks.length = 0
      vi.spyOn(HTMLMediaElement.prototype, 'textTracks', 'get').mockImplementation(function (
        this: HTMLMediaElement,
      ) {
        const own = this as HTMLMediaElement & { fake?: (typeof tracks)[number] }
        if (!own.fake) {
          own.fake = Object.assign(new EventTarget(), {
            kind: 'captions',
            mode: 'disabled',
            activeCues: [{ text: 'A wall of fire.' }],
          })
          tracks.push(own.fake)
        }
        return [own.fake] as unknown as TextTrackList
      })
      vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
        this: Element,
      ) {
        if (this.tagName === 'ARTICLE') return rect({ left: 0, top: 0, right: 360, bottom: 640 })
        if (this.matches('[data-slot=vertical-feed-captions]')) {
          // Moved by its translate, as a browser measures it.
          const [x = 0, y = 0] = (this as HTMLElement).style.translate
            ? shift(this as HTMLElement)
            : []
          return rect({
            left: box.left + x,
            top: box.top + y,
            right: box.right + x,
            bottom: box.bottom + y,
          })
        }
        return rect({ left: 0, top: 0, right: 0, bottom: 0 })
      })
    })

    const Feed = ({ show = true }: { show?: boolean }) => (
      <VerticalFeed>
        {['one', 'two'].map((name) => (
          <div key={name}>
            {/* biome-ignore lint/a11y/useMediaCaption: the track is faked above */}
            <video />
            <VerticalFeedCaptions show={show} />
          </div>
        ))}
      </VerticalFeed>
    )
    const captions = () => screen.getAllByRole('group', { name: /^Captions/ })

    it('draws them itself, reads them out while playing, and turns them off', () => {
      const { rerender } = render(<Feed />)
      const [first] = captions() as HTMLElement[]
      // The browser draws nothing; the cue is shown here, and not read out while paused.
      expect(tracks.map((t) => t.mode)).toEqual(['hidden', 'hidden'])
      expect(first?.textContent).toBe('A wall of fire.')
      expect(first?.querySelector('[aria-live]')?.textContent).toBe('')

      vi.spyOn(HTMLMediaElement.prototype, 'paused', 'get').mockReturnValue(false)
      const [track] = tracks
      act(() => {
        if (track) track.activeCues = [{ text: 'The flames rise.' }]
        track?.dispatchEvent(new Event('cuechange'))
      })
      expect(first?.querySelector('[aria-live]')?.textContent).toBe('The flames rise.')

      rerender(<Feed show={false} />)
      expect(tracks.map((t) => t.mode)).toEqual(['disabled', 'disabled'])
      expect(first?.hidden).toBe(true)
    })

    it('moves for every item, stays inside, and is remembered', () => {
      const { unmount } = render(<Feed />)
      const [first, second] = captions() as HTMLElement[]
      if (!first || !second) throw new Error('two captions')
      fireEvent.pointerDown(first, { pointerId: 1, clientX: 150, clientY: 570 })
      fireEvent.pointerMove(first, { pointerId: 1, clientX: -500, clientY: -500 })
      fireEvent.pointerUp(first, { pointerId: 1 })
      // 8px from the top left corner, here and on the other item.
      for (const el of [first, second]) {
        const [x, y] = shift(el)
        expect(x).toBeCloseTo(-92)
        expect(y).toBeCloseTo(-552)
      }

      unmount()
      render(<Feed />)
      expect(shift(captions()[0] as HTMLElement)[0]).toBeCloseTo(-92)
    })

    it('keeps inside when a longer caption widens it', () => {
      render(<Feed />)
      const [first] = captions() as HTMLElement[]
      if (!first) throw new Error('captions')
      for (let i = 0; i < 5; i++) fireEvent.keyDown(first, { key: 'ArrowRight', shiftKey: true })
      // As far right as a 160px box goes: its left edge at 192.
      expect(shift(first)[0]).toBeCloseTo(92)

      box = { left: 60, top: 560, right: 300, bottom: 590 }
      const [track] = tracks
      act(() => {
        if (track) track.activeCues = [{ text: 'Then it all begins again, and again.' }]
        track?.dispatchEvent(new Event('cuechange'))
      })
      // 240px wide now: its left edge at 112, still 8px from the right.
      expect(shift(first)[0]).toBeCloseTo(52)
    })

    it('moves with the arrow keys without moving the feed, and Home puts it back', () => {
      const scrollTo = vi.fn()
      Element.prototype.scrollTo = scrollTo
      render(<Feed />)
      const [first] = captions() as HTMLElement[]
      if (!first) throw new Error('captions')
      fireEvent.keyDown(first, { key: 'ArrowRight' })
      // 2% of 360px.
      expect(shift(first)[0]).toBeCloseTo(7.2)
      fireEvent.keyDown(first, { key: 'ArrowDown' })
      expect(scrollTo).not.toHaveBeenCalled()
      expect(localStorage.getItem('uiness:vertical-feed-captions')).not.toBeNull()

      fireEvent.keyDown(first, { key: 'Home' })
      expect(first.style.translate).toBe('')
      expect(localStorage.getItem('uiness:vertical-feed-captions')).toBeNull()
    })
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
