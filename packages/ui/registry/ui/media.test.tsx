import { fireEvent, render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { ActivityRings } from './activity-rings'
import { AvatarPicker, avatarRandom } from './avatar-picker'
import { formatTime, trimTo } from './clip-trimmer'
import { ContactSheet, nextMark } from './contact-sheet'
import { cropRect, FocalPointPicker } from './focal-point-picker'
import { LiquidGauge, sloshStep } from './liquid-gauge'
import { PageFlip, turnAt } from './page-flip'
import { coverScale, PhotoStraighten } from './photo-straighten'
import { SyncedTranscript, wordAt } from './synced-transcript'
import { UptimeCard, type UptimeDay, uptimeOf } from './uptime-card'
import { angleDelta, VinylCard } from './vinyl-card'

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
  window.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  HTMLCanvasElement.prototype.getContext = (() =>
    null) as typeof HTMLCanvasElement.prototype.getContext
  Element.prototype.scrollTo ??= () => {}
  Element.prototype.setPointerCapture ??= () => {}
})

describe('helpers', () => {
  it('sloshes a surface that settles back to level', () => {
    const h = new Float32Array(20)
    const v = new Float32Array(20)
    v[0] = 5
    sloshStep(h, v)
    expect(h[0]).not.toBe(0)
    for (let i = 0; i < 3000; i++) sloshStep(h, v)
    expect(Math.max(...Array.from(h, Math.abs))).toBeLessThan(0.05)
  })

  it('counts a degraded day as up', () => {
    const day = (status: UptimeDay['status']): UptimeDay => ({ date: '2026-10-01', status })
    expect(uptimeOf([day('up'), day('degraded'), day('down'), day('up')])).toBe(0.75)
    expect(uptimeOf([])).toBe(1)
  })

  it('keeps what object-fit cover would, around the focal point', () => {
    // A square crop of a 2:1 image keeps half its width, slid by the focal point.
    expect(cropRect(2, 1, { x: 0, y: 0.5 })).toEqual({ x: 0, y: 0, width: 0.5, height: 1 })
    expect(cropRect(2, 1, { x: 1, y: 0.5 })).toEqual({ x: 0.5, y: 0, width: 0.5, height: 1 })
    expect(cropRect(1, 2, { x: 0.5, y: 0.5 })).toEqual({ x: 0, y: 0.25, width: 1, height: 0.5 })
  })

  it('grows a turned photo just enough to cover its box', () => {
    expect(coverScale(0, 3, 2)).toBe(1)
    expect(coverScale(10, 3, 2)).toBeCloseTo(coverScale(-10, 3, 2))
    expect(coverScale(10, 3, 2)).toBeCloseTo(Math.cos(Math.PI / 18) + Math.sin(Math.PI / 18) * 1.5)
  })

  it('trims on whole seconds and keeps a second at least', () => {
    expect(trimTo([0, 10], 0, 3.4, 10)).toEqual([3, 10])
    expect(trimTo([0, 10], 0, 9.8, 10)).toEqual([0, 10].map((n, i) => (i ? n : 9)))
    expect(trimTo([2, 10], 1, 1, 10)).toEqual([2, 3])
    expect(trimTo([2, 10], 1, 14, 10)).toEqual([2, 10])
    expect(formatTime(65)).toBe('1:05')
  })

  it('finds the word being said', () => {
    const words = [0, 1, 2.5, 4].map((start, i) => ({ text: `w${i}`, start }))
    expect(wordAt(words, -1)).toBe(-1)
    expect(wordAt(words, 0)).toBe(0)
    expect(wordAt(words, 2.4)).toBe(1)
    expect(wordAt(words, 99)).toBe(3)
  })

  it('makes the same avatar from the same name and seed', () => {
    const a = avatarRandom('Ada Lovelace', 0)
    const b = avatarRandom('  ada lovelace ', 0)
    const c = avatarRandom('Ada Lovelace', 1)
    const first = a()
    expect(first).toBe(b())
    expect(first).not.toBe(c())
    expect(first).toBeGreaterThanOrEqual(0)
    expect(first).toBeLessThan(1)
  })

  it('turns a page by where its edge is', () => {
    expect(turnAt(1)).toBe(0)
    expect(turnAt(0)).toBe(90)
    expect(turnAt(-1)).toBe(180)
    expect(turnAt(-3)).toBe(180)
  })

  it('cycles a frame through circled, struck and clear', () => {
    expect(nextMark(null)).toBe('pick')
    expect(nextMark('pick')).toBe('strike')
    expect(nextMark('strike')).toBeNull()
  })

  it('measures a turn of the record the short way round', () => {
    expect(angleDelta(170, -170)).toBe(20)
    expect(angleDelta(-170, 170)).toBe(-20)
    expect(angleDelta(0, 90)).toBe(90)
  })
})

