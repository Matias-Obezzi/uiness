import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { BarChart } from './bar-chart'
import { monotonePath, niceTicks, segments, toDate } from './chart-core'
import { LineChart } from './line-chart'

const days = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(2026, 8, i + 1),
  visits: 100 + ((i * 37) % 90),
  signups: 20 + ((i * 13) % 30),
}))

const series = [
  { key: 'visits', label: 'Visits' },
  { key: 'signups', label: 'Signups' },
]

const plot = () => screen.getByRole('img')
const tooltip = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="chart-tooltip"]')

describe('niceTicks', () => {
  it('covers the range with round, evenly spaced numbers', () => {
    const ticks = niceTicks(0, 1873, 5)
    expect(ticks[0]).toBe(0)
    expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(1873)
    const step = (ticks[1] as number) - (ticks[0] as number)
    expect([1, 2, 5]).toContain(step / 10 ** Math.floor(Math.log10(step)))
    expect(ticks).toEqual(ticks.map((_, i) => i * step))
  })

  it('gives the same answer people would', () => {
    expect(niceTicks(0, 100, 5)).toEqual([0, 20, 40, 60, 80, 100])
    expect(niceTicks(0, 9, 4)).toEqual([0, 2, 4, 6, 8, 10])
    expect(niceTicks(-37, 52, 4)).toEqual([-40, -20, 0, 20, 40, 60])
  })

  it('keeps decimals clean', () => {
    const ticks = niceTicks(0, 0.7, 5)
    expect(ticks).toEqual([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7])
    for (const t of ticks) expect(String(t).length).toBeLessThanOrEqual(3)
  })

  it('does not collapse a flat series', () => {
    expect(niceTicks(0, 0)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1])
    const flat = niceTicks(50, 50)
    expect(flat[0]).toBeLessThan(50)
    expect(flat[flat.length - 1]).toBeGreaterThan(50)
    expect(flat.every(Number.isInteger)).toBe(true)
  })
})

describe('chart helpers', () => {
  it('reads ISO dates as local days', () => {
    expect(toDate('2026-09-01')?.getDate()).toBe(1)
    expect(toDate('Mon')).toBeNull()
  })

  it('splits a series at missing values', () => {
    expect(segments([1, 2, null, 4, null, null, 7, 8]).map((r) => r.map((p) => p.index))).toEqual([
      [0, 1],
      [3],
      [6, 7],
    ])
  })

  it('draws a monotone curve that passes through every point', () => {
    const d = monotonePath([
      [0, 10],
      [10, 0],
      [20, 5],
      [30, 5],
    ])
    expect(d.startsWith('M0,10C')).toBe(true)
    expect(d).toContain(' 10,0C')
    expect(d).toContain(' 20,5C')
    expect(d.endsWith(' 30,5')).toBe(true)
  })
})

