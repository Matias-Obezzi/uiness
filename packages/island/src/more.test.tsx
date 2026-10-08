import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Island } from './island'
import { createIsland } from './store'
import type { IslandStore } from './types'

let store: IslandStore

beforeEach(() => {
  store = createIsland()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('timers under other entries', () => {
  it('waits while covered and counts the rest once on top again', () => {
    vi.useFakeTimers()
    const onDismiss = vi.fn()
    store.show({ content: 'saved', duration: 1000, onDismiss })
    vi.advanceTimersByTime(400)
    const cover = store.show({ content: 'something else' })
    // Covered for much longer than it had left: it must not expire unseen.
    vi.advanceTimersByTime(5000)
    expect(onDismiss).not.toHaveBeenCalled()
    cover.dismiss()
    vi.advanceTimersByTime(599)
    expect(onDismiss).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('stays held by the pointer even when the stack changes under it', () => {
    vi.useFakeTimers()
    const onDismiss = vi.fn()
    const entry = store.show({ content: 'hovered', duration: 500, onDismiss })
    store.pause(entry.id)
    store.show({ content: 'on top' }).dismiss()
    vi.advanceTimersByTime(2000)
    expect(onDismiss).not.toHaveBeenCalled()
    store.resume(entry.id)
    vi.advanceTimersByTime(500)
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})

describe('prompt', () => {
  it('resolves the typed text, and null when cancelled', async () => {
    render(<Island store={store} />)
    let answer: Promise<string | null> = Promise.resolve(null)
    act(() => {
      answer = store.prompt({ title: 'Name the board', defaultValue: 'Roadmap' })
    })
    const input = screen.getByRole('textbox', { name: 'Name the board' }) as HTMLInputElement
    expect(document.activeElement).toBe(input)
    fireEvent.change(input, { target: { value: 'Q4 plan' } })
    fireEvent.click(screen.getByText('OK'))
    await expect(answer).resolves.toBe('Q4 plan')
    expect(store.getCurrent()).toBeUndefined()

    act(() => {
      answer = store.prompt({ title: 'Again' })
    })
    fireEvent.click(screen.getByText('Cancel'))
    await expect(answer).resolves.toBeNull()
  })
})

describe('choose', () => {
  it('resolves the picked value, and null when dismissed', async () => {
    render(<Island store={store} />)
    let picked: Promise<number | null> = Promise.resolve(null)
    act(() => {
      picked = store.choose({
        title: 'Export as',
        choices: [
          { label: 'PDF', value: 1 },
          { label: 'PNG', value: 2 },
        ],
      })
    })
    fireEvent.click(screen.getByText('PNG'))
    await expect(picked).resolves.toBe(2)

    act(() => {
      picked = store.choose({ title: 'Again', choices: [{ label: 'PDF', value: 1 }] })
    })
    act(() => store.dismiss())
    await expect(picked).resolves.toBeNull()
  })
})

describe('undo', () => {
  it('resolves true when undone and false when it runs out', async () => {
    vi.useFakeTimers()
    render(<Island store={store} />)
    let undone: Promise<boolean> = Promise.resolve(false)
    act(() => {
      undone = store.undo('Task deleted')
    })
    fireEvent.click(screen.getByText('Undo'))
    await expect(undone).resolves.toBe(true)

    act(() => {
      undone = store.undo('Task deleted', { duration: 1000 })
    })
    act(() => vi.advanceTimersByTime(1000))
    await expect(undone).resolves.toBe(false)
  })
})

describe('progress', () => {
  it('fills the ring, then shows a check and leaves', () => {
    vi.useFakeTimers()
    render(<Island store={store} />)
    let handle = undefined as ReturnType<IslandStore['progress']> | undefined
    act(() => {
      handle = store.progress({ content: 'Uploading', value: 0 })
    })
    act(() => handle?.set(0.4))
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('40')
    act(() => handle?.done({ content: 'Uploaded' }))
    expect(screen.queryByRole('progressbar')).toBeNull()
    expect(screen.getByText('Uploaded')).toBeTruthy()
    act(() => vi.advanceTimersByTime(2000))
    expect(store.getCurrent()).toBeUndefined()
  })
})

describe('timer', () => {
  it('counts down, calls onEnd at zero and leaves', () => {
    vi.useFakeTimers()
    render(<Island store={store} />)
    const onEnd = vi.fn()
    act(() => {
      store.timer({ content: 'Break', seconds: 90, onEnd })
    })
    expect(screen.getByText('1:30')).toBeTruthy()
    act(() => vi.advanceTimersByTime(31_000))
    expect(screen.getByText('0:59')).toBeTruthy()
    // Hovering does not stop a countdown.
    store.pause(store.getCurrent()?.id ?? '')
    act(() => vi.advanceTimersByTime(59_000))
    expect(onEnd).toHaveBeenCalledTimes(1)
    expect(store.getCurrent()).toBeUndefined()
  })
})