describe('components', () => {
  it('reads the gauge as a meter', () => {
    render(<LiquidGauge label="Storage" value={42} max={50} />)
    const meter = screen.getByRole('meter', { name: 'Storage' })
    expect(meter.getAttribute('aria-valuetext')).toBe('42 of 50')
  })

  it('lists every ring with its goal', () => {
    render(<ActivityRings rings={[{ label: 'Move', value: 420, goal: 500, unit: 'kcal' }]} />)
    expect(screen.getByText('Move')).toBeTruthy()
    expect(screen.getByRole('listitem').textContent).toContain('/500')
  })

  it('opens a day’s incidents and moves along the days with the arrows', () => {
    const days: UptimeDay[] = [
      { date: '2026-10-27', status: 'up' },
      {
        date: '2026-10-28',
        status: 'down',
        incidents: [{ title: 'API errors', time: '14:02 UTC' }],
      },
      { date: '2026-10-29', status: 'up' },
    ]
    render(<UptimeCard services={[{ name: 'API', days }]} />)
    expect(screen.getByText('66.67% uptime')).toBeTruthy()
    const today = screen.getByRole('button', { name: /Oct 29, Operational/ })
    expect(today.tabIndex).toBe(0)
    fireEvent.keyDown(today, { key: 'ArrowLeft' })
    const outage = screen.getByRole('button', { name: /Oct 28, Outage, 1 incident/ })
    expect(document.activeElement).toBe(outage)
    fireEvent.click(outage)
    expect(screen.getByText('API errors')).toBeTruthy()
    expect(outage.getAttribute('aria-expanded')).toBe('true')
  })

  it('moves the focal point with the arrows', () => {
    const onValueChange = vi.fn()
    render(<FocalPointPicker src="/a.jpg" alt="A dog" onValueChange={onValueChange} />)
    const point = screen.getByRole('slider', { name: 'Focal point' })
    fireEvent.keyDown(point, { key: 'ArrowRight', shiftKey: true })
    expect(onValueChange).toHaveBeenLastCalledWith({ x: 0.6, y: 0.5 })
    expect(point.getAttribute('aria-valuetext')).toBe('60% across, 50% down')
  })

  it('straightens with the keys and resets', () => {
    render(<PhotoStraighten src="/a.jpg" alt="A pier" />)
    const ruler = screen.getByRole('slider', { name: 'Straighten' })
    fireEvent.keyDown(ruler, { key: 'PageUp' })
    fireEvent.keyDown(ruler, { key: 'ArrowLeft' })
    expect(ruler.getAttribute('aria-valuetext')).toBe('4.5 degrees')
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(ruler.getAttribute('aria-valuenow')).toBe('0')
  })

  it('seeks from a word or a segment’s time', () => {
    const onSeek = vi.fn()
    render(
      <SyncedTranscript
        time={1.2}
        onSeek={onSeek}
        segments={[
          {
            speaker: 'Ana',
            words: [
              { text: 'Hello', start: 0 },
              { text: 'there', start: 1 },
            ],
          },
          { words: [{ text: 'again', start: 65 }] },
        ]}
      />,
    )
    expect(screen.getByText('there').getAttribute('aria-current')).toBe('true')
    fireEvent.click(screen.getByText('again'))
    expect(onSeek).toHaveBeenLastCalledWith(65)
    fireEvent.click(screen.getByRole('button', { name: 'Play from 0:00' }))
    expect(onSeek).toHaveBeenLastCalledWith(0)
  })

  it('flips the coin from the keyboard and names the avatar', () => {
    const onValueChange = vi.fn()
    render(<AvatarPicker onValueChange={onValueChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Flip to the other avatar' }), { detail: 0 })
    // Reduced motion is off, so the flip lands when its transition ends.
    fireEvent.transitionEnd(
      screen.getByRole('button', { name: 'Flip to the other avatar' }).firstElementChild as Element,
    )
    expect(onValueChange).toHaveBeenLastCalledWith({ name: 'Ada Lovelace', seed: 1 })
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Grace Hopper' } })
    expect(onValueChange).toHaveBeenLastCalledWith({ name: 'Grace Hopper', seed: 1 })
  })

  it('turns pages with the buttons and hides the pages out of view', () => {
    render(<PageFlip pages={['One', 'Two', 'Three', 'Four']} />)
    expect(screen.getByText('Page 1 of 4')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
    expect(screen.getByText('Pages 2–3 of 4')).toBeTruthy()
    expect(screen.getByText('One').closest('[aria-hidden]')?.getAttribute('aria-hidden')).toBe(
      'true',
    )
    expect(screen.getByText('Two').closest('[aria-hidden]')?.getAttribute('aria-hidden')).toBe(
      'false',
    )
  })

  it('circles, strikes and clears a frame', () => {
    render(
      <ContactSheet
        frames={[
          { id: 'a', src: '/a.jpg', alt: 'Pier' },
          { id: 'b', src: '/b.jpg', alt: 'Gulls' },
        ]}
      />,
    )
    const frame = screen.getByRole('button', { name: 'Frame 1, Pier' })
    fireEvent.click(frame)
    expect(frame.getAttribute('aria-label')).toBe('Frame 1, Pier, circled')
    expect(screen.getByText('1 circled')).toBeTruthy()
    fireEvent.click(frame)
    expect(frame.getAttribute('aria-label')).toBe('Frame 1, Pier, struck')
    fireEvent.click(frame)
    expect(frame.getAttribute('aria-label')).toBe('Frame 1, Pier')
  })

  it('plays and pauses the record', () => {
    const onPlayingChange = vi.fn()
    render(
      <VinylCard
        title="Blue in Green"
        artist="Miles Davis"
        cover="/c.jpg"
        duration={300}
        onPlayingChange={onPlayingChange}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    expect(onPlayingChange).toHaveBeenLastCalledWith(true)
    expect(screen.getByRole('button', { name: 'Pause' })).toBeTruthy()
  })
})
