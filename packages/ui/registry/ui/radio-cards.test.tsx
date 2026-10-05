import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FormControl, FormField, FormLabel } from './form'
import {
  RadioCards,
  RadioCardsDescription,
  RadioCardsItem,
  RadioCardsPrice,
  RadioCardsTitle,
} from './radio-cards'

function Plans(props: React.ComponentProps<typeof RadioCards>) {
  return (
    <RadioCards aria-label="Plan" {...props}>
      <RadioCardsItem value="free">
        <RadioCardsTitle>Free</RadioCardsTitle>
        <RadioCardsDescription>For trying it out.</RadioCardsDescription>
        <RadioCardsPrice>$0</RadioCardsPrice>
      </RadioCardsItem>
      <RadioCardsItem value="pro">
        <RadioCardsTitle>Pro</RadioCardsTitle>
        <RadioCardsDescription>For a small team.</RadioCardsDescription>
        <RadioCardsPrice>$12</RadioCardsPrice>
      </RadioCardsItem>
      <RadioCardsItem value="legacy" disabled>
        <RadioCardsTitle>Legacy</RadioCardsTitle>
      </RadioCardsItem>
      <RadioCardsItem value="team">
        <RadioCardsTitle>Team</RadioCardsTitle>
      </RadioCardsItem>
    </RadioCards>
  )
}

describe('RadioCards', () => {
  it('is a radio group named by titles and described by the rest', () => {
    render(<Plans />)
    expect(screen.getByRole('radiogroup', { name: 'Plan' })).toBeTruthy()
    const pro = screen.getByRole('radio', { name: 'Pro' })
    const ids = pro.getAttribute('aria-describedby')?.split(' ') ?? []
    expect(ids.map((id) => document.getElementById(id)?.textContent)).toEqual([
      'For a small team.',
      '$12',
    ])
  })

  it('selects on click and reports the value', async () => {
    const onValueChange = vi.fn()
    render(<Plans onValueChange={onValueChange} />)
    await userEvent.click(screen.getByRole('radio', { name: 'Pro' }))
    expect(onValueChange).toHaveBeenCalledWith('pro')
    expect(screen.getByRole('radio', { name: 'Pro' }).getAttribute('aria-checked')).toBe('true')
  })

  it('is one tab stop, and the arrow keys select while skipping disabled cards', async () => {
    render(<Plans defaultValue="pro" />)
    await userEvent.tab()
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'Pro' }))
    // Radix checks a card when it takes focus while an arrow key is still down, as in a browser.
    await userEvent.keyboard('{ArrowDown>}')
    await userEvent.keyboard('{/ArrowDown}')
    const team = screen.getByRole('radio', { name: 'Team' })
    expect(document.activeElement).toBe(team)
    expect(team.getAttribute('aria-checked')).toBe('true')
    await userEvent.tab()
    expect(document.activeElement).toBe(document.body)
  })

  it('places the ring on the checked card', async () => {
    render(<Plans defaultValue="free" />)
    const ring = document.querySelector('[data-slot=radio-cards-ring]') as HTMLElement
    expect(ring.style.opacity).toBe('1')
    await userEvent.click(screen.getByRole('radio', { name: 'Pro' }))
    expect(ring.style.opacity).toBe('1')
  })

  it('hides the ring when nothing is picked', () => {
    render(<Plans />)
    const ring = document.querySelector('[data-slot=radio-cards-ring]') as HTMLElement
    expect(ring.style.opacity).toBe('0')
  })

  it('posts its value with a form and takes a form label', () => {
    render(
      <form>
        <FormField name="plan">
          <FormLabel>Plan</FormLabel>
          <FormControl>
            <Plans aria-label={undefined} name="plan" defaultValue="team" />
          </FormControl>
        </FormField>
      </form>,
    )
    expect(screen.getByRole('radiogroup', { name: 'Plan' })).toBeTruthy()
    const form = document.querySelector('form') as HTMLFormElement
    expect(new FormData(form).get('plan')).toBe('team')
  })
})
