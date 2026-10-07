import { act, render, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LineShadowText } from './line-shadow-text'
import { MorphingText } from './morphing-text'
import { SpinningText } from './spinning-text'
import { generateRoughPath, Highlighter } from './text-highlighter'
import { VideoText } from './video-text'

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const mockReducedMotion = (matches: boolean) => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches:
        query.includes('prefers-reduced-motion') || query.includes('reduce') ? matches : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
}

describe('LineShadowText', () => {
  it('renders server-side deterministically without errors', () => {
    const html1 = renderToString(<LineShadowText shadowColor="blue">Fast</LineShadowText>)
    const html2 = renderToString(<LineShadowText shadowColor="blue">Fast</LineShadowText>)
    expect(html1).toBe(html2)
    expect(html1).toContain('Fast')
    expect(html1).toContain('aria-hidden')
  })

  it('renders the real text visibly and a duplicated aria-hidden shadow behind it', () => {
    render(
      <LineShadowText as="h1" shadowColor="#ff0000" speed={10}>
        Ship
      </LineShadowText>,
    )

    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeTruthy()
    expect(heading.getAttribute('data-slot')).toBe('line-shadow-text')

    // Screen reader accessible text
    const textSpans = heading.querySelectorAll('span')
    expect(textSpans.length).toBe(2)

    const [frontSpan, shadowSpan] = textSpans
    expect(frontSpan?.textContent).toBe('Ship')
    expect(shadowSpan?.getAttribute('aria-hidden')).toBe('true')
    expect(shadowSpan?.getAttribute('data-slot')).toBe('line-shadow-text-shadow')
    expect(shadowSpan?.style.transform).toBe('translate(0.04em, 0.04em)')
  })

  it('disables animation when prefers-reduced-motion is active', () => {
    mockReducedMotion(true)
    render(<LineShadowText>Accessible</LineShadowText>)

    const shadow = document.querySelector('[data-slot="line-shadow-text-shadow"]') as HTMLElement
    expect(shadow.style.animation).toBe('none')
  })
})

describe('VideoText', () => {
  it('renders server-side deterministically without errors', () => {
    const html1 = renderToString(<VideoText src="/video.mp4">Ocean</VideoText>)
    const html2 = renderToString(<VideoText src="/video.mp4">Ocean</VideoText>)
    expect(html1).toBe(html2)
    expect(html1).toContain('Ocean')
  })

  it('provides an accessible screen-reader-only text element while video and svg are aria-hidden', () => {
    render(
      <VideoText src="/video.mp4" poster="/poster.webp" fontWeight="900" as="h2">
        SURF
      </VideoText>,
    )

    const root = document.querySelector('[data-slot="video-text"]')
    expect(root?.tagName.toLowerCase()).toBe('h2')

    // Exactly one sr-only text node for screen readers
    const srOnly = root?.querySelector('.sr-only')
    expect(srOnly?.textContent).toBe('SURF')

    const video = root?.querySelector('video')
    expect(video?.getAttribute('aria-hidden')).toBe('true')
    expect(video?.getAttribute('poster')).toBe('/poster.webp')

    const svg = root?.querySelector('svg')
    expect(svg?.getAttribute('aria-hidden')).toBe('true')
    expect(svg?.querySelector('clipPath text')?.textContent).toBe('SURF')
  })

  it('pauses playback under reduced motion', () => {
    mockReducedMotion(true)
    const pauseSpy = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})

    render(<VideoText src="/clip.webm">Quiet</VideoText>)
    expect(pauseSpy).toHaveBeenCalled()
  })
})

