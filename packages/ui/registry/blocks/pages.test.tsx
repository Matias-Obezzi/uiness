import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type * as React from 'react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { Dashboard01 } from './dashboard-01'
import { NotFound01 } from './not-found-01'
import { Product01 } from './product-01'
import { Settings01 } from './settings-01'

// The viewer needs WebGL, which jsdom has none of; the block only places it.
vi.mock('@uiness/three', () => ({
  Viewer: ({ children, alt, className }: React.ComponentProps<'div'> & { alt?: string }) => (
    <div data-slot="viewer" role="img" aria-label={alt} className={className}>
      {children}
    </div>
  ),
  useViewer: () => ({
    viewer: null,
    state: {
      status: 'ready',
      progress: 1,
      autoRotate: false,
      wireframe: false,
      fullscreen: false,
      view: 'iso',
    },
    actions: {
      resetView: vi.fn(),
      zoom: vi.fn(),
      setView: vi.fn(),
      toggleAutoRotate: vi.fn(),
      toggleWireframe: vi.fn(),
      setBackground: vi.fn(),
      toggleFullscreen: vi.fn(),
      screenshot: vi.fn(),
    },
  }),
}))

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
})

describe('Dashboard01', () => {
  it('lists recent orders with their status', () => {
    render(<Dashboard01 />)
    const table = screen.getByRole('table')
    const rows = within(table).getAllByRole('row').slice(1)
    expect(rows).toHaveLength(5)
    expect(within(rows[0] as HTMLElement).getByText('#3210')).toBeTruthy()
    expect(within(rows[3] as HTMLElement).getByText('Refunded')).toBeTruthy()
  })

  it('exports the days in the chosen range', async () => {
    const user = userEvent.setup()
    const onExport = vi.fn()
    render(<Dashboard01 onExport={onExport} />)
    await user.click(screen.getByRole('button', { name: 'Export' }))
    expect(onExport).toHaveBeenLastCalledWith(expect.any(Array))
    expect(onExport.mock.lastCall?.[0]).toHaveLength(30)
    await user.click(screen.getByRole('radio', { name: '7 days' }))
    await user.click(screen.getByRole('button', { name: 'Export' }))
    expect(onExport.mock.lastCall?.[0]).toHaveLength(7)
  })

  it('reads out a day and its value from each sparkline', () => {
    render(<Dashboard01 />)
    const sparks = document.querySelectorAll<SVGElement>(
      '[data-slot=block-dashboard-01] svg[role=img][tabindex="0"]',
    )
    expect(sparks).toHaveLength(4)
    act(() => (sparks[0] as SVGElement).focus())
    const tip = document.querySelector('[data-slot=sparkline-tooltip]')
    // The last day of the default data, with the revenue in dollars.
    expect(tip?.textContent).toMatch(/^\$[\d,]+Oct 6$/)
    act(() => (sparks[2] as SVGElement).focus())
    expect(document.querySelector('[data-slot=sparkline-tooltip]')?.textContent).toMatch(/%Oct 6$/)
  })

  it('hides export without a handler', () => {
    render(<Dashboard01 />)
    expect(screen.queryByRole('button', { name: 'Export' })).toBeNull()
  })
})

describe('Settings01', () => {
  it('saves only a changed profile, and saves it again after another change', async () => {
    const user = userEvent.setup()
    const onSaveProfile = vi.fn()
    render(<Settings01 onSaveProfile={onSaveProfile} />)
    const save = screen.getByRole('button', { name: 'Save changes' }) as HTMLButtonElement
    expect(save.disabled).toBe(true)
    const name = screen.getByLabelText('Name')
    await user.clear(name)
    await user.type(name, 'Ana R.')
    expect(save.disabled).toBe(false)
    await user.click(save)
    expect(onSaveProfile).toHaveBeenCalledWith(expect.objectContaining({ name: 'Ana R.' }))
    expect(screen.getByText('Saved').closest('[role=status]')).toBeTruthy()
    expect(save.disabled).toBe(true)
    await user.type(name, 'x')
    expect(save.disabled).toBe(false)
  })

  it('flips a notification and reports it', async () => {
    const user = userEvent.setup()
    const onNotificationChange = vi.fn()
    render(<Settings01 onNotificationChange={onNotificationChange} />)
    const product = screen.getByRole('switch', { name: 'Product updates' })
    expect(product.getAttribute('aria-checked')).toBe('false')
    await user.click(product)
    expect(onNotificationChange).toHaveBeenCalledWith('product', true)
    expect(product.getAttribute('aria-checked')).toBe('true')
  })

  it('hides the danger zone without a delete handler', () => {
    render(<Settings01 onDeleteAccount={null} />)
    expect(screen.queryByText('Danger zone')).toBeNull()
    expect(
      within(screen.getByRole('navigation', { name: 'Settings sections' })).getAllByRole('link'),
    ).toHaveLength(2)
  })
})

describe('Product01', () => {
  it('keeps a sold out color visible but out of reach, and prices per color', async () => {
    const user = userEvent.setup()
    render(<Product01 />)
    expect(screen.getByText('$1,290')).toBeTruthy()
    const soldOut = screen.getByRole('radio', {
      name: 'Night linen, sold out',
    }) as HTMLButtonElement
    expect(soldOut.disabled).toBe(true)
    await user.click(screen.getByRole('radio', { name: 'Peacock velvet' }))
    expect(screen.getByText('$1,340')).toBeTruthy()
  })

  it('adds the chosen color to the cart', async () => {
    const user = userEvent.setup()
    const onAddToCart = vi.fn()
    render(<Product01 onAddToCart={onAddToCart} />)
    await user.click(screen.getByRole('button', { name: 'Add to cart' }))
    expect(onAddToCart).toHaveBeenCalledWith(expect.objectContaining({ id: 'mango' }))
    expect(screen.getByRole('status').textContent).toBe('Added to cart')
  })

  it('places the model with its description', () => {
    render(<Product01 />)
    expect(screen.getByRole('img', { name: 'The Sheen lounge chair in 3D' })).toBeTruthy()
  })
})

describe('NotFound01', () => {
  it('says the code to screen readers once, and searches with a plain form', () => {
    render(<NotFound01 />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      '404. This page took a day off',
    )
    // jsdom has no role for <search> yet; browsers expose it as the search landmark.
    const form = document.querySelector('search > form')
    expect(form?.getAttribute('action')).toBe('/search')
    expect(form?.getAttribute('method')).toBe('get')
    expect(screen.getByRole('searchbox', { name: 'Search the site' }).getAttribute('name')).toBe(
      'q',
    )
  })

  it('hands the query to onSearch instead of leaving', async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()
    render(<NotFound01 onSearch={onSearch} />)
    await user.type(screen.getByRole('searchbox'), '  pricing  ')
    await user.click(screen.getByRole('button', { name: 'Search' }))
    expect(onSearch).toHaveBeenCalledWith('pricing')
  })

  it('lists popular pages and the way home', () => {
    render(<NotFound01 />)
    const popular = screen.getByRole('navigation', { name: 'Popular pages' })
    expect(within(popular).getAllByRole('link')).toHaveLength(3)
    expect(screen.getByRole('link', { name: 'Back to home' }).getAttribute('href')).toBe('/')
  })
})
