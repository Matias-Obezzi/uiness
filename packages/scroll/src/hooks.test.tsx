import { act, render, screen } from '@testing-library/react'
import { useRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useActiveSection, useParallax, useScrollProgress } from './hooks'

afterEach(() => {
  vi.useRealTimers()
})

const box = (top: number, height = 400) =>
  ({ top, height, bottom: top + height, left: 0, width: 100, right: 100 }) as DOMRect

function Progress() {
  const ref = useRef<HTMLDivElement>(null)
  const p = useScrollProgress(ref)
  return (
    <div ref={ref} data-testid="box">
      {p.toFixed(2)}
    </div>
  )
}

function Parallax({ speed }: { speed: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useParallax(ref, { speed })
  return <div ref={ref} data-testid="para" />
}

function Sections() {
  const ref = useRef<HTMLDivElement>(null)
  const active = useActiveSection(ref, { anchor: 0.5 })
  return (
    <div>
      <div ref={ref}>
        <section data-testid="s0" />
        <section data-testid="s1" />
        <section data-testid="s2" />
      </div>
      <output>{active}</output>
    </div>
  )
}

describe('useScrollProgress', () => {
  it('starts with the current value and follows scroll', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] })
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })
    const spy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(box(800))
    render(<Progress />)
    expect(screen.getByTestId('box').textContent).toBe('0.00')
    spy.mockReturnValue(box(200))
    act(() => {
      window.dispatchEvent(new Event('scroll'))
      vi.advanceTimersByTime(20)
    })
    expect(screen.getByTestId('box').textContent).toBe('0.50')
    spy.mockRestore()
  })
})

describe('useParallax', () => {
  it('writes a translate to the element instead of rendering', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] })
    Object.defineProperty(window, 'innerHeight', { value: 1000, configurable: true })
    const spy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(box(1000))
    render(<Parallax speed={0.2} />)
    const el = screen.getByTestId('para')
    // progress 0: (0.5 - 0) * 0.2 * 1000
    expect(el.style.translate).toBe('0 100.00px')
    spy.mockReturnValue(box(-400))
    act(() => {
      window.dispatchEvent(new Event('scroll'))
      vi.advanceTimersByTime(20)
    })
    expect(el.style.translate).toBe('0 -100.00px')
    spy.mockRestore()
  })
})

describe('useActiveSection', () => {
  it('reports the child under the middle of the viewport', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] })
    Object.defineProperty(window, 'innerHeight', { value: 1000, configurable: true })
    const tops = [0, 400, 800]
    let shift = 0
    const spy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function (this: HTMLElement) {
        const i = Number(this.dataset.testid?.slice(1) ?? 0)
        return box((tops[i] ?? 0) - shift, 400)
      })
    render(<Sections />)
    expect(screen.getByRole('status').textContent).toBe('1')
    shift = 800
    act(() => {
      window.dispatchEvent(new Event('scroll'))
      vi.advanceTimersByTime(20)
    })
    expect(screen.getByRole('status').textContent).toBe('2')
    spy.mockRestore()
  })
})
