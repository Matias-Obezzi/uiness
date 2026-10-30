import { fireEvent, render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it } from 'vitest'
import { noise2 } from '@/hooks/use-canvas'
import { BackgroundPaths } from './background-paths'
import { CausticsBackground } from './caustics-background'
import { CradleText, swingStep } from './cradle-text'
import { DotField } from './dot-field'
import { DrapeBackground } from './drape-background'
import { FlowField } from './flow-field'
import { GlitchText } from './glitch-text'
import { HalftoneBackground } from './halftone-background'
import { InkBackground } from './ink-background'
import { PluckedText, stringStep } from './plucked-text'
import { RainGlassBackground } from './rain-glass-background'
import { longShadow, ShadowText, sunAt } from './shadow-text'
import { ShapeHero, stepBodies } from './shape-hero'
import { SpoilerText } from './spoiler-text'
import { SwooshText } from './swoosh-text'
import { TopoBackground } from './topo-background'

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
  window.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // jsdom draws nothing: the canvases get no context and simply stay blank.
  HTMLCanvasElement.prototype.getContext = (() =>
    null) as typeof HTMLCanvasElement.prototype.getContext
})

describe('physics', () => {
  it('passes a knock through a cradle of letters', () => {
    const angle = [0, 0, 0]
    const speed = [0.05, 0, 0]
    for (let i = 0; i < 400; i++) swingStep(angle, speed)
    // The far letter took the swing while the first one stopped.
    expect(Math.max(...angle.map(Math.abs), ...speed.map(Math.abs))).toBeGreaterThan(0.001)
    expect(Math.abs(speed[0] as number)).toBeLessThan(Math.abs(speed[2] as number) + 0.05)
  })

  it('rings a plucked string, fixed at its ends, and damps it', () => {
    const y = new Float32Array(20)
    const v = new Float32Array(20)
    y[10] = 10
    stringStep(y, v)
    expect(y[0]).toBe(0)
    expect(y[19]).toBe(0)
    expect(y[9]).not.toBe(0)
    for (let i = 0; i < 4000; i++) stringStep(y, v)
    expect(Math.max(...Array.from(y, Math.abs))).toBeLessThan(1)
  })

  it('piles bodies on the floor without overlapping', () => {
    const bodies = [
      { x: 50, y: 0, vx: 0, vy: 0, r: 20 },
      { x: 55, y: -60, vx: 0, vy: 0, r: 20 },
    ]
    for (let i = 0; i < 600; i++) stepBodies(bodies, 200, 200, null)
    const [a, b] = bodies as [(typeof bodies)[0], (typeof bodies)[0]]
    expect(Math.max(a.y, b.y)).toBeCloseTo(180, 0)
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(38)
  })

  it('lets a pile of many bodies come to rest instead of trembling', () => {
    const bodies = Array.from({ length: 18 }, (_, i) => ({
      x: 40 + ((i * 97) % 520),
      y: -i * 50,
      vx: 0,
      vy: 0,
      r: 18 + ((i * 37) % 5) * 7,
    }))
    for (let i = 0; i < 1500; i++) stepBodies(bodies, 600, 400, null)
    const before = bodies.map((b) => [b.x, b.y])
    for (let i = 0; i < 60; i++) stepBodies(bodies, 600, 400, null)
    const drift = Math.max(
      ...bodies.map((b, i) => Math.hypot(b.x - (before[i]?.[0] ?? 0), b.y - (before[i]?.[1] ?? 0))),
    )
    expect(drift).toBeLessThan(2)
  })

  it('puts the sun east at dawn, high at noon and down at night', () => {
    expect(sunAt(6).across).toBeCloseTo(0)
    expect(sunAt(12).up).toBeCloseTo(1)
    expect(sunAt(18).across).toBeCloseTo(Math.PI)
    expect(sunAt(23).up).toBe(0)
    expect(longShadow(0, 50, 'rgb(0 0 0 / ALPHA)').split('), ')).toHaveLength(14)
  })

  it('makes smooth noise between -1 and 1', () => {
    const values = Array.from({ length: 200 }, (_, i) => noise2(i * 0.13, i * 0.07))
    expect(Math.max(...values)).toBeLessThanOrEqual(1)
    expect(Math.min(...values)).toBeGreaterThanOrEqual(-1)
    expect(Math.abs(noise2(1.5, 2.5) - noise2(1.51, 2.5))).toBeLessThan(0.1)
  })
})

describe('text', () => {
  it('reads letters as plain words', () => {
    render(
      <>
        <CradleText text="Clack" />
        <PluckedText text="Pluck" />
        <SwooshText text="Zinc" />
        <GlitchText text="Signal" />
        <ShadowText hour={9}>Sundial</ShadowText>
      </>,
    )
    for (const word of ['Clack', 'Pluck', 'Zinc'])
      expect(screen.getByText(word).className).toBe('sr-only')
    // The two coloured copies of the glitch are hidden from screen readers.
    expect(
      screen.getAllByText('Signal').filter((el) => el.getAttribute('aria-hidden') !== 'true'),
    ).toHaveLength(1)
    expect(screen.getByText('Sundial').style.textShadow).toContain('px')
  })

  it('hides a spoiler behind a button until it is pressed', () => {
    render(
      <p>
        The killer is <SpoilerText>the butler</SpoilerText>.
      </p>,
    )
    expect(screen.getByText('the butler').getAttribute('aria-hidden')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: 'Spoiler, press to reveal' }))
    expect(screen.getByText('the butler').getAttribute('aria-hidden')).toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
  })
})

describe('backgrounds', () => {
  it('hold their content over a canvas', () => {
    const { container } = render(
      <>
        <BackgroundPaths>Paths</BackgroundPaths>
        <DotField>Dots</DotField>
        <FlowField>Flow</FlowField>
        <TopoBackground>Topo</TopoBackground>
        <DrapeBackground>Drape</DrapeBackground>
        <HalftoneBackground>Halftone</HalftoneBackground>
        <CausticsBackground>Pool</CausticsBackground>
        <RainGlassBackground src="/view.jpg">Rain</RainGlassBackground>
        <InkBackground text="Ink">Below</InkBackground>
        <ShapeHero>Shapes</ShapeHero>
      </>,
    )
    for (const text of [
      'Paths',
      'Dots',
      'Flow',
      'Topo',
      'Drape',
      'Halftone',
      'Pool',
      'Rain',
      'Below',
      'Shapes',
    ])
      expect(screen.getByText(text)).toBeTruthy()
    expect(container.querySelectorAll('canvas')).toHaveLength(9)
    // The ink's words are there for screen readers too.
    expect(screen.getByText('Ink').className).toBe('sr-only')
  })
})
