import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { FormControl, FormField, FormLabel } from './form'
import { MoneyInput } from './money-input'

const field = () => screen.getByRole('textbox') as HTMLInputElement

describe('MoneyInput', () => {
  it('groups as you type and hands back minor units', async () => {
    const onValueChange = vi.fn()
    render(<MoneyInput locale="en-US" currency="USD" onValueChange={onValueChange} />)
    await userEvent.type(field(), '1234567.8')
    expect(field().value).toBe('1,234,567.8')
    expect(onValueChange).toHaveBeenLastCalledWith(123456780)
  })

  it('pads the cents once focus leaves', async () => {
    render(<MoneyInput locale="en-US" currency="USD" />)
    await userEvent.type(field(), '12.5')
    await userEvent.tab()
    expect(field().value).toBe('12.50')
  })

  it('keeps to the currency decimals', async () => {
    const onValueChange = vi.fn()
    render(<MoneyInput locale="en-US" currency="USD" onValueChange={onValueChange} />)
    await userEvent.type(field(), '9.999')
    expect(field().value).toBe('9.99')
    expect(onValueChange).toHaveBeenLastCalledWith(999)
  })

  it('has no decimals for a currency without them', async () => {
    const onValueChange = vi.fn()
    render(<MoneyInput locale="ja-JP" currency="JPY" onValueChange={onValueChange} />)
    await userEvent.type(field(), '12345.6')
    expect(field().value).toBe('123,456')
    expect(onValueChange).toHaveBeenLastCalledWith(123456)
  })

  it('uses the locale separators and puts the symbol where the locale does', async () => {
    const onValueChange = vi.fn()
    const { container } = render(
      <MoneyInput locale="de-DE" currency="EUR" onValueChange={onValueChange} />,
    )
    await userEvent.type(field(), '1234,56')
    expect(field().value).toBe('1.234,56')
    expect(onValueChange).toHaveBeenLastCalledWith(123456)
    const root = container.querySelector('[data-slot="money-input"]')
    expect(root?.lastElementChild?.textContent).toBe('€')
  })

  it('takes either separator key as the decimal one', async () => {
    const onValueChange = vi.fn()
    render(<MoneyInput locale="de-DE" currency="EUR" onValueChange={onValueChange} />)
    await userEvent.type(field(), '10.5')
    expect(field().value).toBe('10,5')
    expect(onValueChange).toHaveBeenLastCalledWith(1050)
  })

  it('takes a group separator and the digit before it out together', async () => {
    render(<MoneyInput locale="en-US" currency="USD" defaultValue={123400} />)
    expect(field().value).toBe('1,234.00')
    // Caret right after the comma in "1,|234.00".
    await userEvent.type(field(), '{Backspace}', {
      initialSelectionStart: 2,
      initialSelectionEnd: 2,
    })
    expect(field().value).toBe('234.00')
  })

  it('steps with the arrow keys and clamps to min and max', async () => {
    const onValueChange = vi.fn()
    render(
      <MoneyInput
        locale="en-US"
        currency="USD"
        defaultValue={150}
        max={300}
        onValueChange={onValueChange}
      />,
    )
    field().focus()
    await userEvent.keyboard('{ArrowUp}')
    expect(onValueChange).toHaveBeenLastCalledWith(250)
    expect(field().value).toBe('2.50')
    await userEvent.keyboard('{ArrowUp}')
    expect(onValueChange).toHaveBeenLastCalledWith(300)
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}')
    expect(onValueChange).toHaveBeenLastCalledWith(0)
  })

  it('flips the sign with a minus only when negatives are allowed', async () => {
    const onValueChange = vi.fn()
    const { rerender } = render(
      <MoneyInput locale="en-US" currency="USD" onValueChange={onValueChange} />,
    )
    await userEvent.type(field(), '-5')
    expect(field().value).toBe('5')
    rerender(
      <MoneyInput locale="en-US" currency="USD" allowNegative onValueChange={onValueChange} />,
    )
    await userEvent.type(field(), '-')
    expect(field().value).toBe('-5')
    expect(onValueChange).toHaveBeenLastCalledWith(-500)
  })

  it('clears to null', async () => {
    const onValueChange = vi.fn()
    render(<MoneyInput currency="USD" defaultValue={500} onValueChange={onValueChange} />)
    await userEvent.clear(field())
    expect(onValueChange).toHaveBeenLastCalledWith(null)
  })

  it('follows a controlled value without rewriting what is being typed', async () => {
    function Controlled() {
      const [value, setValue] = useState<number | null>(99)
      return (
        <>
          <MoneyInput locale="en-US" currency="USD" value={value} onValueChange={setValue} />
          <output>{String(value)}</output>
          <button type="button" onClick={() => setValue(100000)}>
            Set
          </button>
        </>
      )
    }
    render(<Controlled />)
    expect(field().value).toBe('0.99')
    await userEvent.clear(field())
    await userEvent.type(field(), '3.')
    expect(field().value).toBe('3.')
    expect(screen.getByText('300')).toBeTruthy()
    await userEvent.click(screen.getByText('Set'))
    expect(field().value).toBe('1,000.00')
  })

  it('carries minor units in a hidden input and joins a form field', () => {
    const { container } = render(
      <FormField name="price">
        <FormLabel>Price</FormLabel>
        <FormControl>
          <MoneyInput currency="USD" name="price" defaultValue={1999} />
        </FormControl>
      </FormField>,
    )
    expect(screen.getByLabelText('Price')).toBe(field())
    expect(container.querySelector<HTMLInputElement>('input[name="price"]')?.value).toBe('1999')
  })
})
