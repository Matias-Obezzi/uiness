import { fireEvent, render, screen } from '@testing-library/react'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { DonutChart } from './donut-chart'

// jsdom has no layout and recharts draws nothing at 0 by 0, so every box gets a size. Reduced
// motion turns the recharts animation off and draws the final frame right away.
const realRect = HTMLElement.prototype.getBoundingClientRect
const realMatchMedia = window.matchMedia
beforeAll(() => {
  HTMLElement.prototype.getBoundingClientRect = () =>
    ({ x: 0, y: 0, top: 0, left: 0, right: 200, bottom: 200, width: 200, height: 200 }) as DOMRect
  window.matchMedia = ((query: string) => ({
    matches: query.includes('reduce'),
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia
})
afterAll(() => {
  HTMLElement.prototype.getBoundingClientRect = realRect
  window.matchMedia = realMatchMedia
})

const data = [
  { key: 'desktop', label: 'Desktop', value: 600 },
  { key: 'mobile', label: 'Mobile', value: 300 },
  { key: 'tablet', label: 'Tablet', value: 100 },
]

const center = () => document.querySelector<HTMLElement>('[data-slot=donut-chart-center]')
const centerValue = () => center()?.querySelector('.sr-only')?.textContent

describe('DonutChart', () => {
  it('draws a slice per value and the total in the centre', () => {
    const { container } = render(<DonutChart data={data} locale="en-US" />)
    expect(container.querySelectorAll('.recharts-sector')).toHaveLength(3)
    expect(centerValue()).toBe('1,000')
    expect(screen.getByRole('figure').getAttribute('aria-label')).toBe(
      'Donut chart, Desktop: 60%, Mobile: 30%, Tablet: 10%. Total 1,000.',
    )
  })

  it('colors each slice from its key', () => {
    const { container } = render(<DonutChart data={data} />)
    const fills = [...container.querySelectorAll('.recharts-sector')].map((s) =>
      s.getAttribute('fill'),
    )
    expect(fills).toEqual(['var(--color-desktop)', 'var(--color-mobile)', 'var(--color-tablet)'])
  })

  it('shows the hovered or focused legend entry in the centre', () => {
    render(<DonutChart data={data} locale="en-US" />)
    const mobile = screen.getByRole('button', { name: /Mobile/ })
    fireEvent.focus(mobile)
    expect(center()?.textContent).toContain('Mobile')
    expect(centerValue()).toBe('300')
    expect(center()?.textContent).toContain('30%')
    fireEvent.blur(mobile)
    expect(centerValue()).toBe('1,000')
  })

  it('hides a slice from the legend and keeps the last one', () => {
    const { container } = render(<DonutChart data={data} locale="en-US" />)
    const desktop = screen.getByRole('button', { name: /Desktop/ })
    fireEvent.click(desktop)
    expect(desktop.getAttribute('aria-pressed')).toBe('false')
    expect(container.querySelectorAll('.recharts-sector')).toHaveLength(2)
    expect(centerValue()).toBe('400')
    fireEvent.click(screen.getByRole('button', { name: /Mobile/ }))
    fireEvent.click(screen.getByRole('button', { name: /Tablet/ }))
    expect(screen.getByRole('button', { name: /Tablet/ }).getAttribute('aria-pressed')).toBe('true')
  })

  it('shows the empty state when there is nothing to plot', () => {
    render(<DonutChart data={[{ key: 'a', value: 0 }]} empty="Nothing yet" />)
    expect(screen.getByText('Nothing yet')).toBeTruthy()
  })
})
