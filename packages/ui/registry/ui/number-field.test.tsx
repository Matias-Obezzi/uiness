import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FormControl, FormField, FormLabel } from './form'
import { NumberField } from './number-field'

const field = () => screen.getByRole('spinbutton') as HTMLInputElement

afterEach(() => {
  vi.useRealTimers()
})

describe('NumberField', () => {
  it('steps with the arrow keys and reports the value', async () => {
    const onValueChange = vi.fn()
    render(<NumberField aria-label="Guests" defaultValue={2} onValueChange={onValueChange} />)
    await userEvent.click(field())
    await userEvent.keyboard('{ArrowUp}{ArrowUp}')
    expect(field().value).toBe('4')
    expect(onValueChange).toHaveBeenLastCalledWith(4)
    await userEvent.keyboard('{ArrowDown}')
    expect(field().getAttribute('aria-valuenow')).toBe('3')
  })

  it('takes big steps with page keys and jumps to the bounds with Home and End', async () => {
    render(<NumberField aria-label="Volume" defaultValue={50} min={0} max={100} step={1} />)
    await userEvent.click(field())
    await userEvent.keyboard('{PageUp}')
    expect(field().value).toBe('60')
    await userEvent.keyboard('{PageDown}{PageDown}')
    expect(field().value).toBe('40')
    await userEvent.keyboard('{End}')
    expect(field().value).toBe('100')
    await userEvent.keyboard('{Home}')
    expect(field().value).toBe('0')
  })

  it('stops at the bounds and disables the button that would cross them', async () => {
    render(<NumberField aria-label="Qty" defaultValue={9} max={10} />)
    const plus = screen.getByRole('button', { name: 'Increase' })
    await userEvent.click(plus)
    expect(field().value).toBe('10')
    expect((plus as HTMLButtonElement).disabled).toBe(true)
    await userEvent.click(field())
    await userEvent.keyboard('{ArrowUp}')
    expect(field().value).toBe('10')
  })

  it('clamps what was typed when the field loses focus', async () => {
    const onValueChange = vi.fn()
    render(<NumberField aria-label="Age" min={0} max={120} onValueChange={onValueChange} />)
    await userEvent.type(field(), '400')
    expect(onValueChange).not.toHaveBeenCalled()
    await userEvent.tab()
    expect(field().value).toBe('120')
    expect(onValueChange).toHaveBeenLastCalledWith(120)
  })

  it('snaps to the step grid and keeps decimals clean', async () => {
    render(<NumberField aria-label="Weight" defaultValue={0.1} step={0.2} />)
    await userEvent.click(field())
    await userEvent.keyboard('{ArrowUp}')
    // 0.1 is off the 0.2 grid, so the first step lands on the next line, not 0.30000000000000004.
    expect(field().value).toBe('0.2')
    await userEvent.keyboard('{ArrowUp}')
    expect(field().value).toBe('0.4')
  })

  it('formats with Intl and reads formatted text back', async () => {
    const onValueChange = vi.fn()
    render(
      <NumberField
        aria-label="Discount"
        locale="en-US"
        defaultValue={0.25}
        step={0.05}
        formatOptions={{ style: 'percent' }}
        onValueChange={onValueChange}
      />,
    )
    expect(field().value).toBe('25%')
    expect(field().getAttribute('aria-valuetext')).toBe('25%')
    await userEvent.click(field())
    await userEvent.keyboard('{ArrowUp}')
    expect(field().value).toBe('30%')
    await userEvent.clear(field())
    await userEvent.type(field(), '12%{Enter}')
    expect(onValueChange).toHaveBeenLastCalledWith(0.12)
  })

  it('reads currency typed with grouping', async () => {
    const onValueChange = vi.fn()
    render(
      <NumberField
        aria-label="Price"
        locale="en-US"
        formatOptions={{ style: 'currency', currency: 'USD' }}
        onValueChange={onValueChange}
      />,
    )
    await userEvent.type(field(), '$1,234.5')
    await userEvent.tab()
    expect(onValueChange).toHaveBeenLastCalledWith(1234.5)
    expect(field().value).toBe('$1,234.50')
  })

  it('keeps repeating while a button is held', () => {
    vi.useFakeTimers()
    render(<NumberField aria-label="Count" defaultValue={0} />)
    const plus = screen.getByRole('button', { name: 'Increase' })
    fireEvent.pointerDown(plus, { button: 0 })
    expect(field().value).toBe('1')
    act(() => {
      vi.advanceTimersByTime(400 + 60 * 3)
    })
    expect(Number(field().value)).toBeGreaterThanOrEqual(4)
    fireEvent.pointerUp(plus)
    const held = field().value
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(field().value).toBe(held)
  })

  it('ignores the wheel unless asked', () => {
    const { rerender } = render(<NumberField aria-label="N" defaultValue={1} />)
    field().focus()
    fireEvent.wheel(field(), { deltaY: -100 })
    expect(field().value).toBe('1')
    rerender(<NumberField aria-label="N" defaultValue={1} allowWheel />)
    field().focus()
    fireEvent.wheel(field(), { deltaY: -100 })
    expect(field().value).toBe('2')
  })

  it('posts the raw number with a form', () => {
    render(
      <form data-testid="form">
        <NumberField aria-label="Total" name="total" locale="en-US" defaultValue={1500} />
      </form>,
    )
    const data = new FormData(screen.getByTestId('form') as HTMLFormElement)
    expect(data.get('total')).toBe('1500')
    expect(field().value).toBe('1,500')
  })

  it('takes its label and description from a form field', () => {
    render(
      <FormField name="seats" error="Too many">
        <FormLabel>Seats</FormLabel>
        <FormControl>
          <NumberField />
        </FormControl>
      </FormField>,
    )
    const input = screen.getByLabelText('Seats')
    expect(input.getAttribute('role')).toBe('spinbutton')
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(screen.getByRole('button', { name: 'Increase' }).getAttribute('aria-controls')).toBe(
      input.id,
    )
  })

  it('follows a controlled value', () => {
    const { rerender } = render(<NumberField aria-label="C" value={3} />)
    expect(field().value).toBe('3')
    rerender(<NumberField aria-label="C" value={7} />)
    expect(field().value).toBe('7')
  })
})
