import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { UsageMeter } from './usage-meter'

const segments = [
  { key: 'images', label: 'Images', value: 30 },
  { key: 'video', label: 'Video', value: 20 },
  { key: 'docs', label: 'Documents', value: 10, color: 'pink' },
]

const root = () => document.querySelector<HTMLElement>('[data-slot=usage-meter]')

describe('UsageMeter', () => {
  it('is a meter named by its label that reads how much is used', () => {
    render(<UsageMeter label="Storage" segments={segments} limit={100} format={(n) => `${n} GB`} />)
    const meter = screen.getByRole('meter', { name: 'Storage' })
    expect(meter.getAttribute('aria-valuenow')).toBe('60')
    expect(meter.getAttribute('aria-valuemax')).toBe('100')
    expect(meter.getAttribute('aria-valuetext')).toBe('60 GB of 100 GB used')
    expect(root()?.dataset.state).toBe('ok')
  })

  it('lists every segment with its amount, and what is free', () => {
    render(<UsageMeter label="Storage" segments={segments} limit={100} />)
    const legend = document.querySelector<HTMLElement>('[data-slot=usage-meter-legend]')
    const items = within(legend as HTMLElement)
      .getAllByRole('listitem')
      .map((li) => li.textContent)
    expect(items).toEqual(['Images30', 'Video20', 'Documents10', 'Free40'])
    const swatches = document.querySelectorAll<HTMLElement>('[data-slot=usage-meter-segment]')
    expect(swatches[0]?.style.background).toBe('var(--chart-1)')
    expect(swatches[2]?.style.background).toBe('pink')
  })

  it('warns near the limit, with words as well as color', () => {
    render(<UsageMeter label="Seats" segments={segments} limit={70} />)
    expect(root()?.dataset.state).toBe('warning')
    expect(screen.getByText('Almost full')).toBeTruthy()
    expect(screen.getByRole('meter').getAttribute('aria-valuetext')).toContain('almost full')
  })

  it('shows the overage and marks the limit past it', () => {
    render(<UsageMeter label="Credits" segments={segments} limit={50} />)
    expect(root()?.dataset.state).toBe('over')
    expect(screen.getByText('Over by 10')).toBeTruthy()
    expect(screen.getByRole('meter').getAttribute('aria-valuenow')).toBe('50')
    const mark = document.querySelector<HTMLElement>('[data-slot=usage-meter-limit]')
    expect(mark?.style.left).toBe('calc(83.3333% - 1px)')
    expect(screen.queryByText('Free')).toBeNull()
  })
})
