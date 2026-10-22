import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Stories, type StoryGroup } from './stories'

const groups: StoryGroup[] = [
  {
    id: 'ana',
    name: 'Ana',
    stories: [
      { id: 'a1', content: <p>Ana one</p> },
      { id: 'a2', content: <p>Ana two</p>, duration: 2000 },
    ],
  },
  { id: 'leo', name: 'Leo', stories: [{ id: 'l1', content: <p>Leo one</p> }] },
]

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

describe('Stories', () => {
  it('rings the people with new stories and plays them in order, on to the next person', () => {
    const onSeen = vi.fn()
    render(<Stories groups={groups} defaultSeen={['l1']} onSeen={onSeen} />)
    expect(screen.getByRole('list', { name: 'Stories' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Leo' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Ana, new stories' }))
    expect(screen.getByRole('dialog', { name: 'Ana, story 1 of 2' }).textContent).toContain(
      'Ana one',
    )
    expect(onSeen).toHaveBeenLastCalledWith(groups[0]?.stories[0], groups[0])

    // Five seconds by default, then the next story by itself.
    act(() => vi.advanceTimersByTime(5000))
    expect(screen.getByRole('dialog').textContent).toContain('Ana two')
    act(() => vi.advanceTimersByTime(2000))
    expect(screen.getByRole('dialog', { name: 'Leo, story 1 of 1' })).toBeTruthy()
    // Seen ones are not reported again.
    expect(onSeen).toHaveBeenCalledTimes(2)

    act(() => vi.advanceTimersByTime(5000))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('button', { name: 'Ana' })).toBeTruthy()
  })

  it('taps forward and back, and holds to pause', () => {
    render(<Stories groups={groups} />)
    fireEvent.click(screen.getByRole('button', { name: 'Ana, new stories' }))
    const next = screen.getByRole('button', { name: 'Next story' })
    fireEvent.pointerDown(next)
    fireEvent.pointerUp(next)
    fireEvent.click(next)
    expect(screen.getByRole('dialog').textContent).toContain('Ana two')

    fireEvent.click(screen.getByRole('button', { name: 'Previous story' }))
    expect(screen.getByRole('dialog').textContent).toContain('Ana one')

    // Held: it stays, and the click that ends the hold does not move on.
    fireEvent.pointerDown(next)
    act(() => vi.advanceTimersByTime(300))
    act(() => vi.advanceTimersByTime(6000))
    fireEvent.pointerUp(next)
    fireEvent.click(next)
    expect(screen.getByRole('dialog').textContent).toContain('Ana one')
  })

  it('takes the arrow keys and space, and closes from its button', () => {
    render(<Stories groups={groups} />)
    fireEvent.click(screen.getByRole('button', { name: 'Ana, new stories' }))
    const dialog = screen.getByRole('dialog')
    fireEvent.keyDown(screen.getByRole('button', { name: 'Pause' }), { key: 'ArrowRight' })
    expect(dialog.textContent).toContain('Ana two')
    fireEvent.keyDown(screen.getByRole('region', { name: 'Ana, story 2 of 2' }), { key: ' ' })
    expect(screen.getByRole('button', { name: 'Play' })).toBeTruthy()
    act(() => vi.advanceTimersByTime(10000))
    expect(dialog.textContent).toContain('Ana two')

    fireEvent.click(screen.getByRole('button', { name: 'Close stories' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
