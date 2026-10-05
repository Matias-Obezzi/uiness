import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ExpandableCard,
  ExpandableCardContent,
  ExpandableCardDescription,
  ExpandableCardTitle,
  ExpandableCardTrigger,
} from './expandable-card'

function Example({
  open,
  onOpenChange,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  return (
    <ExpandableCard open={open} onOpenChange={onOpenChange}>
      <ExpandableCardTrigger>
        <img src="/a.png" alt="" />
        Northern lights
      </ExpandableCardTrigger>
      <ExpandableCardContent>
        <img src="/a.png" alt="" />
        <ExpandableCardTitle>Northern lights over Tromsø</ExpandableCardTitle>
        <ExpandableCardDescription>Shot in January.</ExpandableCardDescription>
        <button type="button">Download</button>
      </ExpandableCardContent>
    </ExpandableCard>
  )
}

describe('ExpandableCard', () => {
  // Without Web Animations (as in jsdom) it opens and closes at once; this checks the behaviour
  // the animation decorates: a named dialog, focus moved in, and focus back on the card.
  it('opens a named dialog from the card and returns focus on Escape', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<Example onOpenChange={onOpenChange} />)
    const card = screen.getByRole('button', { name: 'Northern lights' })
    expect(card.getAttribute('aria-haspopup')).toBe('dialog')

    await user.click(card)
    const dialog = screen.getByRole('dialog', { name: 'Northern lights over Tromsø' })
    expect(dialog.contains(document.activeElement)).toBe(true)
    expect(card.dataset.expanded).toBe('true')
    expect(onOpenChange).toHaveBeenLastCalledWith(true)

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    expect(document.activeElement).toBe(card)
    expect(card.dataset.expanded).toBeUndefined()
  })

  it('closes from its close button', async () => {
    const user = userEvent.setup()
    render(<Example />)
    await user.click(screen.getByRole('button', { name: 'Northern lights' }))
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

interface FakeAnimation {
  el: Element
  frames: Keyframe[]
  options: KeyframeAnimationOptions
  finish: () => void
  cancelled: boolean
}

/** Records each animation and leaves it running until the test finishes it. */
function stubAnimations() {
  const animations: FakeAnimation[] = []
  HTMLElement.prototype.animate = function (frames, options) {
    let resolve = () => {}
    let reject = (_: unknown) => {}
    const finished = new Promise<void>((res, rej) => {
      resolve = res
      reject = rej
    })
    finished.catch(() => {})
    const record: FakeAnimation = {
      el: this,
      frames: frames as Keyframe[],
      options: options as KeyframeAnimationOptions,
      finish: resolve,
      cancelled: false,
    }
    animations.push(record)
    return {
      finished,
      cancel() {
        record.cancelled = true
        reject(new DOMException('cancelled', 'AbortError'))
      },
    } as unknown as Animation
  }
  // The card sits in the grid; the view lands in the middle of the screen.
  const rects: Record<string, [number, number, number, number]> = {
    'expandable-card-trigger': [40, 300, 200, 240],
    'expandable-card-content': [200, 80, 640, 560],
  }
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const slot = (this as HTMLElement).dataset?.slot ?? ''
    const [x, y, w, h] = rects[slot] ?? [0, 0, 100, 100]
    return new DOMRect(x, y, w, h)
  })
  const live = () => animations.filter((a) => !a.cancelled)
  const finishAll = () =>
    act(async () => {
      for (const a of live()) a.finish()
      await new Promise((r) => setTimeout(r, 0))
    })
  const surface = () =>
    live().find((a) => a.el.getAttribute('data-slot') === 'expandable-card-content')
  return { animations, live, finishAll, surface }
}

describe('ExpandableCard morph', () => {
  afterEach(() => {
    // biome-ignore lint/suspicious/noExplicitAny: jsdom has no Web Animations to restore
    delete (HTMLElement.prototype as any).animate
    vi.restoreAllMocks()
  })

  it('grows the view out of the card and hides the card while it is open', async () => {
    const motion = stubAnimations()
    const user = userEvent.setup()
    render(<Example />)
    const card = screen.getByRole('button', { name: 'Northern lights' })
    await user.click(card)

    const grow = motion.surface()
    expect(grow?.frames[0]).toMatchObject({ top: '300px', left: '40px', width: '200px' })
    expect(grow?.frames.at(-1)).toMatchObject({ top: '80px', left: '200px', width: '640px' })
    expect(card.dataset.hidden).toBe('true')
    // A copy of the card rides over the view while it moves, and goes once it has landed.
    expect(document.querySelector('[data-slot=expandable-card-ghost]')).not.toBeNull()
    await motion.finishAll()
    expect(document.querySelector('[data-slot=expandable-card-ghost]')).toBeNull()
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('reads duration tokens in seconds, as minified CSS writes them', async () => {
    // `300ms` comes out of a production build as `.3s`.
    document.documentElement.style.setProperty('--duration-slow', '.3s')
    try {
      const motion = stubAnimations()
      const user = userEvent.setup()
      render(<Example />)
      await user.click(screen.getByRole('button', { name: 'Northern lights' }))
      expect(motion.surface()?.options.duration).toBeCloseTo(420)
    } finally {
      document.documentElement.style.removeProperty('--duration-slow')
    }
  })

  it('folds back from wherever it is when closed while still growing', async () => {
    const motion = stubAnimations()
    const user = userEvent.setup()
    render(<Example />)
    const card = screen.getByRole('button', { name: 'Northern lights' })
    await user.click(card)
    const grow = motion.surface()

    await user.keyboard('{Escape}')
    expect(grow?.cancelled).toBe(true)
    const fold = motion.surface()
    expect(fold).not.toBe(grow)
    expect(fold?.frames.at(-1)).toMatchObject({ top: '300px', left: '40px', width: '200px' })
    // Still on screen, folding, with the card hidden under it until it lands.
    expect(screen.getByRole('dialog').dataset.closing).toBe('true')
    expect(card.dataset.hidden).toBe('true')

    await motion.finishAll()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(card.dataset.hidden).toBeUndefined()
    await waitFor(() => expect(document.activeElement).toBe(card))
  })

  it('grows again when opened while folding back', async () => {
    const motion = stubAnimations()
    const { rerender } = render(<Example open />)
    await motion.finishAll()

    rerender(<Example open={false} />)
    const fold = motion.surface()
    expect(fold?.frames.at(-1)).toMatchObject({ top: '300px' })

    rerender(<Example open />)
    expect(fold?.cancelled).toBe(true)
    expect(motion.surface()?.frames.at(-1)).toMatchObject({ top: '80px' })
    await motion.finishAll()
    const dialog = screen.getByRole('dialog')
    expect(dialog.dataset.closing).toBeUndefined()
    expect(document.querySelector('[data-slot=expandable-card-ghost]')).toBeNull()
  })
})
