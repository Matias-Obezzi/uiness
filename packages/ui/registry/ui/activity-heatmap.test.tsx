import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ActivityHeatmap } from './activity-heatmap'

// Tuesday 1 September to Monday 14 September 2026: three week columns, starting on Sunday.
const props = {
  startDate: '2026-09-01',
  endDate: '2026-09-14',
  locale: 'en-US',
  data: [
    { date: '2026-09-01', value: 2 },
    { date: '2026-09-03', value: 8 },
    { date: new Date(2026, 8, 3), value: 2 },
    { date: '2026-09-14', value: 4 },
  ],
}

const days = () => [...document.querySelectorAll<HTMLElement>('td[data-date]')]
const cell = (date: string) => document.querySelector<HTMLElement>(`td[data-date="${date}"]`)

describe('ActivityHeatmap', () => {
  it('is a grid of weekday rows with one labelled cell per day in range', () => {
    render(<ActivityHeatmap {...props} />)
    const grid = screen.getByRole('grid', {
      name: 'Activity from September 1, 2026 to September 14, 2026',
    })
    expect(grid.querySelectorAll('tbody tr')).toHaveLength(7)
    expect(days()).toHaveLength(14)
    expect(cell('2026-09-03')?.getAttribute('aria-label')).toBe('10 on Thu, Sep 3, 2026')
    expect(cell('2026-09-02')?.getAttribute('aria-label')).toBe('Nothing on Wed, Sep 2, 2026')
  })

  it('shades days in steps up to the busiest one', () => {
    render(<ActivityHeatmap {...props} />)
    expect(cell('2026-09-02')?.dataset.level).toBe('0')
    expect(cell('2026-09-01')?.dataset.level).toBe('1')
    expect(cell('2026-09-14')?.dataset.level).toBe('2')
    expect(cell('2026-09-03')?.dataset.level).toBe('4')
  })

  it('takes explicit thresholds and a map of dates', () => {
    render(
      <ActivityHeatmap
        {...props}
        data={{ '2026-09-05': 3, '2026-09-06': 12 }}
        thresholds={[1, 5, 10, 20]}
      />,
    )
    expect(cell('2026-09-05')?.dataset.level).toBe('1')
    expect(cell('2026-09-06')?.dataset.level).toBe('3')
  })

  it('moves by day with up and down and by week with left and right', () => {
    render(<ActivityHeatmap {...props} />)
    const last = cell('2026-09-14') as HTMLElement
    expect(last.tabIndex).toBe(0)
    expect(days().filter((d) => d.tabIndex === 0)).toHaveLength(1)
    act(() => last.focus())
    fireEvent.keyDown(last, { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(cell('2026-09-07'))
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowUp' })
    expect(document.activeElement).toBe(cell('2026-09-06'))
    // Past the first day the focus stays on it.
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowLeft' })
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(cell('2026-09-01'))
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'End', ctrlKey: true })
    expect(document.activeElement).toBe(cell('2026-09-14'))
  })

  it('shows a tooltip for the focused day and picks it with Enter', () => {
    const onSelect = vi.fn()
    render(<ActivityHeatmap {...props} onSelect={onSelect} />)
    act(() => cell('2026-09-03')?.focus())
    expect(document.querySelector('[data-slot=activity-heatmap-tooltip]')?.textContent).toBe(
      '10 on Thu, Sep 3, 2026',
    )
    fireEvent.keyDown(cell('2026-09-03') as HTMLElement, { key: 'Enter' })
    expect(onSelect).toHaveBeenCalledWith({ date: new Date(2026, 8, 3), value: 10 })
  })

  it('starts weeks on Monday when asked', () => {
    render(<ActivityHeatmap {...props} weekStart={1} />)
    const firstRow = document.querySelector('tbody tr')
    expect(firstRow?.querySelector('th')?.textContent).toContain('Monday')
  })
})
