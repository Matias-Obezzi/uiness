import { render, screen } from '@testing-library/react'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Gauge } from './gauge'

// Reduced motion lands on the value at once, so the text can be read straight away.
const realMatchMedia = window.matchMedia
beforeAll(() => {
  window.matchMedia = ((query: string) => ({
    matches: query.includes('reduce'),
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia
})
afterAll(() => {
  window.matchMedia = realMatchMedia
})

const bands = [
  { value: 0, color: 'green', label: 'Healthy' },
  { value: 70, color: 'orange', label: 'Busy' },
  { value: 90, color: 'red', label: 'Critical' },
]

describe('Gauge', () => {
  it('is a meter with its range, value and band in the value text', () => {
    render(<Gauge value={76} label="CPU" thresholds={bands} locale="en-US" />)
    const meter = screen.getByRole('meter', { name: 'CPU' })
    expect(meter.getAttribute('aria-valuemin')).toBe('0')
    expect(meter.getAttribute('aria-valuemax')).toBe('100')
    expect(meter.getAttribute('aria-valuenow')).toBe('76')
    expect(meter.getAttribute('aria-valuetext')).toBe('76, Busy')
    expect(document.querySelector('[data-slot=gauge-value]')?.textContent).toBe('76')
  })

  it('clamps the value to the range', () => {
    render(<Gauge value={140} min={0} max={120} aria-label="Speed" />)
    expect(screen.getByRole('meter').getAttribute('aria-valuenow')).toBe('120')
  })

  it('draws a band per threshold, filled up to the value', () => {
    render(<Gauge value={76} thresholds={bands} aria-label="Load" />)
    expect(document.querySelectorAll('[data-slot=gauge-band]')).toHaveLength(3)
    // The first band is full and the second partly filled; the last is still empty.
    expect(document.querySelectorAll('[data-slot=gauge-fill]')).toHaveLength(2)
  })

  it('fills one color without thresholds, and draws a needle when asked', () => {
    render(<Gauge value={30} color="blue" needle aria-label="Level" />)
    expect(document.querySelector('[data-slot=gauge-fill]')?.getAttribute('stroke')).toBe('blue')
    expect(document.querySelector('[data-slot=gauge-needle]')).not.toBeNull()
  })

  it('uses the formatter for the centre, the range and screen readers', () => {
    render(
      <Gauge
        value={0.42}
        max={1}
        variant="ring"
        showRange
        formatValue={(v) => `${Math.round(v * 100)}%`}
        aria-label="Quota"
      />,
    )
    expect(screen.getByRole('meter').getAttribute('aria-valuetext')).toBe('42%')
    expect(screen.getAllByText('100%')).toHaveLength(1)
  })
})
