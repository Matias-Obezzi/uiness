import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useIsland } from './context'
import { Island } from './island'
import { springEasing, springValue } from './spring'
import { createIsland } from './store'
import type { IslandStore } from './types'

let store: IslandStore

beforeEach(() => {
  store = createIsland()
})

afterEach(() => {
  vi.useRealTimers()
})

const box = () => document.querySelector<HTMLElement>('[data-uiness-island]') as HTMLElement

describe('store', () => {
  it('stacks entries and shows the last one', () => {
    const a = store.show({ leading: 'a' })
    const b = store.show({ content: 'b' })
    expect(store.getCurrent()?.id).toBe(b.id)
    expect(store.getStack()).toHaveLength(2)
    b.dismiss()
    expect(store.getCurrent()?.id).toBe(a.id)
    a.dismiss()
    expect(store.getCurrent()).toBeUndefined()
  })

  it('infers the mode and dismissible defaults', () => {
    store.show({ content: 'panel' })
    expect(store.getCurrent()).toMatchObject({ mode: 'expanded', dismissible: true })
    store.show({ leading: 'x', trailing: 'y' })
    expect(store.getCurrent()).toMatchObject({ mode: 'compact', dismissible: false })
  })

  it('updates in place when the id is reused', () => {
    store.show({ id: 'upload', leading: 'up', trailing: '10%' })
    store.show({ id: 'upload', leading: 'up', trailing: '50%' })
    expect(store.getStack()).toHaveLength(1)
    expect(store.getCurrent()?.trailing).toBe('50%')
  })

  it('auto dismisses after duration and supports pause and resume', () => {
    vi.useFakeTimers()
    const onDismiss = vi.fn()
    const handle = store.show({ content: 'bye', duration: 1000, onDismiss })
    vi.advanceTimersByTime(600)
    store.pause(handle.id)
    vi.advanceTimersByTime(2000)
    expect(onDismiss).not.toHaveBeenCalled()
    store.resume(handle.id)
    vi.advanceTimersByTime(399)
    expect(onDismiss).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(onDismiss).toHaveBeenCalledTimes(1)
    expect(store.getCurrent()).toBeUndefined()
  })

  it('notifies subscribers', () => {
    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)
    store.show({ content: 'x' })
    expect(listener).toHaveBeenCalledTimes(1)
    store.dismissAll()
    expect(listener).toHaveBeenCalledTimes(2)
    unsubscribe()
    store.show({ content: 'y' })
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('confirm resolves false when dismissed', async () => {
    const result = store.confirm({ title: 'Sure?' })
    expect(store.getCurrent()?.role).toBe('alertdialog')
    store.dismiss()
    await expect(result).resolves.toBe(false)
  })

  it('promise goes loading -> success -> gone', async () => {
    vi.useFakeTimers()
    let resolve: (value: string) => void = () => {}
    const pending = new Promise<string>((r) => {
      resolve = r
    })
    const tracked = store.promise(pending, {
      loading: 'Uploading',
      success: (name) => `Done ${name}`,
      successDuration: 500,
    })
    expect(store.getCurrent()).toMatchObject({ mode: 'compact', content: 'Uploading' })
    resolve('file.png')
    await tracked
    await Promise.resolve()
    expect(store.getCurrent()?.content).toBe('Done file.png')
    vi.advanceTimersByTime(500)
    expect(store.getCurrent()).toBeUndefined()
  })

  it('promise shows the error state on rejection', async () => {
    const failing = Promise.reject(new Error('nope'))
    const tracked = store.promise(failing, {
      loading: 'Saving',
      error: (e) => ({ content: `Failed: ${(e as Error).message}`, mode: 'expanded' }),
    })
    await expect(tracked).rejects.toThrow('nope')
    await Promise.resolve()
    expect(store.getCurrent()).toMatchObject({ mode: 'expanded', content: 'Failed: nope' })
  })
})

describe('spring', () => {
  it('produces a linear() or cubic-bezier easing that settles at 1', () => {
    const { easing, duration } = springEasing('smooth')
    expect(duration).toBeGreaterThan(100)
    expect(easing.startsWith('linear(') || easing.startsWith('cubic-bezier(')).toBe(true)
    if (easing.startsWith('linear(')) expect(easing.trim().endsWith('1)')).toBe(true)
    expect(springValue('smooth', 2)).toBeCloseTo(1, 2)
  })

  it('bouncy overshoots and stiff does not', () => {
    const bouncyPeak = Math.max(
      ...Array.from({ length: 40 }, (_, i) => springValue('bouncy', (i + 1) * 0.02)),
    )
    const stiffPeak = Math.max(
      ...Array.from({ length: 40 }, (_, i) => springValue('stiff', (i + 1) * 0.02)),
    )
    expect(bouncyPeak).toBeGreaterThan(1.02)
    expect(stiffPeak).toBeLessThan(1.02)
  })
})

describe('<Island>', () => {
  it('renders idle, then the entry, then idle again', () => {
    render(<Island store={store} idle={<span>idle</span>} />)
    expect(box().dataset.mode).toBe('idle')
    expect(screen.getByText('idle')).toBeTruthy()

    act(() => {
      store.show({ leading: <span>icon</span>, trailing: <span>42%</span> })
    })
    expect(box().dataset.mode).toBe('compact')
    expect(screen.getByText('42%')).toBeTruthy()

    act(() => store.dismissAll())
    expect(box().dataset.mode).toBe('idle')
  })

  it('hides completely when idle is false', () => {
    render(<Island store={store} idle={false} />)
    expect(box().style.visibility).toBe('hidden')
    act(() => {
      store.show({ content: 'hi' })
    })
    expect(box().style.visibility).toBe('')
  })

  it('dismisses on Escape and on outside pointer down', () => {
    vi.useFakeTimers()
    render(<Island store={store} />)
    act(() => {
      store.show({ content: <button type="button">inside</button> })
    })
    act(() => {
      vi.runOnlyPendingTimers()
    })
    fireEvent.pointerDown(screen.getByText('inside'))
    expect(store.getCurrent()).toBeDefined()
    fireEvent.pointerDown(document.body)
    expect(store.getCurrent()).toBeUndefined()

    act(() => {
      store.show({ content: 'again' })
    })
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(store.getCurrent()).toBeUndefined()
  })

  it('keeps compact entries on Escape unless dismissible', () => {
    render(<Island store={store} />)
    act(() => {
      store.show({ leading: 'x' })
    })
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(store.getCurrent()).toBeDefined()
  })

  it('confirm resolves true from the button and moves focus into the dialog', async () => {
    render(<Island store={store} />)
    let result: Promise<boolean> = Promise.resolve(false)
    act(() => {
      result = store.confirm({ title: 'Delete?', confirmText: 'Delete', destructive: true })
    })
    expect(box().getAttribute('role')).toBe('alertdialog')
    expect(document.activeElement?.textContent).toBe('Cancel')
    fireEvent.click(screen.getByText('Delete'))
    await expect(result).resolves.toBe(true)
    expect(store.getCurrent()).toBeUndefined()
  })

  it('pauses the timer on hover', () => {
    vi.useFakeTimers()
    render(<Island store={store} />)
    act(() => {
      store.alert({ title: 'Saved', duration: 1000 })
    })
    fireEvent.pointerEnter(box())
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(store.getCurrent()).toBeDefined()
    fireEvent.pointerLeave(box())
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(store.getCurrent()).toBeUndefined()
  })

  it('anchors to the safe area by default and to the edge on request', () => {
    const { unmount } = render(<Island store={store} offset={11} />)
    const layer = () =>
      document.querySelector<HTMLElement>('[data-uiness-island-layer]') as HTMLElement
    expect(layer().style.top).toContain('env(safe-area-inset-top')
    expect(layer().style.top).toContain('11px')
    unmount()
    render(<Island store={store} offset={11} anchor="edge" position="bottom" />)
    expect(layer().style.bottom).toBe('11px')
    expect(layer().style.top).toBe('')
  })

  it('hardware mode wraps the cutout, hides idle and stacks expanded content below', () => {
    render(<Island store={store} hardware />)
    const layer = document.querySelector<HTMLElement>('[data-uiness-island-layer]') as HTMLElement
    expect(layer.style.top).toBe('6px')
    expect(box().style.visibility).toBe('hidden')
    expect(box().style.boxShadow).toBe('none')

    act(() => {
      store.show({ leading: <span>L</span>, trailing: <span>a long trailing label</span> })
    })
    expect(box().style.visibility).toBe('')
    const content = box().querySelector<HTMLElement>('[data-island-content]') as HTMLElement
    expect(content.style.height).toBe('47px')
    expect(content.style.minWidth).toBe('136px')
    const spacer = box().querySelector<HTMLElement>('[data-island-spacer]') as HTMLElement
    expect(spacer.style.width).toBe('136px')
    const leading = box().querySelector<HTMLElement>('[data-island-leading]') as HTMLElement
    const trailing = box().querySelector<HTMLElement>('[data-island-trailing]') as HTMLElement
    expect(content.style.gridTemplateColumns).toBe('minmax(0, 1fr) auto minmax(0, 1fr)')
    expect(leading.style.justifySelf).toBe('start')
    expect(trailing.style.justifySelf).toBe('end')

    act(() => {
      store.show({ content: 'panel' })
    })
    const panel = box().querySelector<HTMLElement>('[data-island-content]') as HTMLElement
    expect(panel.style.padding).toContain('47px')
  })

  it('hardware mode accepts custom geometry', () => {
    render(<Island store={store} hardware={{ width: 100, height: 30, top: 20, margin: 4 }} />)
    const layer = document.querySelector<HTMLElement>('[data-uiness-island-layer]') as HTMLElement
    expect(layer.style.top).toBe('16px')
    act(() => {
      store.show({ leading: 'x' })
    })
    const spacer = box().querySelector<HTMLElement>('[data-island-spacer]') as HTMLElement
    expect(spacer.style.width).toBe('108px')
  })

  it('useIsland returns the store from context or the argument', () => {
    let seen: IslandStore | undefined
    function Probe() {
      seen = useIsland(store)
      return null
    }
    render(<Probe />)
    expect(seen).toBe(store)
  })
})
