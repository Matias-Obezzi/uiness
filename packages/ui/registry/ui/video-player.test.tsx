import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LabelsProvider } from '@/lib/labels'
import { es } from '@/lib/labels-es'
import { VideoPlayer } from './video-player'

// jsdom has media elements but does not play them: give them a clock and a duration.
beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (
    this: HTMLMediaElement,
  ) {
    Object.defineProperty(this, 'paused', { configurable: true, value: false })
    this.dispatchEvent(new Event('play'))
    return Promise.resolve()
  })
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function (
    this: HTMLMediaElement,
  ) {
    Object.defineProperty(this, 'paused', { configurable: true, value: true })
    this.dispatchEvent(new Event('pause'))
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

function setup(node = <VideoPlayer src="/clip.webm" />) {
  const view = render(node)
  const video = view.container.querySelector('video') as HTMLVideoElement
  let now = 0
  Object.defineProperty(video, 'duration', { configurable: true, value: 100 })
  Object.defineProperty(video, 'currentTime', {
    configurable: true,
    get: () => now,
    set: (value: number) => {
      now = value
    },
  })
  act(() => {
    video.dispatchEvent(new Event('durationchange'))
  })
  const player = screen.getByRole('region', { name: /video player|reproductor/i })
  return { ...view, video, player, time: () => now }
}

describe('VideoPlayer', () => {
  it('plays and pauses from its button, and says which it will do', async () => {
    const { video } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    expect(video.play).toHaveBeenCalled()
    expect(await screen.findByRole('button', { name: 'Pause' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    expect(video.pause).toHaveBeenCalled()
  })

  it('answers the keyboard anywhere in the frame', () => {
    const { video, player, time } = setup()
    fireEvent.keyDown(player, { key: 'k' })
    expect(video.play).toHaveBeenCalledTimes(1)
    fireEvent.keyDown(player, { key: 'l' })
    expect(time()).toBe(10)
    fireEvent.keyDown(player, { key: 'ArrowLeft' })
    expect(time()).toBe(5)
    fireEvent.keyDown(player, { key: '5' })
    expect(time()).toBe(50)
    fireEvent.keyDown(player, { key: 'm' })
    expect(video.muted).toBe(true)
  })

  it('steps one frame at a time with comma and period, paused', () => {
    const { video, player, time } = setup(<VideoPlayer src="/clip.webm" frameRate={25} />)
    fireEvent.keyDown(player, { key: 'k' })
    fireEvent.keyDown(player, { key: '5' })
    fireEvent.keyDown(player, { key: '.' })
    expect(video.pause).toHaveBeenCalled()
    expect(time()).toBeCloseTo(50.04, 5)
    fireEvent.keyDown(player, { key: ',' })
    fireEvent.keyDown(player, { key: ',' })
    expect(time()).toBeCloseTo(49.96, 5)
  })

  it('leaves the arrows to a focused slider', () => {
    const { time } = setup()
    const seek = screen.getByRole('slider', { name: 'Seek' })
    fireEvent.keyDown(seek, { key: 'ArrowLeft' })
    // The slider moved it by its own step, not the player by five seconds.
    expect(time()).not.toBe(-5)
    expect(seek.getAttribute('aria-valuetext')).toMatch(/of 1:40$/)
  })

  it('mutes, and steps through the speeds', () => {
    const { video } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Mute' }))
    act(() => {
      video.dispatchEvent(new Event('volumechange'))
    })
    expect(screen.getByRole('button', { name: 'Unmute' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Playback speed 1×' }))
    expect(video.playbackRate).toBe(1.25)
    act(() => {
      video.dispatchEvent(new Event('ratechange'))
    })
    expect(screen.getByRole('button', { name: 'Playback speed 1.25×' })).toBeTruthy()
  })

  it('offers captions only when the video has some', () => {
    setup()
    expect(screen.queryByRole('button', { name: 'Captions' })).toBeNull()
  })

  it('speaks the language of the labels', () => {
    setup(
      <LabelsProvider labels={es} locale="es">
        <VideoPlayer src="/clip.webm" />
      </LabelsProvider>,
    )
    expect(screen.getByRole('button', { name: 'Reproducir' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Velocidad 1×' })).toBeTruthy()
  })
})
