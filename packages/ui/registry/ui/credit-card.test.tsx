import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  CreditCard,
  CreditCardForm,
  cardBrand,
  expiryState,
  formatCardNumber,
  luhn,
} from './credit-card'

// The test numbers each brand publishes; none can be charged.
describe('card helpers', () => {
  it.each([
    ['4242424242424242', 'visa'],
    ['5555555555554444', 'mastercard'],
    ['2223003122003222', 'mastercard'],
    ['378282246310005', 'amex'],
    ['6011111111111117', 'discover'],
    ['3056930009020004', 'diners'],
    ['3566002020360505', 'jcb'],
    ['6200000000000005', 'unionpay'],
    ['9999', 'unknown'],
  ])('finds the brand of %s', (number, brand) => {
    expect(cardBrand(number)).toBe(brand)
  })

  it('spaces each brand its own way', () => {
    expect(formatCardNumber('4242424242424242')).toBe('4242 4242 4242 4242')
    expect(formatCardNumber('378282246310005')).toBe('3782 822463 10005')
    expect(formatCardNumber('30569309025904')).toBe('3056 930902 5904')
  })

  it('checks the Luhn digit', () => {
    expect(luhn('4242424242424242')).toBe(true)
    expect(luhn('4242424242424241')).toBe(false)
  })

  it('takes an expiry through the last day of its month', () => {
    const now = new Date(2026, 9, 15)
    expect(expiryState('10/26', now)).toBe('valid')
    expect(expiryState('09/26', now)).toBe('expired')
    expect(expiryState('13/30', now)).toBe('invalid')
    expect(expiryState('1/30', now)).toBe('invalid')
  })
})

describe('CreditCard', () => {
  it('shows only the last four of a saved card, and says whose it is', () => {
    render(<CreditCard number="4242424242424242" masked />)
    const card = screen.getByRole('img', { name: 'Visa card ending in 4242' })
    expect(card.textContent).toContain('•••• •••• •••• 4242')
  })

  it('prints the issuer when it is known', () => {
    render(<CreditCard number="4242424242424242" issuer="Test Bank" masked />)
    const card = screen.getByRole('img', { name: 'Test Bank, Visa card ending in 4242' })
    expect(card.textContent).toContain('Test Bank')
  })

  it("takes the issuer's colors and mark over the network's", () => {
    const { container } = render(
      <CreditCard
        number="4242424242424242"
        issuer={{
          name: 'Test Bank',
          background: '#00f068',
          foreground: '#000000',
          icon: 'M0 0h24v24H0z',
        }}
      />,
    )
    const faces = container.querySelectorAll<HTMLElement>('[data-slot=credit-card] > div > div')
    for (const face of faces) {
      expect(face.style.background).toBe('rgb(0, 240, 104)')
      expect(face.style.color).toBe('rgb(0, 0, 0)')
    }
    expect(container.querySelector('path[d="M0 0h24v24H0z"]')).toBeTruthy()
    expect(screen.getByRole('img', { name: 'Test Bank, Visa card ending in 4242' })).toBeTruthy()
  })
})

describe('CreditCardForm', () => {
  const field = (name: RegExp) => screen.getByLabelText(name) as HTMLInputElement
  const back = (container: HTMLElement) =>
    container.querySelector('[data-slot=credit-card] > div')?.className.includes('rotateY(180deg)')

  it('spaces the number, finds the brand and moves on once it is complete', () => {
    const { container } = render(<CreditCardForm />)
    fireEvent.change(field(/card number/i), { target: { value: '4242424242424242' } })
    expect(field(/card number/i).value).toBe('4242 4242 4242 4242')
    expect(container.querySelector('[data-brand]')?.getAttribute('data-brand')).toBe('visa')
    expect(document.activeElement).toBe(field(/name on card/i))
  })

  it('turns the card over for a code on the back, and not for American Express', () => {
    const { container } = render(<CreditCardForm />)
    const number = field(/card number/i)
    const cvc = field(/security code/i)
    fireEvent.change(number, { target: { value: '4242424242424242' } })
    fireEvent.focus(cvc)
    expect(back(container)).toBe(true)
    expect(screen.getByText('3 digits on the back')).toBeTruthy()

    fireEvent.change(number, { target: { value: '378282246310005' } })
    fireEvent.focus(cvc)
    expect(back(container)).toBe(false)
    expect(screen.getByText('4 digits on the front, above the number')).toBeTruthy()
    expect(cvc.getAttribute('placeholder')).toBe('••••')
  })

  it('writes the expiry as MM/YY, a lone 4 being April', () => {
    render(<CreditCardForm />)
    fireEvent.change(field(/expiry/i), { target: { value: '4' } })
    expect(field(/expiry/i).value).toBe('04/')
  })

  it('shows what is wrong once a field is left, and reports it all on change', () => {
    const onChange = vi.fn()
    render(<CreditCardForm onChange={onChange} />)
    const number = field(/card number/i)
    fireEvent.change(number, { target: { value: '4242424242424241' } })
    expect(screen.getByText('Check the card number')).toBeTruthy()
    expect(number.getAttribute('aria-invalid')).toBe('true')

    fireEvent.change(number, { target: { value: '4242424242424242' } })
    fireEvent.change(field(/name on card/i), { target: { value: 'Ana Duarte' } })
    fireEvent.change(field(/expiry/i), { target: { value: '0830' } })
    fireEvent.change(field(/security code/i), { target: { value: '123' } })
    expect(onChange).toHaveBeenLastCalledWith(
      { number: '4242424242424242', name: 'Ana Duarte', expiry: '08/30', cvc: '123' },
      { brand: 'visa', valid: true, errors: {} },
    )
  })
})
