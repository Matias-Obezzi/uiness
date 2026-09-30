import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Faq01 } from './faq-01'
import { Pricing01 } from './pricing-01'
import { Testimonials01 } from './testimonials-01'

describe('Pricing01', () => {
  it('renders a labelled section with three plans and their actions', () => {
    render(<Pricing01 />)
    const heading = screen.getByRole('heading', { level: 2 })
    expect(screen.getByRole('region', { name: heading.textContent ?? '' })).toBeTruthy()
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Starter',
      'Pro',
      'Team',
    ])
    expect(screen.getByRole('link', { name: 'Start a 14-day trial' }).getAttribute('href')).toBe(
      '#',
    )
    expect(screen.getByText('Most popular')).toBeTruthy()
  })

  it('switches every price between monthly and yearly billing', async () => {
    render(<Pricing01 />)
    const group = screen.getByRole('radiogroup', { name: 'Billing period' })
    const monthly = within(group).getByRole('radio', { name: 'Monthly' })
    const yearly = within(group).getByRole('radio', { name: 'Yearly' })
    expect(monthly.getAttribute('aria-checked')).toBe('true')
    expect(screen.getByText('$24')).toBeTruthy()
    expect(screen.getByText('$59')).toBeTruthy()

    await userEvent.click(yearly)
    expect(yearly.getAttribute('aria-checked')).toBe('true')
    expect(screen.queryByText('$24')).toBeNull()
    expect(screen.getByText('$19')).toBeTruthy()
    expect(screen.getByText('$47')).toBeTruthy()
    expect(screen.getByText('$228 billed yearly')).toBeTruthy()

    // Clicking the side that is already on keeps it on.
    await userEvent.click(yearly)
    expect(yearly.getAttribute('aria-checked')).toBe('true')

    await userEvent.click(monthly)
    expect(screen.getByText('$24')).toBeTruthy()
  })

  it('takes plans, currency and words from props, and hides what is null', () => {
    render(
      <Pricing01
        eyebrow={null}
        title="Plans"
        description={null}
        note={null}
        currency="EUR"
        defaultBilling="yearly"
        labels={{ popular: 'Best value', billedYearly: 'Paid yearly: {total}' }}
        plans={[
          {
            name: 'Solo',
            price: { monthly: 10, yearly: 8 },
            features: ['One seat'],
            cta: { label: 'Buy Solo', href: '/solo' },
            highlighted: true,
          },
        ]}
      />,
    )
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Plans')
    expect(screen.getByText('€8')).toBeTruthy()
    expect(screen.getByText('Paid yearly: €96')).toBeTruthy()
    expect(screen.getByText('Best value')).toBeTruthy()
    expect(screen.getByText('One seat')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Buy Solo' }).getAttribute('href')).toBe('/solo')
    expect(screen.queryByText('Pricing')).toBeNull()
    expect(screen.queryByText(/exclude tax/)).toBeNull()
  })
})

describe('Testimonials01', () => {
  it('renders a labelled section with every quote once for assistive tech', () => {
    render(<Testimonials01 />)
    const heading = screen.getByRole('heading', { level: 2 })
    const region = screen.getByRole('region', { name: heading.textContent ?? '' })
    // The marquee repeats the rows for a seamless loop; the copies are hidden.
    const visible = within(region)
      .getAllByRole('figure')
      .filter((figure) => !figure.closest('[aria-hidden="true"]'))
    expect(visible).toHaveLength(8)
    expect(region.querySelectorAll('[data-slot="marquee"]')).toHaveLength(2)
  })

  it('shows initials without a photo, the rating and the role', () => {
    render(
      <Testimonials01
        eyebrow={null}
        description={null}
        title="Kind words"
        testimonials={[
          { quote: 'Great.', name: 'Ada Lovelace', role: 'Analyst', rating: 4 },
          { quote: 'Solid.', name: 'Grace Hopper' },
        ]}
      />,
    )
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Kind words')
    expect(screen.getAllByText('AL').length).toBeGreaterThan(0)
    expect(screen.getAllByText('GH').length).toBeGreaterThan(0)
    expect(screen.getAllByRole('img', { name: '4 out of 5 stars' }).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Analyst').length).toBeGreaterThan(0)
    expect(screen.queryByText('Testimonials')).toBeNull()
    // Two people, two rows going opposite ways.
    const rows = document.querySelectorAll('[data-slot="marquee"]')
    expect(rows).toHaveLength(2)
  })
})

describe('Faq01', () => {
  it('renders a labelled section with the first question open', () => {
    render(<Faq01 />)
    const heading = screen.getByRole('heading', { level: 2 })
    expect(screen.getByRole('region', { name: heading.textContent ?? '' })).toBeTruthy()
    const details = document.querySelectorAll('details')
    expect(details).toHaveLength(6)
    expect(details[0]?.open).toBe(true)
    expect(details[1]?.open).toBe(false)
    expect(screen.getByRole('link', { name: /Talk to our team/ }).getAttribute('href')).toBe('#')
  })

  it('opens and closes a question from its summary, which the browser makes keyboard operable', async () => {
    render(
      <Faq01
        defaultOpen={null}
        contact={null}
        items={[
          { question: 'Why?', answer: 'Because.' },
          { question: 'How?', answer: 'Carefully.' },
        ]}
      />,
    )
    const why = screen.getByText('Why?').closest('details') as HTMLDetailsElement
    const how = screen.getByText('How?').closest('details') as HTMLDetailsElement
    expect(why.open).toBe(false)

    await userEvent.click(screen.getByText('Why?'))
    expect(why.open).toBe(true)
    await userEvent.click(screen.getByText('Why?'))
    expect(why.open).toBe(false)

    // A native <summary> is focusable and toggles with Enter and Space in every browser.
    expect(how.querySelector(':scope > summary')?.textContent).toBe('How?')
    await userEvent.click(screen.getByText('How?'))
    expect(how.open).toBe(true)
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('groups the questions when only one may be open', () => {
    render(<Faq01 exclusive />)
    const names = [...document.querySelectorAll('details')].map((d) => d.getAttribute('name'))
    expect(names[0]).toBeTruthy()
    expect(new Set(names).size).toBe(1)
  })
})
