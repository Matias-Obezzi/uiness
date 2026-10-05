import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { BillingToggle, Price } from './billing-toggle'

describe('BillingToggle', () => {
  it('is a radio group with the savings on the yearly option', () => {
    render(<BillingToggle savings={0.2} locale="en-US" />)
    screen.getByRole('radiogroup', { name: 'Billing period' })
    const monthly = screen.getByRole('radio', { name: 'Monthly' })
    const yearly = screen.getByRole('radio', { name: 'Yearly Save 20%' })
    expect(monthly.getAttribute('aria-checked')).toBe('true')
    expect(monthly.tabIndex).toBe(0)
    expect(yearly.tabIndex).toBe(-1)
  })

  it('switches on click and with the arrow keys, moving focus along', async () => {
    const onValueChange = vi.fn()
    render(<BillingToggle onValueChange={onValueChange} />)
    await userEvent.click(screen.getByRole('radio', { name: 'Yearly' }))
    expect(onValueChange).toHaveBeenLastCalledWith('yearly')
    const yearly = screen.getByRole('radio', { name: 'Yearly' })
    expect(yearly.getAttribute('aria-checked')).toBe('true')
    fireEvent.keyDown(yearly, { key: 'ArrowLeft' })
    expect(onValueChange).toHaveBeenLastCalledWith('monthly')
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'Monthly' }))
  })

  it('follows a controlled value', async () => {
    function Controlled() {
      const [value, setValue] = React.useState<'monthly' | 'yearly'>('yearly')
      return (
        <>
          <BillingToggle value={value} onValueChange={setValue} savings="2 months free" />
          <output>{value}</output>
        </>
      )
    }
    render(<Controlled />)
    expect(screen.getByRole('radio', { name: /Yearly/ }).getAttribute('aria-checked')).toBe('true')
    expect(screen.getByText('2 months free')).toBeTruthy()
    await userEvent.click(screen.getByRole('radio', { name: 'Monthly' }))
    expect(screen.getByRole('status').textContent).toBe('monthly')
  })
})

describe('Price', () => {
  it('formats the amount in the currency and drops cents on whole amounts', () => {
    const { rerender } = render(<Price amount={24} locale="en-US" period="/month" />)
    expect(screen.getByText('$24', { selector: '.sr-only' })).toBeTruthy()
    expect(screen.getByText('/month')).toBeTruthy()
    rerender(<Price amount={19.5} currency="EUR" locale="de-DE" />)
    expect(screen.getByText('19,50 €', { selector: '.sr-only' })).toBeTruthy()
  })
})
