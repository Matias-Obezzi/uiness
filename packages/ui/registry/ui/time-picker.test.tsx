import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { FormControl, FormField, FormLabel } from './form'
import { formatTime, parseTime, TimePicker } from './time-picker'

const segment = (name: string) => screen.getByRole('spinbutton', { name })

describe('time helpers', () => {
  it('reads and writes 24 hour strings', () => {
    expect(parseTime('09:05')).toBe(9 * 3600 + 5 * 60)
    expect(parseTime('23:59:30')).toBe(23 * 3600 + 59 * 60 + 30)
    expect(parseTime('24:00')).toBeNull()
    expect(parseTime('nope')).toBeNull()
    expect(formatTime(9 * 3600 + 5 * 60)).toBe('09:05')
    expect(formatTime(45, true)).toBe('00:00:45')
  })
})

describe('TimePicker', () => {
  it('takes a time typed straight through, moving segment to segment', async () => {
    const onValueChange = vi.fn()
    render(<TimePicker hourCycle={24} locale="en-GB" onValueChange={onValueChange} />)
    segment('Hours').focus()
    await userEvent.keyboard('1430')
    expect(onValueChange).toHaveBeenLastCalledWith('14:30')
    expect(segment('Minutes').getAttribute('aria-valuenow')).toBe('30')
    expect(document.activeElement).toBe(segment('Minutes'))
  })

  // A digit that cannot start a two digit hour is a whole hour, so the next key is a minute.
  it('moves on as soon as a segment cannot take another digit', async () => {
    const onValueChange = vi.fn()
    render(<TimePicker hourCycle={24} locale="en-GB" onValueChange={onValueChange} />)
    segment('Hours').focus()
    await userEvent.keyboard('7')
    expect(document.activeElement).toBe(segment('Minutes'))
    await userEvent.keyboard('8')
    expect(segment('Minutes').getAttribute('aria-valuenow')).toBe('8')
    expect(onValueChange).toHaveBeenLastCalledWith('07:08')
  })

  it('steps with the arrows and wraps around', async () => {
    const onValueChange = vi.fn()
    render(
      <TimePicker
        hourCycle={24}
        locale="en-GB"
        defaultValue="10:59"
        onValueChange={onValueChange}
      />,
    )
    segment('Minutes').focus()
    await userEvent.keyboard('{ArrowUp}')
    expect(onValueChange).toHaveBeenLastCalledWith('10:00')
    segment('Hours').focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(onValueChange).toHaveBeenLastCalledWith('09:00')
    await userEvent.keyboard('{End}')
    expect(onValueChange).toHaveBeenLastCalledWith('23:00')
  })

  it('shows a 12 hour clock and flips AM and PM from the keyboard', async () => {
    const onValueChange = vi.fn()
    render(
      <TimePicker
        hourCycle={12}
        locale="en-US"
        defaultValue="14:30"
        onValueChange={onValueChange}
      />,
    )
    expect(segment('Hours').textContent).toBe('02')
    expect(segment('AM/PM').textContent).toBe('PM')
    segment('AM/PM').focus()
    await userEvent.keyboard('a')
    expect(onValueChange).toHaveBeenLastCalledWith('02:30')
  })

  it('clears a segment with Backspace, which empties the value', async () => {
    const onValueChange = vi.fn()
    render(<TimePicker hourCycle={24} defaultValue="08:15" onValueChange={onValueChange} />)
    segment('Minutes').focus()
    await userEvent.keyboard('{Backspace}')
    expect(onValueChange).toHaveBeenLastCalledWith(null)
    expect(segment('Minutes').getAttribute('aria-valuetext')).toBe('Empty')
  })

  it('adds seconds when asked', async () => {
    const onValueChange = vi.fn()
    render(<TimePicker hourCycle={24} seconds onValueChange={onValueChange} />)
    segment('Hours').focus()
    await userEvent.keyboard('091545')
    expect(onValueChange).toHaveBeenLastCalledWith('09:15:45')
  })

  it('clamps to min and max once focus leaves', async () => {
    const onValueChange = vi.fn()
    render(
      <>
        <TimePicker hourCycle={24} min="09:00" defaultValue="08:00" onValueChange={onValueChange} />
        <button type="button">After</button>
      </>,
    )
    const group = screen.getByRole('group')
    expect(group.getAttribute('aria-invalid')).toBe('true')
    segment('Minutes').focus()
    await userEvent.tab()
    expect(onValueChange).toHaveBeenLastCalledWith('09:00')
    expect(group.getAttribute('aria-invalid')).toBeNull()
  })

  it('offers a list of times every step minutes between min and max', async () => {
    const onValueChange = vi.fn()
    render(
      <TimePicker
        hourCycle={24}
        locale="en-GB"
        step={30}
        min="09:00"
        max="11:00"
        onValueChange={onValueChange}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Choose a time' }))
    const list = await screen.findByRole('listbox')
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      '09:00',
      '09:30',
      '10:00',
      '10:30',
      '11:00',
    ])
    expect(document.activeElement).toBe(list)
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}')
    expect(onValueChange).toHaveBeenLastCalledWith('10:00')
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('follows a controlled value and keeps a half typed time while it is null', async () => {
    function Controlled() {
      const [value, setValue] = useState<string | null>('12:00')
      return (
        <>
          <TimePicker hourCycle={24} value={value} onValueChange={setValue} />
          <output>{value ?? 'none'}</output>
          <button type="button" onClick={() => setValue('18:45')}>
            Evening
          </button>
        </>
      )
    }
    render(<Controlled />)
    segment('Hours').focus()
    await userEvent.keyboard('{Backspace}')
    expect(screen.getByText('none')).toBeTruthy()
    expect(segment('Minutes').textContent).toBe('00')
    await userEvent.click(screen.getByText('Evening'))
    expect(segment('Hours').textContent).toBe('18')
    expect(segment('Minutes').textContent).toBe('45')
  })

  it('submits the value through a hidden input', () => {
    const { container } = render(<TimePicker name="start" defaultValue="07:05" />)
    expect(container.querySelector<HTMLInputElement>('input[name="start"]')?.value).toBe('07:05')
  })

  it('takes its name and description from a form field', () => {
    render(
      <FormField name="start" error="Pick a time">
        <FormLabel>Starts at</FormLabel>
        <FormControl>
          <TimePicker />
        </FormControl>
      </FormField>,
    )
    const group = screen.getByRole('group', { name: 'Starts at' })
    expect(group.getAttribute('aria-invalid')).toBe('true')
  })
})
