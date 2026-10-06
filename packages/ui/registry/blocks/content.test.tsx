import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StarIcon } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { Features01 } from './features-01'
import { Features02 } from './features-02'
import { Hero02 } from './hero-02'
import { Logos01 } from './logos-01'
import { Stats01 } from './stats-01'

/** The section a heading labels, found by the heading's own text. */
function regionOf(level: number) {
  const heading = screen.getByRole('heading', { level })
  return screen.getByRole('region', { name: heading.textContent ?? '' })
}

describe('Hero02', () => {
  it('renders a labelled section with actions, stats and the drawn mockup', () => {
    const { container } = render(<Hero02 />)
    expect(regionOf(1)).toBeTruthy()
    expect(screen.getByRole('link', { name: /Start free trial/ }).getAttribute('href')).toBe('#')
    expect(screen.getByRole('link', { name: 'Book a demo' })).toBeTruthy()
    expect(screen.getByText('uptime last year')).toBeTruthy()
    expect(screen.queryByRole('img')).toBeNull()
    expect(container.querySelector('[data-slot=tilt-card]')).toBeTruthy()
  })

  it('takes its words from props, shows an image and hides what is null', () => {
    render(
      <Hero02
        eyebrow={null}
        title="Plan the week in five minutes"
        primaryAction={{ label: 'Start free', href: '/signup' }}
        secondaryAction={null}
        stats={[{ value: '3x', label: 'faster planning' }]}
        image={{ src: '/shot.png', alt: 'The planner' }}
        badge={null}
      />,
    )
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Plan the week in five minutes',
    )
    expect(screen.getByRole('link', { name: /Start free/ }).getAttribute('href')).toBe('/signup')
    expect(screen.queryByRole('link', { name: 'Book a demo' })).toBeNull()
    expect(screen.getByRole('img', { name: 'The planner' }).getAttribute('src')).toBe('/shot.png')
    expect(screen.getByText('faster planning')).toBeTruthy()
    expect(screen.queryByText('conversion this week')).toBeNull()
    expect(screen.queryByText('Analytics for product teams')).toBeNull()
  })
})

describe('Features01', () => {
  it('renders six features under a labelled heading', () => {
    render(<Features01 />)
    const region = regionOf(2)
    expect(within(region).getAllByRole('heading', { level: 3 })).toHaveLength(6)
  })

  it('renders the features it is given and reveals them', async () => {
    const { container } = render(
      <Features01
        eyebrow={null}
        title="Why us"
        features={[
          { icon: <StarIcon />, title: 'One', description: 'First.' },
          { title: 'Two', description: 'Second.' },
        ]}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Why us' })).toBeTruthy()
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'One',
      'Two',
    ])
    expect(screen.queryByText('Features')).toBeNull()
    // Without IntersectionObserver the reveal plays straight away.
    await act(async () => {})
    const cells = container.querySelectorAll('[data-slot=reveal] > *')
    expect([...cells].map((c) => c.getAttribute('data-state'))).toEqual(['visible', 'visible'])
  })
})

describe('Features02', () => {
  it('renders the bento with live previews and working switches', async () => {
    const user = userEvent.setup()
    const { container } = render(<Features02 />)
    const region = regionOf(2)
    expect(within(region).getAllByRole('heading', { level: 3 })).toHaveLength(4)
    expect(container.querySelector('[data-slot=odometer]')).toBeTruthy()
    expect(container.querySelectorAll('[data-slot=marquee]').length).toBeGreaterThan(0)
    expect(container.querySelector('[data-slot=number-ticker]')).toBeTruthy()

    const sync = screen.getByRole('switch', { name: 'Realtime sync' })
    expect(sync.getAttribute('aria-checked')).toBe('true')
    expect(screen.getByText('Live')).toBeTruthy()
    expect(screen.getByText('2 of 3 enabled')).toBeTruthy()
    await user.click(sync)
    expect(sync.getAttribute('aria-checked')).toBe('false')
    expect(screen.getByText('Paused')).toBeTruthy()
    await user.click(screen.getByText('Weekly digest'))
    expect(screen.getByText('2 of 3 enabled')).toBeTruthy()
  })

  it('renders the cells it is given', () => {
    render(
      <Features02
        title="Bento"
        features={[
          { title: 'Alpha', description: 'A.', visual: <div>Preview A</div>, wide: true },
          { title: 'Beta', description: 'B.' },
        ]}
      />,
    )
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Alpha',
      'Beta',
    ])
    expect(screen.getByText('Preview A')).toBeTruthy()
    expect(screen.queryByRole('switch')).toBeNull()
  })
})

describe('Logos01', () => {
  it('renders the line and a marquee of wordmarks', () => {
    const { container } = render(<Logos01 />)
    expect(regionOf(2).textContent).toContain('Ridgeline')
    const marquee = container.querySelector('[data-slot=marquee]')
    expect(marquee).toBeTruthy()
    // The first copy is read, the repeats are hidden.
    const groups = container.querySelectorAll('[data-slot=marquee-group]')
    expect(groups[0]?.getAttribute('aria-hidden')).toBeNull()
    expect(groups[1]?.getAttribute('aria-hidden')).toBe('true')
  })

  it('takes its logos and line from props', () => {
    const { container } = render(
      <Logos01 title="Used by" logos={[{ name: 'Acme' }, { name: 'Globex' }]} duration={20} />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Used by' })).toBeTruthy()
    const first = container.querySelector('[data-slot=marquee-group]')
    expect(first?.textContent).toBe('AcmeGlobex')
    expect(
      container
        .querySelector<HTMLElement>('[data-slot=marquee]')
        ?.style.getPropertyValue('--duration'),
    ).toBe('20s')
  })
})

describe('Stats01', () => {
  it('renders four figures as a description list', () => {
    render(<Stats01 />)
    const region = regionOf(2)
    const terms = within(region).getAllByRole('term')
    expect(terms.map((t) => t.textContent)).toEqual(['Teams', 'Uptime', 'Saved', 'Median response'])
    // Screen readers get the final value straight away.
    expect(within(region).getByText('99.99')).toBeTruthy()
  })

  it('takes its figures from props', () => {
    render(
      <Stats01
        eyebrow={null}
        title="Growth"
        description="Last quarter."
        stats={[
          { value: 7, prefix: '+', suffix: '%', label: 'Revenue', caption: 'quarter on quarter' },
        ]}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Growth' })).toBeTruthy()
    expect(screen.getByText('Last quarter.')).toBeTruthy()
    expect(screen.getByRole('term').textContent).toBe('Revenue')
    const figure = screen.getAllByRole('definition')[0]
    expect(figure?.textContent).toContain('+')
    expect(figure?.textContent).toContain('%')
    expect(screen.getByText('quarter on quarter')).toBeTruthy()
    expect(screen.queryByText('By the numbers')).toBeNull()
  })
})
