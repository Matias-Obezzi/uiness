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

describe('store', () => {
  it('adds, updates in place and removes', () => {
    const id = toast('Saved')
    expect(store.getToasts()).toHaveLength(1)
    toast({ id, title: 'Saved twice', type: 'success' })
    expect(store.getToasts()).toHaveLength(1)
    expect(store.getToasts()[0]).toMatchObject({ title: 'Saved twice', type: 'success' })
    store.remove(id)
    expect(store.getToasts()).toHaveLength(0)
  })

  it('dismiss marks the toast as removing, then it is dropped', () => {
    vi.useFakeTimers()
    const onDismiss = vi.fn()
    const id = toast('Bye', { onDismiss })
    store.dismiss(id)
    expect(store.getToasts()[0]?.removing).toBe(true)
    vi.advanceTimersByTime(1000)
    expect(store.getToasts()).toHaveLength(0)
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('auto closes after the duration, loading toasts never do', () => {
    vi.useFakeTimers()
    const onAutoClose = vi.fn()
    toast('Quick', { duration: 500, onAutoClose })
    toast.loading('Working')
    vi.advanceTimersByTime(500)
    expect(onAutoClose).toHaveBeenCalledTimes(1)
    expect(store.getToasts().filter((t) => !t.removing)).toHaveLength(1)
    vi.advanceTimersByTime(60_000)
    expect(store.getToasts().some((t) => t.title === 'Working' && !t.removing)).toBe(true)
  })

  it('pause and resume keep the remaining time', () => {
    vi.useFakeTimers()
    toast('Paused', { duration: 1000 })
    vi.advanceTimersByTime(600)
    store.pause()
    vi.advanceTimersByTime(5000)
    expect(store.getToasts()[0]?.removing).toBeFalsy()
    store.resume()
    vi.advanceTimersByTime(399)
    expect(store.getToasts()[0]?.removing).toBeFalsy()
    vi.advanceTimersByTime(1)
    expect(store.getToasts()[0]?.removing).toBe(true)
  })

  it('promise goes loading -> success with the resolved value', async () => {
    const pending = Promise.resolve('report.pdf')
    await toast.promise(pending, { loading: 'Exporting', success: (name) => `Saved ${name}` })
    await Promise.resolve()
    expect(store.getToasts()[0]).toMatchObject({ type: 'success', title: 'Saved report.pdf' })
  })

  it('promise goes loading -> error', async () => {
    const failing = Promise.reject(new Error('Offline'))
    await expect(
      toast.promise(failing, { loading: 'Syncing', error: (e) => (e as Error).message }),
    ).rejects.toThrow('Offline')
    await Promise.resolve()
    expect(store.getToasts()[0]).toMatchObject({ type: 'error', title: 'Offline' })
  })

  it('toast.dismiss() with no id dismisses everything', () => {
    toast('a')
    toast('b')
    toast.dismiss()
    expect(store.getToasts().every((t) => t.removing)).toBe(true)
  })
})

describe('<Toaster>', () => {
  it('renders toasts with title, description and type', () => {
    render(<Toaster store={store} />)
    act(() => {
      toast.success('Saved', { description: 'All changes are in.' })
    })
    const item = screen.getByRole('status')
    expect(item.getAttribute('data-type')).toBe('success')
    expect(screen.getByText('Saved')).toBeTruthy()
    expect(screen.getByText('All changes are in.')).toBeTruthy()
  })

  it('close button and action dismiss the toast', () => {
    vi.useFakeTimers()
    const onClick = vi.fn()
    render(<Toaster store={store} closeButton />)
    act(() => {
      toast('Undo?', { action: { label: 'Undo', onClick } })
    })
    fireEvent.click(screen.getByText('Undo'))
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(store.getToasts()[0]?.removing).toBe(true)
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(store.getToasts()).toHaveLength(0)

    act(() => {
      toast('Closable')
    })
    fireEvent.click(screen.getByLabelText('Close'))
    expect(store.getToasts()[0]?.removing).toBe(true)
  })

  it('pauses timers while hovered', () => {
    vi.useFakeTimers()
    render(<Toaster store={store} duration={1000} />)
    act(() => {
      toast('Hover me')
    })
    const region = screen.getByLabelText('Notifications')
    fireEvent.pointerEnter(region)
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(store.getToasts()[0]?.removing).toBeFalsy()
    fireEvent.pointerLeave(region)
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(store.getToasts()[0]?.removing).toBe(true)
  })

  it('groups toasts by position', () => {
    render(<Toaster store={store} position="top-center" />)
    act(() => {
      toast('Top')
      toast('Bottom', { position: 'bottom-left' })
    })
    const regions = screen.getAllByLabelText('Notifications')
    expect(regions.map((r) => r.getAttribute('data-position')).sort()).toEqual([
      'bottom-left',
      'top-center',
    ])
  })

  it('custom render replaces the card', () => {
    render(<Toaster store={store} />)
    act(() => {
      toast.custom((t) => <div data-testid="custom">Hello {t.id}</div>)
    })
    expect(screen.getByTestId('custom').textContent).toContain('Hello toast-')
  })
})
