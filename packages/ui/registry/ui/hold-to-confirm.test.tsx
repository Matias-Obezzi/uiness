import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HoldToConfirm } from './hold-to-confirm'

beforeEach(() => {
  vi.useFakeTimers({
    toFake: [
      'setTimeout',
      'clearTimeout',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'performance',
    ],
  })
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const wait = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms)
  })

const fill = () =>
  document.querySelector<HTMLElement>('[data-slot=hold-to-confirm-fill]') as HTMLElement

/** How much of the button the fill covers, 0 to 100. */
const covered = () => {
  const match = fill().style.clipPath.match(/inset\(0 ([\d.]+)%/)
  return match ? 100 - Number(match[1]) : 0
}

describe('HoldToConfirm', () => {
  it('confirms once held for the whole duration', async () => {
    const onConfirm = vi.fn()
    render(
      <HoldToConfirm onConfirm={onConfirm} duration={1000}>
        Delete
      </HoldToConfirm>,
    )
    const button = screen.getByRole('button', { name: 'Delete' })
    fireEvent.pointerDown(button, { button: 0 })
    await wait(500)
    expect(button.dataset.state).toBe('holding')
    expect(covered()).toBeGreaterThan(30)
    expect(onConfirm).not.toHaveBeenCalled()
    await wait(600)
    expect(onConfirm).toHaveBeenCalledOnce()
    expect(button.dataset.state).toBe('confirmed')
    expect(screen.getByRole('status').textContent).toBe('Confirmed')
  })

  it('cancels and rewinds when let go early', async () => {
    const onConfirm = vi.fn()
    render(
      <HoldToConfirm onConfirm={onConfirm} duration={1000}>
        Delete
      </HoldToConfirm>,
    )
    const button = screen.getByRole('button')
    fireEvent.pointerDown(button, { button: 0 })
    await wait(600)
    fireEvent.pointerUp(button)
    expect(button.dataset.state).toBe('idle')
    await wait(1000)
    expect(covered()).toBe(0)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('ignores a plain click', async () => {
    const onConfirm = vi.fn()
    render(<HoldToConfirm onConfirm={onConfirm}>Delete</HoldToConfirm>)
    const button = screen.getByRole('button')
    fireEvent.pointerDown(button, { button: 0 })
    fireEvent.pointerUp(button)
    fireEvent.click(button)
    await wait(2000)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('holds from the keyboard with Space and Enter', async () => {
    const onConfirm = vi.fn()
    render(
      <HoldToConfirm onConfirm={onConfirm} duration={800}>
        Delete
      </HoldToConfirm>,
    )
    const button = screen.getByRole('button')
    fireEvent.keyDown(button, { key: 'Enter' })
    await wait(300)
    fireEvent.keyUp(button, { key: 'Enter' })
    await wait(1000)
    expect(onConfirm).not.toHaveBeenCalled()

    fireEvent.keyDown(button, { key: ' ' })
    // Auto repeat while the key is held must not restart the hold.
    await wait(400)
    fireEvent.keyDown(button, { key: ' ', repeat: true })
    await wait(500)
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('still shows progress with reduced motion', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('reduced-motion'),
      media: query,
      addEventListener() {},
      removeEventListener() {},
    }))
    render(
      <HoldToConfirm onConfirm={() => {}} duration={1000}>
        Delete
      </HoldToConfirm>,
    )
    fireEvent.pointerDown(screen.getByRole('button'), { button: 0 })
    await wait(500)
    expect(covered()).toBeGreaterThan(30)
    fireEvent.pointerLeave(screen.getByRole('button'))
    // Without the rewind animation it goes straight back.
    expect(covered()).toBe(0)
  })

  it('resets after confirming', async () => {
    render(
      <HoldToConfirm onConfirm={() => {}} duration={200} resetAfter={1000} confirmedLabel="Deleted">
        Delete
      </HoldToConfirm>,
    )
    const button = screen.getByRole('button')
    fireEvent.pointerDown(button, { button: 0 })
    await wait(300)
    expect(screen.getByRole('status').textContent).toBe('Deleted')
    await wait(1000)
    expect(button.dataset.state).toBe('idle')
  })

  it('describes how to use it', () => {
    render(<HoldToConfirm onConfirm={() => {}}>Delete</HoldToConfirm>)
    const id = screen.getByRole('button').getAttribute('aria-describedby') ?? ''
    expect(document.getElementById(id)?.textContent).toBe('Press and hold to confirm.')
  })
})
