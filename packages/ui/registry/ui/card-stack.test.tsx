import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CardStack } from './card-stack'

const stack = (onIndexChange?: (index: number) => void) => (
  <CardStack autoplay={false} duration={600} onIndexChange={onIndexChange}>
    <div>One</div>
    <div>Two</div>
    <div>Three</div>
  </CardStack>
)

afterEach(() => {
  vi.useRealTimers()
})

describe('CardStack', () => {
  it('goes forward and back with the arrow keys and reports the front card', () => {
    vi.useFakeTimers()
    const onIndexChange = vi.fn()
    render(stack(onIndexChange))
    const region = screen.getByRole('region', { name: 'Cards' })
    fireEvent.keyDown(region, { key: 'ArrowRight' })
    expect(onIndexChange).toHaveBeenLastCalledWith(1)
    act(() => {
      vi.advanceTimersByTime(300)
    })
    act(() => {
      vi.advanceTimersByTime(300)
    })
    fireEvent.keyDown(region, { key: 'ArrowLeft' })
    // Going back, the card comes to the front halfway through.
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(onIndexChange).toHaveBeenLastCalledWith(0)
  })

  it('always calls the latest onIndexChange, also from a running timer', () => {
    vi.useFakeTimers()
    const first = vi.fn()
    const second = vi.fn()
    const third = vi.fn()
    const { rerender } = render(stack(first))
    const region = screen.getByRole('region')

    rerender(stack(second))
    fireEvent.keyDown(region, { key: 'ArrowRight' })
    expect(second).toHaveBeenCalledWith(1)
    act(() => {
      vi.advanceTimersByTime(300)
    })
    act(() => {
      vi.advanceTimersByTime(300)
    })

    // The callback changes while the back toss is on its way.
    fireEvent.keyDown(region, { key: 'ArrowLeft' })
    rerender(stack(third))
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(third).toHaveBeenCalledWith(0)
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('tosses the front card on a swipe past the threshold', () => {
    const onIndexChange = vi.fn()
    render(stack(onIndexChange))
    const front = screen.getByRole('group', { name: '1 of 3' })
    fireEvent.pointerDown(front, { button: 0, clientX: 200, pointerId: 1 })
    fireEvent.pointerMove(front, { clientX: 100, pointerId: 1 })
    fireEvent.pointerUp(front, { pointerId: 1 })
    expect(onIndexChange).toHaveBeenCalledWith(1)
  })
})
