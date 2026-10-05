import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Stepper, StepperItem } from './stepper'

const steps = [{ title: 'Account' }, { title: 'Profile' }, { title: 'Billing' }, { title: 'Done' }]

const statusOf = (title: string) =>
  screen
    .getAllByText(title)
    .map((el) => el.closest('[data-slot=stepper-item]'))
    .find(Boolean)
    ?.getAttribute('data-status')

describe('Stepper', () => {
  it('works out each status from the value and marks the current step', () => {
    render(<Stepper value={2} steps={steps} />)
    expect(statusOf('Account')).toBe('complete')
    expect(statusOf('Profile')).toBe('complete')
    expect(statusOf('Billing')).toBe('current')
    expect(statusOf('Done')).toBe('upcoming')
    const current = screen.getAllByRole('listitem').filter((li) => li.hasAttribute('aria-current'))
    expect(current).toHaveLength(1)
    expect(current[0]?.getAttribute('aria-current')).toBe('step')
    // The status is spoken, not only shown by color and icon.
    expect(current[0]?.textContent).toContain('current step')
    // Narrow rows spell out the current step under the circles.
    expect(screen.getByText('Step 3 of 4').parentElement?.textContent).toContain('Billing')
  })

  it('fills the line up to the current step', () => {
    const { container } = render(<Stepper value={1} steps={steps} />)
    const lines = container.querySelectorAll('[data-slot=stepper-line] > span')
    expect(lines).toHaveLength(3)
    expect(lines[0]?.className).toContain('scale-100')
    expect(lines[1]?.className).toContain('scale-x-0')
  })

  it('lets people go back to completed steps only', async () => {
    const onValueChange = vi.fn()
    render(<Stepper value={2} steps={steps} onValueChange={onValueChange} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(2)
    await userEvent.click(buttons[0] as HTMLElement)
    expect(onValueChange).toHaveBeenCalledWith(0)
  })

  it('takes items as children, with errors and content', () => {
    render(
      <Stepper value={1} orientation="vertical">
        <StepperItem title="Upload" />
        <StepperItem title="Check" error description="Two rows failed">
          <p>Fix the rows and try again.</p>
        </StepperItem>
        <StepperItem title="Import" />
      </Stepper>,
    )
    expect(statusOf('Check')).toBe('error')
    expect(screen.getByText('Fix the rows and try again.')).toBeTruthy()
    expect(screen.getByRole('list').dataset.orientation).toBe('vertical')
    expect(screen.queryByText(/Step 2 of 3/)).toBeNull()
  })
})
