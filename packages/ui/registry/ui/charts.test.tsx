import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Bar, BarChart as RechartsBarChart } from 'recharts'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { BarChart } from './bar-chart'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  niceTicks,
  toChartDate,
  toChartNumber,
} from './chart'
import { LineChart } from './line-chart'

// jsdom has no layout, and recharts draws nothing at 0 by 0, so every box gets a size. Reduced
// motion is on, which turns the recharts animations off and draws the final frame right away.
const realRect = HTMLElement.prototype.getBoundingClientRect
const realMatchMedia = window.matchMedia
beforeAll(() => {
  HTMLElement.prototype.getBoundingClientRect = () =>
    ({ x: 0, y: 0, top: 0, left: 0, right: 600, bottom: 240, width: 600, height: 240 }) as DOMRect
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

const days = Array.from({ length: 10 }, (_, i) => ({
  date: new Date(2026, 8, i + 1),
  visits: 1000 + i * 37,
  signups: 20 + i,
}))

const series = [
  { key: 'visits', label: 'Visits' },
  { key: 'signups', label: 'Signups' },
]

const bars = (container: HTMLElement, key?: string) =>
  container.querySelectorAll(
    key ? `.recharts-bar-rectangle path[fill="var(--color-${key})"]` : '.recharts-bar-rectangle',
  )

async function readFirstPoint(container: HTMLElement) {
  const surface = container.querySelector<SVGElement>('.recharts-surface')
  expect(surface).not.toBeNull()
  act(() => surface?.focus())
  // Wherever the keyboard starts, one step right and one back lands on the first row.
  await userEvent.keyboard('{ArrowRight}{ArrowLeft}')
  return container.querySelector<HTMLElement>('[data-slot="chart-tooltip"]')
}

describe('niceTicks', () => {
  it('steps by 1, 2 or 5 times a power of ten and covers the data', () => {
    expect(niceTicks(0, 100, 5)).toEqual([0, 20, 40, 60, 80, 100])
    expect(niceTicks(0, 130, 4)).toEqual([0, 50, 100, 150])
    expect(niceTicks(0, 1003, 4)).toEqual([0, 200, 400, 600, 800, 1000, 1200])
    expect(niceTicks(-37, 52, 4)).toEqual([-40, -20, 0, 20, 40, 60])
  })

  it('keeps decimals clean and never collapses a flat series', () => {
    expect(niceTicks(0, 0.7, 4)).toEqual([0, 0.2, 0.4, 0.6, 0.8])
    expect(niceTicks(0, 0)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1])
    const flat = niceTicks(50, 50)
    expect(flat[0]).toBeLessThan(50)
    expect(flat[flat.length - 1]).toBeGreaterThan(50)
  })
})

describe('chart helpers', () => {
  it('reads ISO dates as local days and loose numbers', () => {
    expect(toChartDate('2026-09-01')?.getDate()).toBe(1)
    expect(toChartDate('Mon')).toBeNull()
    expect(toChartNumber('12.5')).toBe(12.5)
    expect(toChartNumber('')).toBeNull()
    expect(toChartNumber(Number.NaN)).toBeNull()
  })
})

describe('ChartContainer', () => {
  const config = {
    desktop: { label: 'Desktop', color: 'var(--chart-1)' },
    mobile: { label: 'Mobile', theme: { light: '#111', dark: '#eee' } },
  }

  it('turns the config into color variables, per theme', () => {
    const { container } = render(
      <ChartContainer config={config} id="sales">
        <RechartsBarChart data={days}>
          <Bar dataKey="visits" />
        </RechartsBarChart>
      </ChartContainer>,
    )
    const css = container.querySelector('style')?.textContent ?? ''
    expect(css).toContain('[data-chart=chart-sales]')
    expect(css).toContain('--color-desktop: var(--chart-1);')
    expect(css).toMatch(/\.dark \[data-chart=chart-sales\] \{[^}]*--color-mobile: #eee;/)
    expect(css).toMatch(/^\s*\[data-chart=chart-sales\] \{[^}]*--color-mobile: #111;/)
  })

  it('renders the tooltip content with config labels', async () => {
    const { container } = render(
      <ChartContainer config={{ visits: { label: 'Page views', color: 'red' } }}>
        <RechartsBarChart data={days} accessibilityLayer>
          <ChartTooltip content={<ChartTooltipContent hideLabel />} />
          <Bar dataKey="visits" fill="var(--color-visits)" />
        </RechartsBarChart>
      </ChartContainer>,
    )
    const tip = await readFirstPoint(container)
    expect(tip?.textContent).toContain('Page views')
    expect(tip?.textContent).toContain('1,000')
  })
})

describe('BarChart', () => {
  it('draws one bar per series per row, colored through the config', () => {
    const { container } = render(<BarChart data={days} x="date" series={series} />)
    expect(bars(container, 'visits')).toHaveLength(10)
    expect(bars(container, 'signups')).toHaveLength(10)
    expect(container.querySelector('style')?.textContent).toContain(
      '--color-signups: var(--chart-2)',
    )
  })

  it('takes a color from the series', () => {
    const { container } = render(
      <BarChart data={days} x="date" series={[{ key: 'visits', color: 'hotpink' }]} />,
    )
    expect(container.querySelector('style')?.textContent).toContain('--color-visits: hotpink')
  })

  it('labels the axes with short dates and compact numbers', () => {
    const { container } = render(<BarChart data={days} x="date" series={series} locale="en-US" />)
    // Recharts splits a label into one tspan per word.
    const labels = [...container.querySelectorAll('text.recharts-cartesian-axis-tick-value')].map(
      (t) => [...t.querySelectorAll('tspan')].map((s) => s.textContent).join(' '),
    )
    expect(labels).toContain('Sep 10')
    expect(labels).toEqual(expect.arrayContaining(['0', '500', '1K', '1.5K']))
  })

  it('stacks the series', () => {
    const { container } = render(<BarChart data={days} x="date" series={series} stacked />)
    expect(bars(container, 'visits')).toHaveLength(10)
    expect(bars(container, 'signups')).toHaveLength(10)
    // Both segments of a row share one column.
    const x = (key: string) => bars(container, key)[0]?.getAttribute('x')
    expect(x('visits')).toBe(x('signups'))
  })

  it('shows the empty state when there is no data', () => {
    render(<BarChart data={[]} x="date" series={series} empty="Nothing this month" />)
    expect(screen.getByText('Nothing this month')).toBeTruthy()
    expect(document.querySelector('.recharts-wrapper')).toBeNull()
  })

  it('shows the empty state when every value is missing', () => {
    const data = [
      { date: '2026-09-01', visits: null },
      { date: '2026-09-02', visits: undefined },
    ]
    render(<BarChart data={data} x="date" series={[{ key: 'visits' }]} />)
    expect(screen.getByText('No data')).toBeTruthy()
  })

  it('shows every series of a row in the tooltip, with exact values', async () => {
    const { container } = render(<BarChart data={days} x="date" series={series} locale="en-US" />)
    const tip = await readFirstPoint(container)
    expect(tip?.textContent).toContain('Tue, Sep 1')
    expect(tip?.textContent).toContain('Visits')
    expect(tip?.textContent).toContain('1,000')
    expect(tip?.textContent).toContain('Signups')
  })

  it('hides a series from the legend and keeps the other colors', async () => {
    const { container } = render(<BarChart data={days} x="date" series={series} />)
    const button = screen.getByRole('button', { name: 'Visits' })
    await userEvent.click(button)
    expect(button.getAttribute('aria-pressed')).toBe('false')
    expect(bars(container, 'visits')).toHaveLength(0)
    expect(bars(container, 'signups')).toHaveLength(10)
    // The last visible series cannot be hidden.
    await userEvent.click(screen.getByRole('button', { name: 'Signups' }))
    expect(bars(container, 'signups')).toHaveLength(10)
  })

  it('summarises itself for screen readers', () => {
    render(<BarChart data={days} x="date" series={series} locale="en-US" />)
    expect(screen.getByRole('figure').getAttribute('aria-label')).toBe(
      'Bar chart of Visits, Signups, 10 points, from Tue, Sep 1 to Thu, Sep 10',
    )
  })
})

describe('LineChart', () => {
  it('draws one line per series', () => {
    const { container } = render(<LineChart data={days} x="date" series={series} />)
    expect(container.querySelectorAll('.recharts-line-curve')).toHaveLength(2)
  })

  it('fills the area under each line with a gradient', () => {
    const { container } = render(
      <LineChart data={days} x="date" series={series} area curve="monotone" />,
    )
    expect(container.querySelectorAll('.recharts-area-area')).toHaveLength(2)
    expect(container.querySelectorAll('linearGradient')).toHaveLength(2)
  })

  it('leaves a gap where values are missing', () => {
    const data = days.map((d, i) => ({ ...d, visits: i === 4 ? null : d.visits }))
    const { container } = render(<LineChart data={data} x="date" series={[{ key: 'visits' }]} />)
    const d = container.querySelector('.recharts-line-curve')?.getAttribute('d') ?? ''
    // One move to start, and a second one after the gap.
    expect(d.match(/M/g)).toHaveLength(2)
  })

  it('reads values with the arrow keys and formats them', async () => {
    const { container } = render(
      <LineChart
        data={days}
        x="date"
        series={series}
        xFormat={(d) => `day ${(d as Date).getDate()}`}
        yFormat={(n) => `${n} u`}
      />,
    )
    const tip = await readFirstPoint(container)
    expect(tip?.textContent).toContain('day 1')
    expect(tip?.textContent).toContain('1000 u')
  })

  it('shows the tooltip on pointer move', async () => {
    const { container } = render(<LineChart data={days} x="date" series={series} />)
    const wrapper = container.querySelector('.recharts-wrapper') as HTMLElement
    act(() => {
      fireEvent.mouseMove(wrapper, { clientX: 300, clientY: 100 })
    })
    await waitFor(() =>
      expect(container.querySelector('[data-slot="chart-tooltip"]')).not.toBeNull(),
    )
  })
})
