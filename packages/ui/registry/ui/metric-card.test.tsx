import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MetricCard } from './metric-card'

const delta = () => document.querySelector<HTMLElement>('[data-slot=metric-card-delta]')

describe('MetricCard', () => {
  it('is a group named by its label, with the value for screen readers', () => {
    render(
      <MetricCard
        label="Revenue"
        value={48210}
        locale="en-US"
        format={{ style: 'currency', currency: 'USD' }}
      />,
    )
    const group = screen.getByRole('group', { name: 'Revenue' })
    expect(group.querySelector('.sr-only')?.textContent).toBe('$48,210')
  })

  it('colors the delta by whether its direction is good, and says it in words', () => {
    const { rerender } = render(
      <MetricCard
        label="Signups"
        value={10}
        delta={0.124}
        comparison="vs last week"
        locale="en-US"
      />,
    )
    expect(delta()?.dataset.trend).toBe('up')
    expect(delta()?.dataset.good).toBe('true')
    expect(delta()?.textContent).toContain('Up')
    expect(delta()?.textContent).toContain('+12.4%')
    expect(screen.getByText('vs last week')).toBeTruthy()

    rerender(<MetricCard label="Churn" value={10} delta={0.03} inverse locale="en-US" />)
    expect(delta()?.dataset.good).toBe('false')

    rerender(<MetricCard label="Latency" value={10} delta={-0.2} inverse locale="en-US" />)
    expect(delta()?.dataset.trend).toBe('down')
    expect(delta()?.dataset.good).toBe('true')

    rerender(<MetricCard label="Flat" value={10} delta={0} locale="en-US" />)
    expect(delta()?.dataset.trend).toBe('flat')
    expect(delta()?.dataset.good).toBeUndefined()
  })

  it('shows any node as the value, and the sparkline slot under it', () => {
    render(<MetricCard label="Status" value="Healthy" sparkline={<span>chart</span>} />)
    expect(screen.getByText('Healthy')).toBeTruthy()
    expect(document.querySelector('[data-slot=metric-card-sparkline]')?.textContent).toBe('chart')
  })

  it('swaps the figures for placeholders while loading', () => {
    render(<MetricCard label="Revenue" value={100} delta={0.1} sparkline={<span />} loading />)
    expect(screen.getByRole('group').getAttribute('aria-busy')).toBe('true')
    expect(document.querySelectorAll('[data-slot=skeleton]')).toHaveLength(3)
    expect(document.querySelector('[data-slot=metric-card-value]')).toBeNull()
    expect(delta()).toBeNull()
  })
})
