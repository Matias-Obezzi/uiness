import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import * as React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAutoResizeTextarea } from './use-auto-resize-textarea'
import { useClickOutside } from './use-click-outside'
import { useCopyToClipboard } from './use-copy-to-clipboard'
import { useIsMobile } from './use-mobile'

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('useAutoResizeTextarea', () => {
  function Area() {
    const { textareaRef, adjustHeight } = useAutoResizeTextarea({ minHeight: 40, maxHeight: 120 })
    return <textarea ref={textareaRef} aria-label="Message" onChange={() => adjustHeight()} />
  }

  it('grows with the text up to the maximum', () => {
    render(<Area />)
    const area = screen.getByLabelText('Message') as HTMLTextAreaElement
    expect(area.style.height).toBe('40px')
    Object.defineProperty(area, 'scrollHeight', { configurable: true, value: 90 })
    fireEvent.change(area, { target: { value: 'two\nlines' } })
    expect(area.style.height).toBe('90px')
    Object.defineProperty(area, 'scrollHeight', { configurable: true, value: 400 })
    fireEvent.change(area, { target: { value: 'many\nlines' } })
    expect(area.style.height).toBe('120px')
  })
})

describe('useClickOutside', () => {
  it('calls the handler for presses outside only', () => {
    const handler = vi.fn()
    function Box() {
      const ref = React.useRef<HTMLDivElement>(null)
      useClickOutside(ref, handler)
      return (
        <>
          <div ref={ref}>
            <button type="button">Inside</button>
          </div>
          <button type="button">Outside</button>
        </>
      )
    }
    render(<Box />)
    fireEvent.pointerDown(screen.getByText('Inside'))
    expect(handler).not.toHaveBeenCalled()
    fireEvent.pointerDown(screen.getByText('Outside'))
    expect(handler).toHaveBeenCalledTimes(1)
  })
})

describe('useCopyToClipboard', () => {
  it('copies and clears the flag after the timeout', async () => {
    vi.useFakeTimers()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    const { result } = renderHook(() => useCopyToClipboard({ timeout: 1000 }))
    let ok = false
    await act(async () => {
      ok = await result.current.copy('hello')
    })
    expect(ok).toBe(true)
    expect(writeText).toHaveBeenCalledWith('hello')
    expect(result.current.copied).toBe(true)
    act(() => vi.advanceTimersByTime(1000))
    expect(result.current.copied).toBe(false)
  })

  it('reports a copy that failed', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'))
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    // jsdom has no execCommand, so the fallback fails too.
    const { result } = renderHook(() => useCopyToClipboard())
    let ok = true
    await act(async () => {
      ok = await result.current.copy('hello')
    })
    expect(ok).toBe(false)
    expect(result.current.copied).toBe(false)
  })
})

describe('useIsMobile', () => {
  it('follows the media query', () => {
    let matches = true
    const listeners = new Set<() => void>()
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches,
      media: query,
      addEventListener: (_: string, fn: () => void) => listeners.add(fn),
      removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
    }))
    const { result } = renderHook(() => useIsMobile(640))
    expect(result.current).toBe(true)
    matches = false
    act(() => {
      for (const fn of listeners) fn()
    })
    expect(result.current).toBe(false)
    vi.unstubAllGlobals()
  })
})
