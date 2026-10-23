import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { SwipeDeck } from './swipe-deck'

beforeAll(() => {
  // Reduced motion, so a card goes at once instead of after its flight.
  window.matchMedia = ((query: string) => ({
    matches: query.includes('reduce'),
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
})

const people = [
  { id: 'ana', name: 'Ana' },
  { id: 'leo', name: 'Leo' },
  { id: 'mia', name: 'Mia' },
]

function setup(props: { superLike?: boolean } = {}) {
  const onSwipe = vi.fn()
  const onUndo = vi.fn()
  render(
    <SwipeDeck items={people} onSwipe={onSwipe} onUndo={onUndo} empty="No one left" {...props}>
      {(person) => <h3>{person.name}</h3>}
    </SwipeDeck>,
  )
  const top = () =>
    screen
      .getAllByRole('heading', { hidden: true })
      .map((h) => h.closest('[data-slot=swipe-deck-card]') as HTMLElement)
      .find((card) => !card.hasAttribute('inert')) as HTMLElement
  return { onSwipe, onUndo, top }
}

const drag = async (el: HTMLElement, dx: number, dy: number, pause = 0) => {
  fireEvent.pointerDown(el, { pointerId: 1, clientX: 100, clientY: 100, pointerType: 'touch' })
  for (let i = 1; i <= 6; i++) {
    fireEvent.pointerMove(el, {
      pointerId: 1,
      clientX: 100 + (dx * i) / 6,
      clientY: 100 + (dy * i) / 6,
      pointerType: 'touch',
    })
  }
  // A finger that rests before lifting has no speed left to carry the card.
  if (pause) await new Promise((resolve) => setTimeout(resolve, pause))
  fireEvent.pointerUp(el, {
    pointerId: 1,
    clientX: 100 + dx,
    clientY: 100 + dy,
    pointerType: 'touch',
  })
}

describe('SwipeDeck', () => {
  it('likes, passes and undoes from its buttons, and says so', async () => {
    const user = userEvent.setup()
    const { onSwipe, onUndo, top } = setup()
    expect(top().textContent).toContain('Ana')
    expect(screen.getByRole('button', { name: 'Undo' })).toHaveProperty('disabled', true)

    await user.click(screen.getByRole('button', { name: 'Like' }))
    expect(onSwipe).toHaveBeenLastCalledWith(people[0], 'right')
    expect(screen.getByText('Liked')).toBeTruthy()
    expect(top().textContent).toContain('Leo')

    await user.click(screen.getByRole('button', { name: 'Nope' }))
    expect(onSwipe).toHaveBeenLastCalledWith(people[1], 'left')

    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(onUndo).toHaveBeenCalledWith(people[1], 'left')
    expect(top().textContent).toContain('Leo')
  })

  it('goes past the threshold, springs back short of it, and flies on a flick', async () => {
    const { onSwipe, top } = setup()
    // The stage falls back to 320px wide: the threshold is 96px.
    await drag(top(), 60, 0, 150)
    expect(onSwipe).not.toHaveBeenCalled()
    expect(top().style.transform).toContain('translate3d(0px, 0px, 0)')

    await drag(top(), -140, 10, 150)
    expect(onSwipe).toHaveBeenLastCalledWith(people[0], 'left')

    await drag(top(), 70, 0)
    expect(onSwipe).toHaveBeenLastCalledWith(people[1], 'right')
  })

  it('leaves a vertical press to the page, unless super like is on', async () => {
    const { onSwipe, top } = setup()
    await drag(top(), 0, -200)
    expect(onSwipe).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Super like' })).toBeNull()
  })

  it('swipes up for a super like, and takes the arrow keys', async () => {
    const { onSwipe, top } = setup({ superLike: true })
    await drag(top(), 10, -200, 150)
    expect(onSwipe).toHaveBeenLastCalledWith(people[0], 'up')

    fireEvent.keyDown(screen.getByRole('button', { name: 'Like' }), { key: 'ArrowLeft' })
    expect(onSwipe).toHaveBeenLastCalledWith(people[1], 'left')
    fireEvent.keyDown(screen.getByRole('button', { name: 'Like' }), { key: 'ArrowRight' })
    expect(onSwipe).toHaveBeenLastCalledWith(people[2], 'right')
    expect(screen.getByText('No one left')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Like' })).toHaveProperty('disabled', true)
  })
})
