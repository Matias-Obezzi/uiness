import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { formatKey, Kbd, KbdGroup, parseShortcut } from './kbd'

afterEach(() => {
  vi.unstubAllGlobals()
})

const shown = (el: HTMLElement) =>
  Array.from(el.querySelectorAll('[data-slot=kbd] [aria-hidden]')).map((s) => s.textContent)

describe('parseShortcut', () => {
  it('splits on plus, and reads a trailing ++ as the plus key', () => {
    expect(parseShortcut('mod+shift+k')).toEqual(['mod', 'shift', 'k'])
    expect(parseShortcut('mod++')).toEqual(['mod', 'plus'])
  })
})

describe('formatKey', () => {
  it('spells modifiers for each platform', () => {
    expect(formatKey('mod', true)).toEqual({ symbol: '⌘', name: 'Command' })
    expect(formatKey('mod', false)).toEqual({ symbol: 'Ctrl', name: 'Control' })
    expect(formatKey('alt', true).symbol).toBe('⌥')
    expect(formatKey('k', false)).toEqual({ symbol: 'K', name: 'K' })
    expect(formatKey('F5', false).symbol).toBe('F5')
  })
})

describe('Kbd', () => {
  it('renders a key cap', () => {
    render(<Kbd>Esc</Kbd>)
    const kbd = screen.getByText('Esc')
    expect(kbd.tagName).toBe('KBD')
    expect(kbd.dataset.slot).toBe('kbd')
  })
})

describe('KbdGroup', () => {
  it('shows ⌘ on a Mac, without separators', () => {
    const { container } = render(<KbdGroup keys="mod+k" platform="mac" />)
    const group = container.firstElementChild as HTMLElement
    expect(group.tagName).toBe('KBD')
    expect(shown(group)).toEqual(['⌘', 'K'])
    expect(group.textContent).not.toContain('+')
  })

  it('shows Ctrl elsewhere, joined by +', () => {
    const { container } = render(<KbdGroup keys="mod+shift+p" platform="other" />)
    const group = container.firstElementChild as HTMLElement
    expect(shown(group)).toEqual(['Ctrl', 'Shift', 'P'])
    expect(group.querySelectorAll('[aria-hidden]').length).toBe(5)
  })

  // A symbol like ⌘ reads as "place of interest sign"; the key's name is what gets said.
  it('gives screen readers the names of the keys', () => {
    const { container } = render(<KbdGroup keys="mod+enter" platform="mac" />)
    const said = Array.from(container.querySelectorAll('.sr-only')).map((s) => s.textContent)
    expect(said).toEqual(['Command', 'Return'])
  })

  it('detects a Mac from the platform', () => {
    vi.stubGlobal('navigator', { ...navigator, platform: 'MacIntel', userAgent: 'Macintosh' })
    const { container } = render(<KbdGroup keys="mod+k" />)
    expect(shown(container.firstElementChild as HTMLElement)).toEqual(['⌘', 'K'])
  })

  it('composes its own Kbd children', () => {
    render(
      <KbdGroup>
        <Kbd>G</Kbd>
        <Kbd>I</Kbd>
      </KbdGroup>,
    )
    expect(screen.getByText('G').parentElement?.dataset.slot).toBe('kbd-group')
  })
})
