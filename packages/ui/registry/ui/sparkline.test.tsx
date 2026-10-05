import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Sparkline } from './sparkline'

const svg = () => screen.getByRole('img')

describe('Sparkline', () => {
  it('sums the trend up for screen readers', () => {
    render(<Sparkline data={[4, 8, 2, 10]} width={100} locale="en-US" />)
    expect(svg().getAttribute('aria-label')).toBe('Trend of 4 values, from 4 to 10, low 2, high 10')
  })

  it('breaks the line where a value is missing instead of bridging it', () => {
    const { container } = render(<Sparkline data={[1, 2, null, 3, 4]} width={100} />)
    expect(container.querySelectorAll('[data-sparkline="line"]')).toHaveLength(2)
  })

  it('draws a wash under the line for areas and one bar per value for bars', () => {
    const { container, rerender } = render(<Sparkline data={[1, 3, 2]} width={90} variant="area" />)
    expect(container.querySelectorAll('[data-sparkline="area"]')).toHaveLength(1)
    rerender(<Sparkline data={[1, 3, null, 2]} width={90} variant="bar" />)
    expect(container.querySelectorAll('[data-sparkline="bar"]')).toHaveLength(3)
  })

  it('marks the last value in the series color and min and max in muted ink', () => {
    const { container } = render(
      <Sparkline data={[5, 1, 9, 4]} width={100} markers={['min', 'max', 'last']} color="red" />,
    )
    const dots = [...container.querySelectorAll('[data-sparkline="dot"]')].map((d) =>
      d.getAttribute('fill'),
    )
    expect(dots).toEqual(['var(--muted-foreground)', 'var(--muted-foreground)', 'red'])
  })

  it('reads values with the arrow keys once focused when the tooltip is on', () => {
    render(
      <Sparkline
        data={[10, 20, 30]}
        labels={['Mon', 'Tue', 'Wed']}
        width={100}
        tooltip
        locale="en-US"
      />,
    )
    act(() => svg().focus())
    expect(screen.getByRole('status').textContent).toBe('30Wed')
    fireEvent.keyDown(svg(), { key: 'ArrowLeft' })
    expect(screen.getByRole('status').textContent).toBe('20Tue')
    fireEvent.keyDown(svg(), { key: 'Home' })
    expect(screen.getByRole('status').textContent).toBe('10Mon')
    act(() => svg().blur())
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('is not focusable without the tooltip', () => {
    render(<Sparkline data={[1, 2]} width={40} />)
    expect(svg().getAttribute('tabindex')).toBeNull()
  })
})