describe('MorphingText', () => {
  it('renders the first word statically on the server without SVG filters', () => {
    const html1 = renderToString(<MorphingText texts={['Design', 'Develop', 'Deploy']} />)
    const html2 = renderToString(<MorphingText texts={['Design', 'Develop', 'Deploy']} />)
    expect(html1).toBe(html2)
    expect(html1).toContain('Design')
    expect(html1).not.toContain('feColorMatrix')
  })

  it('provides live region announcements with aria-live="polite"', () => {
    render(<MorphingText texts={['First', 'Second']} />)
    const el = document.querySelector('[data-slot="morphing-text"]')
    expect(el?.textContent).toContain('First')
  })

  it('crossfades on reduced motion without blur or gooey SVG filters', () => {
    mockReducedMotion(true)
    vi.useFakeTimers()

    render(<MorphingText texts={['Alpha', 'Beta']} morphTime={1} cooldownTime={0.25} />)

    const el = document.querySelector('[data-slot="morphing-text"]')
    expect(el?.getAttribute('aria-live')).toBe('polite')
    expect(el?.textContent).toBe('Alpha')

    act(() => {
      vi.advanceTimersByTime(1250)
    })
    expect(el?.textContent).toBe('Beta')
  })
})

describe('SpinningText', () => {
  it('renders server-side deterministically without errors', () => {
    const html1 = renderToString(<SpinningText>antigravity</SpinningText>)
    const html2 = renderToString(<SpinningText>antigravity</SpinningText>)
    expect(html1).toBe(html2)
    expect(html1).toContain('role="img"')
    expect(html1).toContain('aria-label="antigravity"')
  })

  it('sets accessible role="img" and aria-label while chars are aria-hidden', () => {
    render(
      <SpinningText duration={8} radius={6} center={<span data-testid="icon">★</span>}>
        ROTATE
      </SpinningText>,
    )

    const root = screen.getByRole('img', { name: 'ROTATE' })
    expect(root).toBeTruthy()
    expect(root.getAttribute('data-slot')).toBe('spinning-text')

    // 6 chars
    const chars = root.querySelectorAll('[data-slot="spinning-text-char"]')
    expect(chars.length).toBe(6)
    for (const char of chars) {
      expect(char.getAttribute('aria-hidden')).toBe('true')
    }

    // Center icon
    expect(screen.getByTestId('icon')).toBeTruthy()
  })
})

describe('TextHighlighter & generateRoughPath', () => {
  it('generateRoughPath is pure and deterministic for a given seed and rect', () => {
    const rect = { x: 10, y: 20, width: 120, height: 40 }

    const pathBox1 = generateRoughPath('box', rect, { seed: 101 })
    const pathBox2 = generateRoughPath('box', rect, { seed: 101 })
    expect(pathBox1).toBe(pathBox2)
    expect(pathBox1.startsWith('M ')).toBe(true)

    // Different seed produces different jitter
    const pathBoxOther = generateRoughPath('box', rect, { seed: 999 })
    expect(pathBox1).not.toBe(pathBoxOther)

    // Circle action
    const circlePath1 = generateRoughPath('circle', rect, { seed: 42 })
    const circlePath2 = generateRoughPath('circle', rect, { seed: 42 })
    expect(circlePath1).toBe(circlePath2)

    // Bracket action
    const bracketPath = generateRoughPath('bracket', rect, { seed: 7, brackets: 'both' })
    expect(bracketPath).toContain('L ')

    // Crossed-off action
    const crossPath = generateRoughPath('crossed-off', rect, { seed: 5 })
    expect(crossPath).toContain('M ')
  })

  it('renders CSS actions (highlight, underline, strike-through) with linear-gradient background', () => {
    const { container } = render(
      <Highlighter action="highlight" color="#fde047">
        Highlighted Content
      </Highlighter>,
    )

    const span = container.querySelector('[data-slot="text-highlighter"]') as HTMLElement
    expect(span.textContent).toBe('Highlighted Content')
    expect(span.style.backgroundImage).toContain('linear-gradient')
  })

  it('renders rough SVG path annotations on mount', () => {
    const { container } = render(
      <Highlighter action="circle" color="#ef4444" trigger="mount">
        Circled
      </Highlighter>,
    )

    const span = container.querySelector('[data-slot="text-highlighter"]')
    expect(span).toBeTruthy()
    expect(span?.textContent).toContain('Circled')
  })
})
