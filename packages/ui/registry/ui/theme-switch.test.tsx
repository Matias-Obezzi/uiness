import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import * as React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ThemeSwitch, useThemeTransition } from './theme-switch'

type Doc = { startViewTransition?: unknown }

const nativeAnimate = document.documentElement.animate

afterEach(() => {
  document.documentElement.animate = nativeAnimate
  delete (document as unknown as Doc).startViewTransition
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function Example({ variant }: { variant?: 'eclipse' | 'split' | 'rise' | 'fade' }) {
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light')
  return <ThemeSwitch theme={theme} onThemeChange={setTheme} variant={variant} />
}

/** A stand-in for the View Transitions API that runs the update and resolves at once. */
function fakeViewTransitions() {
  const animate = vi.fn()
  document.documentElement.animate = animate as unknown as typeof HTMLElement.prototype.animate
  const start = vi.fn((update: () => void) => {
    update()
    return { ready: Promise.resolve(), finished: Promise.resolve() }
  })
  ;(document as unknown as Doc).startViewTransition = start
  return { start, animate }
}

describe('ThemeSwitch', () => {
  it('is a switch that reports the theme', () => {
    render(<ThemeSwitch theme="dark" onThemeChange={() => {}} />)
    const button = screen.getByRole('switch', { name: 'Dark mode' })
    expect(button.getAttribute('aria-checked')).toBe('true')
  })

  it('switches instantly without the View Transitions API', () => {
    render(<Example />)
    const button = screen.getByRole('switch')
    fireEvent.click(button)
    expect(button.getAttribute('aria-checked')).toBe('true')
    fireEvent.click(button)
    expect(button.getAttribute('aria-checked')).toBe('false')
  })

  it('grows the new theme as a circle from the switch', async () => {
    const { start, animate } = fakeViewTransitions()
    render(<Example />)
    await act(async () => {
      fireEvent.click(screen.getByRole('switch'))
    })
    expect(start).toHaveBeenCalledOnce()
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('true')
    const [frames, options] = animate.mock.calls[0] ?? []
    expect(frames.clipPath[0]).toMatch(/^circle\(0px at/)
    expect(options.pseudoElement).toBe('::view-transition-new(root)')
    // The marker that turns off the default cross fade is cleaned up afterwards.
    expect(document.documentElement.dataset.themeTransition).toBeUndefined()
  })

  it.each([
    ['split', 'inset(0 50% 0 50%)'],
    ['rise', 'inset(100% 0 0 0)'],
  ] as const)('opens the %s variant from its edge', async (variant, from) => {
    const { animate } = fakeViewTransitions()
    render(<Example variant={variant} />)
    await act(async () => {
      fireEvent.click(screen.getByRole('switch'))
    })
    expect(animate.mock.calls[0]?.[0].clipPath[0]).toBe(from)
  })

  it('skips the animation with reduced motion', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('reduced-motion'),
      media: query,
      addEventListener() {},
      removeEventListener() {},
    }))
    const { start } = fakeViewTransitions()
    render(<Example />)
    await act(async () => {
      fireEvent.click(screen.getByRole('switch'))
    })
    expect(start).not.toHaveBeenCalled()
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('true')
  })
})

describe('useThemeTransition', () => {
  it('runs the update even when the browser skips the transition', async () => {
    const update = vi.fn()
    ;(document as unknown as Doc).startViewTransition = (fn: () => void) => {
      fn()
      const skipped = Promise.reject(new Error('skipped'))
      skipped.catch(() => {})
      return { ready: skipped, finished: skipped }
    }
    const { result } = renderHook(() => useThemeTransition())
    await act(() => result.current(update, { variant: 'fade' }))
    expect(update).toHaveBeenCalledOnce()
    expect(document.documentElement.dataset.themeTransition).toBeUndefined()
  })
})
