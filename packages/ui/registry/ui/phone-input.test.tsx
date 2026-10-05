import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { FormControl, FormField, FormLabel } from './form'
import { flagEmoji, formatPhone, PhoneInput, parsePhone, phoneCountries } from './phone-input'

describe('phone helpers', () => {
  it('lays digits on a pattern, separators only once a digit follows', () => {
    expect(formatPhone('5551234567', '(###) ###-####')).toBe('(555) 123-4567')
    expect(formatPhone('555', '(###) ###-####')).toBe('(555')
    expect(formatPhone('5551', '(###) ###-####')).toBe('(555) 1')
    expect(formatPhone('', '(###) ###-####')).toBe('')
  })

  it('splits an international number by the longest calling code', () => {
    expect(parsePhone('+44 7911 123456')).toMatchObject({
      country: { code: 'GB' },
      national: '7911123456',
    })
    expect(parsePhone('+351 912 345 678')?.country.code).toBe('PT')
    expect(parsePhone('0049 30 1234567')?.country.code).toBe('DE')
    // The US and Canada share +1; the preferred one wins.
    expect(parsePhone('+1 416 555 0100', phoneCountries, 'CA')?.country.code).toBe('CA')
    expect(parsePhone('+1 416 555 0100')?.country.code).toBe('US')
    expect(parsePhone('+999')).toBeNull()
  })

  it('has a unique code and a flag for every country', () => {
    const codes = phoneCountries.map((c) => c.code)
    expect(new Set(codes).size).toBe(codes.length)
    expect(codes.length).toBeGreaterThanOrEqual(40)
    expect(flagEmoji('ar')).toBe('🇦🇷')
  })
})