describe('BarChart', () => {
  it('draws one bar per series per row', () => {
    const { container } = render(<BarChart data={days} x="date" series={series} />)
    expect(container.querySelectorAll('[data-series="visits"]')).toHaveLength(30)
    expect(container.querySelectorAll('[data-series="signups"]')).toHaveLength(30)
  })

  it('takes series colors from the theme, or from the series', () => {
    const { container } = render(
      <BarChart
        data={days}
        x="date"
        series={[{ key: 'visits' }, { key: 'signups', color: 'hotpink' }]}
      />,
    )
    expect(container.querySelector('[data-series="visits"]')?.getAttribute('fill')).toBe(
      'var(--chart-1)',
    )
    expect(container.querySelector('[data-series="signups"]')?.getAttribute('fill')).toBe('hotpink')
  })

  it('labels the y axis with nice numbers', () => {
    const { container } = render(<BarChart data={days} x="date" series={series} />)
    const labels = [...container.querySelectorAll('[data-slot="chart-y-tick"] text')].map(
      (t) => t.textContent,
    )
    expect(labels[0]).toBe('0')
    expect(labels).toContain('100')
  })

  it('stacks into one column per row', () => {
    const { container } = render(<BarChart data={days} x="date" series={series} stacked />)
    const columns = container.querySelectorAll('[data-slot="bar-chart-column"]')
    expect(columns).toHaveLength(30)
    expect(columns[0]?.querySelectorAll('path')).toHaveLength(2)
  })

  it('shows the empty state when there is no data', () => {
    render(<BarChart data={[]} x="date" series={series} empty="Nothing this month" />)
    expect(screen.getByText('Nothing this month')).toBeTruthy()
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('shows the empty state when every value is missing', () => {
    const data = [
      { date: '2026-09-01', visits: null },
      { date: '2026-09-02', visits: undefined },
    ]
    render(<BarChart data={data} x="date" series={[{ key: 'visits' }]} />)
    expect(screen.getByText('No data')).toBeTruthy()
  })

  it('shows a tooltip for the row under the pointer', () => {
    const { container } = render(<BarChart data={days} x="date" series={series} />)
    expect(tooltip(container)).toBeNull()
    fireEvent.pointerMove(plot(), { clientX: 300 })
    const tip = tooltip(container)
    expect(tip).not.toBeNull()
    expect(within(tip as HTMLElement).getByText('Visits')).toBeTruthy()
    expect(within(tip as HTMLElement).getByText('Signups')).toBeTruthy()
    fireEvent.pointerLeave(plot())
    expect(tooltip(container)).toBeNull()
  })

  it('hides a series from the legend', async () => {
    const { container } = render(<BarChart data={days} x="date" series={series} />)
    const button = screen.getByRole('button', { name: 'Signups' })
    await userEvent.click(button)
    expect(button.getAttribute('aria-pressed')).toBe('false')
    expect(container.querySelectorAll('[data-series="signups"]')).toHaveLength(0)
    expect(container.querySelector('[data-series="visits"]')?.getAttribute('fill')).toBe(
      'var(--chart-1)',
    )
  })
})

describe('LineChart', () => {
  it('draws one line per series', () => {
    const { container } = render(<LineChart data={days} x="date" series={series} />)
    expect(container.querySelectorAll('[data-slot="line-chart-line"]')).toHaveLength(2)
  })

  it('fills the area under each line when asked', () => {
    const { container } = render(
      <LineChart data={days} x="date" series={series} area curve="monotone" />,
    )
    expect(container.querySelectorAll('[data-slot="line-chart-area"]')).toHaveLength(2)
    expect(container.querySelectorAll('linearGradient')).toHaveLength(2)
  })

  it('leaves a gap where values are missing', () => {
    const data = days.map((d, i) => ({ ...d, visits: i === 10 || i === 20 ? null : d.visits }))
    const { container } = render(<LineChart data={data} x="date" series={[{ key: 'visits' }]} />)
    expect(container.querySelectorAll('[data-slot="line-chart-line"]')).toHaveLength(3)
  })

  it('moves through the points with the arrow keys', async () => {
    const { container } = render(<LineChart data={days} x="date" series={series} locale="en-US" />)
    // The legend comes first in tab order, then the plot.
    await userEvent.tab()
    await userEvent.tab()
    await userEvent.tab()
    expect(document.activeElement).toBe(plot())
    await userEvent.keyboard('{ArrowRight}')
    expect(tooltip(container)?.textContent).toContain('Sep 1')
    await userEvent.keyboard('{ArrowRight}{ArrowRight}')
    expect(tooltip(container)?.textContent).toContain('Sep 3')
    expect(container.querySelectorAll('[data-slot="line-chart-dot"]')).toHaveLength(2)
    await userEvent.keyboard('{End}')
    expect(tooltip(container)?.textContent).toContain('Sep 30')
    await userEvent.keyboard('{Escape}')
    expect(tooltip(container)).toBeNull()
  })

  it('announces the point read with the keyboard', async () => {
    render(<LineChart data={days} x="date" series={series} locale="en-US" />)
    act(() => plot().focus())
    await userEvent.keyboard('{ArrowRight}')
    const live = document.querySelector('[aria-live="polite"]')
    expect(live?.textContent).toContain('Visits 100')
  })

  it('summarises itself and keeps a data table for screen readers', () => {
    render(<LineChart data={days} x="date" series={series} locale="en-US" />)
    expect(plot().getAttribute('aria-label')).toContain('Line chart of Visits, Signups, 30 points')
    const table = screen.getByRole('table')
    expect(within(table).getAllByRole('row')).toHaveLength(31)
  })

  it('formats with the functions given', () => {
    const { container } = render(
      <LineChart
        data={[
          { day: 'Mon', v: 1200 },
          { day: 'Tue', v: 800 },
        ]}
        x="day"
        series={[{ key: 'v' }]}
        xFormat={(d) => `day ${d}`}
        yFormat={(n) => `${n / 1000}k`}
      />,
    )
    const text = container.textContent ?? ''
    expect(text).toContain('day Mon')
    expect(text).toContain('1.2k')
  })
})
