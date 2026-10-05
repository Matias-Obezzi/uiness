import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AnnouncementBar } from './announcement-bar'

const messages = ['Version 2 is out', 'Join the beta', 'We are hiring']
const message = () => document.querySelector('[data-slot=announcement-bar-message]')?.textContent

describe('AnnouncementBar', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    window.localStorage.clear()
  })

  it('rotates its messages and stops when paused', () => {
    render(<AnnouncementBar messages={messages} interval={3000} />)
    expect(screen.getByRole('region', { name: 'Announcements' })).toBeTruthy()
    expect(message()).toContain('Version 2 is out')
    act(() => vi.advanceTimersByTime(3000))
    expect(message()).toContain('Join the beta')

    fireEvent.click(screen.getByRole('button', { name: 'Pause messages' }))
    act(() => vi.advanceTimersByTime(10000))
    expect(message()).toContain('Join the beta')
    fireEvent.click(screen.getByRole('button', { name: 'Next message' }))
    expect(message()).toContain('We are hiring')
    expect(screen.getByRole('button', { name: 'Play messages' })).toBeTruthy()
  })

  // Text that changes by itself is not read out; changes someone asked for are.
  it('announces changes only while it is not rotating by itself', () => {
    render(<AnnouncementBar messages={messages} />)
    const live = document.querySelector('[aria-live]')
    expect(live?.getAttribute('aria-live')).toBe('off')
    fireEvent.click(screen.getByRole('button', { name: 'Pause messages' }))
    expect(live?.getAttribute('aria-live')).toBe('polite')
  })

  it('counts down to a date', () => {
    vi.setSystemTime(new Date('2026-10-04T10:00:00Z'))
    const onCountdownEnd = vi.fn()
    render(
      <AnnouncementBar
        messages={['Sale ends soon']}
        countdownTo="2026-10-05T12:30:05Z"
        countdownDone="Sale over"
        onCountdownEnd={onCountdownEnd}
      />,
    )
    const timer = screen.getByRole('timer')
    expect(timer.textContent).toBe('1d02:30:05')
    expect(timer.getAttribute('aria-label')).toBe('Ends in 1 day 2 hours 30 minutes')
    act(() => vi.advanceTimersByTime((26.5 * 3600 + 10) * 1000))
    expect(screen.queryByRole('timer')).toBeNull()
    expect(screen.getByText('Sale over')).toBeTruthy()
    expect(onCountdownEnd).toHaveBeenCalledTimes(1)
  })

  it('folds away when dismissed and remembers it', () => {
    const onDismiss = vi.fn()
    const { unmount } = render(
      <AnnouncementBar messages={messages} storageKey="launch" onDismiss={onDismiss} />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(screen.getByRole('region').dataset.state).toBe('closing')
    act(() => vi.advanceTimersByTime(1000))
    expect(screen.queryByRole('region')).toBeNull()
    expect(onDismiss).toHaveBeenCalledTimes(1)
    unmount()

    render(<AnnouncementBar messages={messages} storageKey="launch" />)
    expect(screen.queryByRole('region')).toBeNull()
  })
})
