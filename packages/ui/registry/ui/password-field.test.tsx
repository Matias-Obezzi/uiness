import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FormControl, FormDescription, FormField, FormLabel } from './form'
import { defaultPasswordFieldLabels, getPasswordStrength, PasswordField } from './password-field'

describe('getPasswordStrength', () => {
  it('is empty for no password', () => {
    expect(getPasswordStrength('').score).toBe(0)
  })

  it('rates short and common passwords weak', () => {
    expect(getPasswordStrength('abc').score).toBe(1)
    expect(getPasswordStrength('Password123!').score).toBe(1)
    expect(getPasswordStrength('Password123!').hint).toMatch(/common/)
  })

  it('rewards length and variety', () => {
    const fair = getPasswordStrength('lanternfig')
    const good = getPasswordStrength('Lantern-fig9')
    const strong = getPasswordStrength('Lantern-fig9-Orbit-Mews')
    expect(fair.score).toBeLessThan(good.score)
    expect(good.score).toBeLessThan(strong.score)
    expect(strong).toMatchObject({ score: 4, label: 'Strong' })
  })

  it('marks down keyboard runs and repeats', () => {
    expect(getPasswordStrength('Xq7!abcdwvz').score).toBeLessThan(
      getPasswordStrength('Xq7!pmrtwvz').score,
    )
    expect(getPasswordStrength('Xq7!aaaawvz').hint).toBeTruthy()
  })
})

describe('PasswordField', () => {
  it('hides the text until the eye is pressed, and says so with aria-pressed', async () => {
    render(<PasswordField aria-label="Password" defaultValue="hunter2" />)
    const input = screen.getByLabelText('Password') as HTMLInputElement
    const toggle = screen.getByRole('button', { name: 'Show password' })
    expect(input.type).toBe('password')
    expect(toggle.getAttribute('aria-pressed')).toBe('false')

    await userEvent.click(toggle)
    expect(input.type).toBe('text')
    expect(toggle.getAttribute('aria-pressed')).toBe('true')
    // The name stays the same: the pressed state is what changes.
    expect(screen.getByRole('button', { name: 'Show password' })).toBe(toggle)
  })

  it('shows a labelled meter that follows the typing', async () => {
    render(<PasswordField aria-label="New password" strength />)
    const input = screen.getByLabelText('New password')
    const meter = screen.getByRole('meter', { hidden: true })
    expect(meter.getAttribute('aria-valuenow')).toBe('0')

    await userEvent.type(input, 'Lantern-fig9-Orbit-Mews')
    expect(meter.getAttribute('aria-valuenow')).toBe('4')
    expect(meter.getAttribute('aria-valuetext')).toBe('Strong')
    expect(screen.getByText('Strong')).toBeTruthy()
    expect(input.getAttribute('aria-describedby')).toContain(meter.parentElement?.id)
    expect(input.getAttribute('autocomplete')).toBe('new-password')
  })

  it('ticks off the rules as they are met', async () => {
    render(<PasswordField aria-label="Password" rules />)
    const input = screen.getByLabelText('Password')
    const number = screen.getByText('A number').closest('li') as HTMLElement
    expect(number.hasAttribute('data-met')).toBe(false)
    await userEvent.type(input, 'a1')
    expect(number.hasAttribute('data-met')).toBe(true)
    expect(number.textContent).toContain('done')
  })

  it('takes a custom scorer', async () => {
    const getStrength = vi.fn(() => ({ score: 2 as const, label: 'Meh' }))
    render(<PasswordField aria-label="P" strength getStrength={getStrength} />)
    await userEvent.type(screen.getByLabelText('P'), 'x')
    expect(screen.getByText('Meh')).toBeTruthy()
  })

  it('keeps the description from a form field next to its own', () => {
    render(
      <FormField name="password">
        <FormLabel>Password</FormLabel>
        <FormControl>
          <PasswordField rules />
        </FormControl>
        <FormDescription>Pick something long.</FormDescription>
      </FormField>,
    )
    const input = screen.getByLabelText('Password')
    const ids = input.getAttribute('aria-describedby')?.split(' ') ?? []
    expect(ids).toContain(screen.getByText('Pick something long.').id)
    expect(ids.length).toBe(2)
  })

  it('is controlled through value and onValueChange', async () => {
    const onValueChange = vi.fn()
    render(<PasswordField aria-label="P" value="" onValueChange={onValueChange} />)
    await userEvent.type(screen.getByLabelText('P'), 'a')
    expect(onValueChange).toHaveBeenCalledWith('a')
    expect((screen.getByLabelText('P') as HTMLInputElement).value).toBe('')
  })
})

describe('PasswordField labels', () => {
  it('scores in another language', () => {
    const strength = getPasswordStrength('password', {
      ...defaultPasswordFieldLabels,
      weak: 'Débil',
      avoidCommon: 'Evita palabras comunes.',
    })
    expect(strength).toMatchObject({ score: 1, label: 'Débil', hint: 'Evita palabras comunes.' })
  })

  it('translates the default rules and the meter', async () => {
    render(
      <PasswordField
        aria-label="P"
        strength
        rules
        labels={{ ruleNumber: 'Un número', strength: 'Seguridad', weak: 'Débil' }}
      />,
    )
    expect(screen.getByText('Un número')).toBeTruthy()
    await userEvent.type(screen.getByLabelText('P'), 'abc')
    const meter = screen.getByRole('meter', { name: 'Seguridad' })
    expect(meter.getAttribute('aria-valuetext')).toBe('Débil')
  })
})
