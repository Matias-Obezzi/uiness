import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbTrail,
} from './breadcrumb'

const items = [
  { label: 'Home', href: '/' },
  { label: 'Projects', href: '/projects' },
  { label: 'Acme', href: '/projects/acme' },
  { label: 'Design', href: '/projects/acme/design' },
  { label: 'Components', href: '/projects/acme/design/components' },
  { label: 'Button' },
]

describe('Breadcrumb', () => {
  it('is a named navigation landmark with the current page marked', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Settings</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    )
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(within(nav).getByRole('link', { name: 'Home' }).getAttribute('href')).toBe('/')
    expect(screen.getByText('Settings').getAttribute('aria-current')).toBe('page')
    // Separators are decoration, kept out of the list a screen reader counts.
    expect(within(nav).getAllByRole('listitem')).toHaveLength(2)
  })

  it('renders the child element with asChild', () => {
    render(
      <BreadcrumbLink asChild>
        <button type="button">Back</button>
      </BreadcrumbLink>,
    )
    expect(screen.getByRole('button', { name: 'Back' }).dataset.slot).toBe('breadcrumb-link')
  })
})

describe('BreadcrumbTrail', () => {
  it('shows every crumb when there are few enough', () => {
    render(<BreadcrumbTrail items={items.slice(0, 3)} />)
    expect(screen.getAllByRole('link')).toHaveLength(2)
    expect(screen.queryByRole('button')).toBeNull()
  })

  // The point of the trail: the first crumb and the current page never fold away, and the
  // folded ones stay reachable from a menu.
  it('folds the middle crumbs into a menu past maxItems', async () => {
    render(<BreadcrumbTrail items={items} maxItems={4} />)
    const nav = screen.getByRole('navigation')
    expect(within(nav).getByRole('link', { name: 'Home' })).toBeTruthy()
    expect(within(nav).getByRole('link', { name: 'Components' })).toBeTruthy()
    expect(within(nav).getAllByText('Button')[0]?.closest('[aria-current]')).toBeTruthy()
    expect(within(nav).queryByRole('link', { name: 'Acme' })).toBeNull()

    await userEvent.click(within(nav).getByRole('button', { name: 'Show 3 more' }))
    const menu = await screen.findByRole('menu')
    const links = within(menu).getAllByRole('menuitem')
    expect(links.map((l) => l.textContent)).toEqual(['Projects', 'Acme', 'Design'])
    expect(links[1]?.getAttribute('href')).toBe('/projects/acme')
  })

  it('renders links through renderLink', () => {
    render(
      <BreadcrumbTrail
        items={items.slice(0, 2).concat({ label: 'Here' })}
        renderLink={({ href, children }) => <a href={`#${href}`}>{children}</a>}
      />,
    )
    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('href')).toBe('#/')
  })
})
