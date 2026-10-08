import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createToast, createToastStore, type ToastFunction } from './store'
import { Toaster } from './toaster'
import type { ToastStore } from './types'

let store: ToastStore
let toast: ToastFunction

beforeEach(() => {
  store = createToastStore()
  toast = createToast(store)
})

afterEach(() => {
  vi.useRealTimers()
})

const live = () => store.getToasts().filter((t) => !t.removing)

describe('a toast brought back while leaving', () => {
  it('stays, and gets a new timer', () => {
    vi.useFakeTimers()
    const id = toast('Uploading', { duration: 2000 })
    toast.dismiss(id)
    vi.advanceTimersByTime(500)
    toast.update(id, { title: 'Uploaded' })
    // The dismiss's clean up must not take the revived toast away.
    vi.advanceTimersByTime(600)
    expect(live().map((t) => t.title)).toEqual(['Uploaded'])
    // And it leaves on its own again.
    vi.advanceTimersByTime(2000)
    expect(live()).toHaveLength(0)
  })
})

describe('dedupe', () => {
  it('folds identical toasts into one that counts up and starts its time again', () => {
    vi.useFakeTimers()
    const first = toast.error('Could not save', { duration: 1000 })
    vi.advanceTimersByTime(800)
    const second = toast.error('Could not save', { duration: 1000 })
    expect(second).toBe(first)
    expect(live()).toHaveLength(1)
    expect(live()[0]?.count).toBe(2)
    vi.advanceTimersByTime(800)
    expect(live()).toHaveLength(1)
    vi.advanceTimersByTime(200)
    expect(live()).toHaveLength(0)
  })

  it('keeps apart different types, descriptions, ids and opt-outs', () => {
    toast.error('Could not save')
    toast.success('Could not save')
    toast.error('Could not save', { description: 'Disk full' })
    toast.error('Could not save', { id: 'mine' })
    toast.error('Could not save', { dedupe: false })
    expect(live()).toHaveLength(5)
  })

  it('shows the count on the card', () => {
    render(<Toaster store={store} />)
    act(() => {
      toast('Copied')
      toast('Copied')
      toast('Copied')
    })
    expect(screen.getByText('×3')).toBeTruthy()
  })
})

describe('undo', () => {
  it('resolves true from the button and false when it runs out', async () => {
    vi.useFakeTimers()
    render(<Toaster store={store} />)
    let undone: Promise<boolean> = Promise.resolve(false)
    act(() => {
      undone = toast.undo('Task deleted')
    })
    fireEvent.click(screen.getByText('Undo'))
    act(() => vi.advanceTimersByTime(1000))
    await expect(undone).resolves.toBe(true)

    act(() => {
      undone = toast.undo('Task deleted', { duration: 1000 })
    })
    act(() => vi.advanceTimersByTime(3000))
    await expect(undone).resolves.toBe(false)
  })

  it('never folds two undos together', () => {
    toast.undo('Task deleted')
    toast.undo('Task deleted')
    expect(live()).toHaveLength(2)
  })
})

describe('update and isActive', () => {
  it('change a toast in place and tell whether it is showing', () => {
    vi.useFakeTimers()
    const id = toast('Working')
    expect(toast.isActive(id)).toBe(true)
    toast.update(id, { title: 'Done', type: 'success' })
    expect(live()[0]).toMatchObject({ title: 'Done', type: 'success' })
    toast.dismiss(id)
    expect(toast.isActive(id)).toBe(false)
    expect(toast.isActive('nope')).toBe(false)
  })
})

describe('progress bar', () => {
  const bar = () => document.querySelector<HTMLElement>('[data-toast-progress]')

  it('runs for the toast duration, waits on hover and starts over on update', () => {
    render(<Toaster store={store} progress duration={3000} />)
    let id = ''
    act(() => {
      id = toast('Saved')
    })
    expect(bar()?.style.animation).toContain('3000ms')
    expect(bar()?.style.animationPlayState).toBe('running')
    fireEvent.pointerEnter(document.querySelector('[data-uiness-toaster]') as Element)
    expect(bar()?.style.animationPlayState).toBe('paused')
    const before = bar()
    act(() => toast.update(id, { duration: 5000 }))
    expect(bar()).not.toBe(before)
    expect(bar()?.style.animation).toContain('5000ms')
  })

  it('is off by default and for toasts without an end', () => {
    render(<Toaster store={store} />)
    act(() => {
      toast('Saved')
    })
    expect(bar()).toBeNull()
    act(() => {
      toast.loading('Working', { progress: true })
    })
    expect(bar()).toBeNull()
  })
})

describe('hotkey', () => {
  it('moves focus to the toasts, which open up and wait', () => {
    vi.useFakeTimers()
    const onAutoClose = vi.fn()
    render(<Toaster store={store} />)
    act(() => {
      toast('Saved', { duration: 1000, onAutoClose })
    })
    const region = document.querySelector('[data-uiness-toaster]') as HTMLElement
    expect(region.getAttribute('aria-keyshortcuts')).toBe('Alt+T')
    fireEvent.keyDown(document, { code: 'KeyT', altKey: true })
    expect(document.activeElement).toBe(region)
    expect(region.hasAttribute('data-expanded')).toBe(true)
    act(() => vi.advanceTimersByTime(5000))
    expect(onAutoClose).not.toHaveBeenCalled()
    fireEvent.blur(region)
    act(() => vi.advanceTimersByTime(1000))
    expect(onAutoClose).toHaveBeenCalledTimes(1)
  })

  it('can be changed or turned off', () => {
    render(<Toaster store={store} hotkey={false} />)
    act(() => {
      toast('Saved')
    })
    const region = document.querySelector('[data-uiness-toaster]') as HTMLElement
    expect(region.hasAttribute('aria-keyshortcuts')).toBe(false)
    fireEvent.keyDown(document, { code: 'KeyT', altKey: true })
    expect(document.activeElement).not.toBe(region)
  })
})