describe('PhoneInput', () => {
  it('formats as you type and hands back E.164', async () => {
    const onValueChange = vi.fn()
    render(<PhoneInput defaultCountry="US" onValueChange={onValueChange} aria-label="Phone" />)
    const input = screen.getByRole('textbox', { name: 'Phone' }) as HTMLInputElement
    await userEvent.type(input, '5551234567')
    expect(input.value).toBe('(555) 123-4567')
    expect(onValueChange).toHaveBeenLastCalledWith(
      '+15551234567',
      expect.objectContaining({ national: '5551234567', complete: true }),
    )
  })

  it('switches to the long layout once the short one is full', async () => {
    const onValueChange = vi.fn()
    render(<PhoneInput defaultCountry="AR" onValueChange={onValueChange} aria-label="Phone" />)
    const input = screen.getByRole('textbox', { name: 'Phone' }) as HTMLInputElement
    await userEvent.type(input, '1123456789')
    expect(input.value).toBe('11 2345-6789')
    await userEvent.clear(input)
    await userEvent.type(input, '91123456789')
    expect(input.value).toBe('9 11 2345-6789')
    expect(onValueChange.mock.lastCall?.[0]).toBe('+5491123456789')
  })

  it('stops at the longest number the country takes', async () => {
    render(<PhoneInput defaultCountry="US" aria-label="Phone" />)
    const input = screen.getByRole('textbox', { name: 'Phone' }) as HTMLInputElement
    await userEvent.type(input, '555123456789')
    expect(input.value).toBe('(555) 123-4567')
  })

  it('drops the trunk prefix typed in front of a national number', async () => {
    const onValueChange = vi.fn()
    render(<PhoneInput defaultCountry="GB" onValueChange={onValueChange} aria-label="Phone" />)
    const input = screen.getByRole('textbox', { name: 'Phone' }) as HTMLInputElement
    await userEvent.type(input, '07911123456')
    expect(input.value).toBe('7911 123456')
    expect(onValueChange.mock.lastCall?.[0]).toBe('+447911123456')
  })

  it('picks the country from a pasted international number', async () => {
    const onValueChange = vi.fn()
    const onCountryChange = vi.fn()
    render(
      <PhoneInput
        defaultCountry="US"
        onValueChange={onValueChange}
        onCountryChange={onCountryChange}
        aria-label="Phone"
      />,
    )
    const input = screen.getByRole('textbox', { name: 'Phone' }) as HTMLInputElement
    input.focus()
    await userEvent.paste('+33 6 12 34 56 78')
    expect(onCountryChange).toHaveBeenLastCalledWith('FR')
    expect(input.value).toBe('6 12 34 56 78')
    expect(onValueChange.mock.lastCall?.[0]).toBe('+33612345678')
    expect(screen.getByRole('button', { name: /\+33/ })).toBeTruthy()
  })

  it('waits for a whole calling code when one is typed', async () => {
    const onCountryChange = vi.fn()
    render(<PhoneInput defaultCountry="US" onCountryChange={onCountryChange} aria-label="Phone" />)
    const input = screen.getByRole('textbox', { name: 'Phone' }) as HTMLInputElement
    await userEvent.type(input, '+35')
    expect(input.value).toBe('+35')
    expect(onCountryChange).not.toHaveBeenCalled()
    await userEvent.type(input, '1912')
    expect(onCountryChange).toHaveBeenLastCalledWith('PT')
    expect(input.value).toBe('912')
  })

  it('takes a separator and the digit before it out together', async () => {
    render(<PhoneInput defaultCountry="US" defaultValue="+15551234567" aria-label="Phone" />)
    const input = screen.getByRole('textbox', { name: 'Phone' }) as HTMLInputElement
    // Caret right after "-", in "(555) 123-|4567".
    await userEvent.type(input, '{Backspace}', {
      initialSelectionStart: 10,
      initialSelectionEnd: 10,
    })
    expect(input.value).toBe('(555) 124-567')
  })

  it('searches countries by name, code or dial code', async () => {
    const onCountryChange = vi.fn()
    render(
      <PhoneInput
        defaultCountry="US"
        locale="en"
        onCountryChange={onCountryChange}
        aria-label="Phone"
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /country/i }))
    await userEvent.type(await screen.findByRole('combobox'), 'germ')
    await userEvent.keyboard('{Enter}')
    expect(onCountryChange).toHaveBeenLastCalledWith('DE')
    expect(screen.getByRole('button', { name: /\+49/ })).toBeTruthy()
  })

  it('limits the list to the given countries', async () => {
    render(<PhoneInput countries={['AR', 'UY']} aria-label="Phone" />)
    await userEvent.click(screen.getByRole('button', { name: /country/i }))
    expect(await screen.findAllByRole('option')).toHaveLength(2)
  })

  it('follows a controlled value and fills a hidden input', async () => {
    function Controlled() {
      const [value, setValue] = useState('+5491123456789')
      return (
        <form>
          <PhoneInput name="phone" value={value} onValueChange={setValue} aria-label="Phone" />
          <button type="button" onClick={() => setValue('+81312345678')}>
            Tokyo
          </button>
        </form>
      )
    }
    const { container } = render(<Controlled />)
    expect(screen.getByRole('button', { name: /\+54/ })).toBeTruthy()
    await userEvent.click(screen.getByText('Tokyo'))
    expect((screen.getByRole('textbox', { name: 'Phone' }) as HTMLInputElement).value).toBe(
      '31-2345-678',
    )
    expect(container.querySelector<HTMLInputElement>('input[name="phone"]')?.value).toBe(
      '+81312345678',
    )
  })

  it('wires the number field into a form field', () => {
    render(
      <FormField name="phone" error="Required">
        <FormLabel>Mobile</FormLabel>
        <FormControl>
          <PhoneInput defaultCountry="US" />
        </FormControl>
      </FormField>,
    )
    const input = screen.getByLabelText('Mobile')
    expect(input.getAttribute('type')).toBe('tel')
    expect(input.getAttribute('aria-invalid')).toBe('true')
  })
})
