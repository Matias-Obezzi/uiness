import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TextMorph } from './text-morph'

const glyphs = () =>
  [
    ...document.querySelectorAll(
      '[data-slot=text-morph] > [aria-hidden] > span:first-child > span',
    ),
  ].map((g) => g.textContent)

afterEach(() => {
  vi.restoreAllMocks()
  // biome-ignore lint/suspicious/noExplicitAny: removing the stub put on the prototype below
  delete (HTMLElement.prototype as any).animate
  // biome-ignore lint/suspicious/noExplicitAny: same
  delete (HTMLElement.prototype as any).getAnimations
})

/** jsdom has no Web Animations; record the calls and finish each animation at once. */
function stubAnimations() {
  const calls: { el: Element; keyframes: Keyframe[] }[] = []
  HTMLElement.prototype.animate = function (keyframes) {
    calls.push({ el: this, keyframes: keyframes as Keyframe[] })
    const animation = { cancel() {}, onfinish: null as null | (() => void) }
    queueMicrotask(() => animation.onfinish?.())
    return animation as unknown as Animation
  }
  HTMLElement.prototype.getAnimations = () => []
  return calls
}

describe('TextMorph', () => {
  it('gives screen readers the plain text and draws a span per letter', () => {
    render(<TextMorph>Save now</TextMorph>)
    expect(screen.getByText('Save now', { selector: '.sr-only' })).toBeTruthy()
    expect(glyphs()).toEqual(['S', 'a', 'v', 'e', ' ', 'n', 'o', 'w'])
  })

  it('renders the element asked for', () => {
    render(<TextMorph as="h2">Title</TextMorph>)
    expect(screen.getByRole('heading', { level: 2 }).textContent).toContain('Title')
  })

  it('keeps shared letters, fades in new ones and lets removed ones leave', async () => {
    const calls = stubAnimations()
    const { rerender } = render(<TextMorph>Save</TextMorph>)
    const first = document.querySelector('[data-slot=text-morph] [aria-hidden] span span')
    rerender(<TextMorph>Saved</TextMorph>)
    expect(glyphs()).toEqual(['S', 'a', 'v', 'e', 'd'])
    // The S is the same element, not a new one.
    expect(document.querySelector('[data-slot=text-morph] [aria-hidden] span span')).toBe(first)
    const entering = calls.filter((c) => c.keyframes[0]?.opacity === 0)
    expect(entering.map((c) => c.el.textContent)).toEqual(['d'])

    rerender(<TextMorph>Sad</TextMorph>)
    const leaving = [...document.querySelectorAll('[data-slot=text-morph] .absolute')].map(
      (l) => l.textContent,
    )
    expect(leaving).toEqual(['v', 'e'])
    await vi.waitFor(() =>
      expect(document.querySelectorAll('[data-slot=text-morph] .absolute')).toHaveLength(0),
    )
  })
})
