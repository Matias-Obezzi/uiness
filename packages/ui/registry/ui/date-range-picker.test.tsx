import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { dateKey } from './calendar'
import { DateRangePicker } from './date-range-picker'

const today = new Date(2024, 2, 15)
const day = (key: string) => {
  // Outside days of the first month repeat keys of the second, so take the last match.
  const all = document.querySelectorAll<HTMLButtonElement>(`[data-day="${key}"]`)
  const el = all[all.length - 1]
  if (!el) throw new Error(`No day ${key}`)
  return el
}

describe('DateRangePicker', () => {
  it('opens two months with the presets beside them', async () => {
    render(<DateRangePicker today={today} locale="en-US" />)
    await userEvent.click(screen.getByRole('button', { name: /pick a range/i }))
    expect(await screen.findAllByRole('grid')).toHaveLength(2)
    expect(screen.getByRole('group', { name: 'Presets' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Last 7 days' })).toBeTruthy()
  })

  it('applies a preset in one click and closes', async () => {
    const onValueChange = vi.fn()
    render(<DateRangePicker today={today} locale="en-US" onValueChange={onValueChange} />)
    await userEvent.click(screen.getByRole('button', { name: /pick a range/i }))
    await userEvent.click(await screen.findByRole('button', { name: 'Last 7 days' }))
    const range = onValueChange.mock.lastCall?.[0]
    expect(dateKey(range.from)).toBe('2024-03-09')
    expect(dateKey(range.to)).toBe('2024-03-15')
    expect(screen.queryByRole('grid')).toBeNull()
  })

  it('commits once both ends are picked in the calendar', async () => {
    const onValueChange = vi.fn()
    render(<DateRangePicker today={today} locale="en-US" onValueChange={onValueChange} />)
    await userEvent.click(screen.getByRole('button', { name: /pick a range/i }))
    await screen.findAllByRole('grid')
    await userEvent.click(day('2024-03-10'))
    expect(onValueChange).not.toHaveBeenCalled()
    await userEvent.click(day('2024-03-12'))
    const range = onValueChange.mock.lastCall?.[0]
    expect(dateKey(range.from)).toBe('2024-03-10')
    expect(dateKey(range.to)).toBe('2024-03-12')
  })

  it('waits for Apply in confirm mode, and Cancel drops the pick', async () => {
    const onValueChange = vi.fn()
    render(<DateRangePicker today={today} locale="en-US" confirm onValueChange={onValueChange} />)
    const trigger = screen.getByRole('button', { name: /pick a range/i })

    await userEvent.click(trigger)
    await userEvent.click(await screen.findByRole('button', { name: 'Today' }))
    expect(onValueChange).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Today' }).getAttribute('aria-pressed')).toBe('true')
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onValueChange).not.toHaveBeenCalled()

    await userEvent.click(trigger)
    await userEvent.click(await screen.findByRole('button', { name: 'Yesterday' }))
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }))
    const range = onValueChange.mock.lastCall?.[0]
    expect(dateKey(range.from)).toBe('2024-03-14')
    expect(dateKey(range.to)).toBe('2024-03-14')
  })

  it('takes custom presets', async () => {
    const onValueChange = vi.fn()
    render(
      <DateRangePicker
        today={today}
        presets={[{ label: 'Next week', range: (t) => ({ from: t, to: new Date(2024, 2, 22) }) }]}
        onValueChange={onValueChange}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /pick a range/i }))
    expect(screen.queryByRole('button', { name: 'Today' })).toBeNull()
    await userEvent.click(await screen.findByRole('button', { name: 'Next week' }))
    expect(dateKey(onValueChange.mock.lastCall?.[0].to)).toBe('2024-03-22')
  })

  it('writes the range in the trigger with the locale and in hidden inputs', () => {
    const { container } = render(
      <DateRangePicker
        locale="en-US"
        name="stay"
        defaultValue={{ from: new Date(2024, 2, 1), to: new Date(2024, 2, 5) }}
      />,
    )
    expect(screen.getByRole('button').textContent).toMatch(/Mar 1\s*–\s*5, 2024/)
    expect(container.querySelector<HTMLInputElement>('input[name="stay.from"]')?.value).toBe(
      '2024-03-01',
    )
    expect(container.querySelector<HTMLInputElement>('input[name="stay.to"]')?.value).toBe(
      '2024-03-05',
    )
  })
})
