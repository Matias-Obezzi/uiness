import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { Comparison01 } from './comparison-01'
import { Newsletter01 } from './newsletter-01'

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

/** A promise the test settles by hand, to look at the pending state in between. */
function deferred() {
  let resolve!: () => void
  let reject!: (error: Error) => void
  const promise = new Promise<void>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const stack = () =>
  within(screen.getByRole('list', { name: 'Recent issues' }))
    .getAllByRole('listitem')
    .map((li) => li.querySelector('h3')?.textContent)

describe('Newsletter01', () => {
  it('renders the form beside a stack of three issues', () => {
    render(<Newsletter01 />)
    const heading = screen.getByRole('heading', { level: 2 })
    expect(screen.getByRole('region', { name: heading.textContent ?? '' })).toBeTruthy()
    expect(screen.getByLabelText('Email address')).toBeTruthy()
    // Oldest at the back, newest painted last, on top.
    expect(stack()).toEqual([
      'Motion that explains',
      'The quiet power of defaults',
      'Designing for the second visit',
    ])
  })

  it('checks the address before sending anything', async () => {
    const user = userEvent.setup()
    const onSubscribe = vi.fn()
    render(<Newsletter01 onSubscribe={onSubscribe} />)
    const field = screen.getByLabelText('Email address')
    await user.click(screen.getByRole('button', { name: /Subscribe/ }))
    expect(screen.getByRole('alert').textContent).toMatch(/Enter an email address/)
    expect(field.getAttribute('aria-invalid')).toBe('true')
    await user.type(field, 'not-an-email')
    // Typing clears the complaint until the next try.
    expect(screen.queryByRole('alert')).toBeNull()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(onSubscribe).not.toHaveBeenCalled()
  })

  it('subscribes, drops the next issue addressed to the reader and can start over', async () => {
    const user = userEvent.setup()
    const pending = deferred()
    const onSubscribe = vi.fn(() => pending.promise)
    render(<Newsletter01 onSubscribe={onSubscribe} />)
    await user.type(screen.getByLabelText('Email address'), ' ada@example.com ')
    await user.click(screen.getByRole('button', { name: /Subscribe/ }))
    expect(onSubscribe).toHaveBeenCalledWith('ada@example.com')
    expect(screen.getByRole('button', { name: /Subscribing/ }).hasAttribute('disabled')).toBe(true)

    pending.resolve()
    expect(await screen.findByText('You’re on the list')).toBeTruthy()
    expect(screen.getByText(/The next issue goes to ada@example.com/)).toBeTruthy()
    const next = document.querySelector('[data-slot=newsletter-next-issue]') as HTMLElement
    expect(within(next).getByText('ada@example.com')).toBeTruthy()
    expect(within(next).getByText('No. 43')).toBeTruthy()
    // The oldest issue makes room for the new one.
    expect(stack()).toEqual([
      'The quiet power of defaults',
      'Designing for the second visit',
      'Your first issue',
    ])
    const again = screen.getByRole('button', { name: 'Use another address' })
    expect(document.activeElement).toBe(again)
    await user.click(again)
    expect((screen.getByLabelText('Email address') as HTMLInputElement).value).toBe('')
  })

  it('shows the error when subscribing fails', async () => {
    const user = userEvent.setup()
    render(
      <Newsletter01
        note={null}
        onSubscribe={() => Promise.reject(new Error('That list is full.'))}
      />,
    )
    await user.type(screen.getByLabelText('Email address'), 'ada@example.com{Enter}')
    expect((await screen.findByRole('alert')).textContent).toBe('That list is full.')
    expect(screen.queryByText(/Join 18,000/)).toBeNull()
  })
})

describe('Comparison01', () => {
  it('renders a table with the highlighted column and readable cells', () => {
    render(<Comparison01 />)
    const heading = screen.getByRole('heading', { level: 2 })
    expect(screen.getByRole('region', { name: heading.textContent ?? '' })).toBeTruthy()
    const table = screen.getByRole('table')
    const head = table.querySelector('thead') as HTMLElement
    const columns = within(head).getAllByRole('columnheader')
    expect(columns.map((c) => c.textContent)).toEqual([
      'Feature',
      expect.stringContaining('Northwind'),
      expect.stringContaining('Legacy Suite'),
      expect.stringContaining('Spreadsheets'),
    ])
    expect(columns[1]?.textContent).toContain('Recommended')
    // Section titles head their group of rows.
    expect(
      within(table)
        .getAllByRole('columnheader')
        .filter((th) => th.getAttribute('scope') === 'colgroup')
        .map((th) => th.textContent),
    ).toEqual(['Planning', 'Data and security', 'Support'])
    const row = within(table).getByRole('row', { name: /Saved views/ })
    expect(
      within(row)
        .getAllByRole('cell')
        .map((c) => c.textContent),
    ).toEqual(['Included', 'Partly', 'Not included'])
    expect(within(table).getByRole('row', { name: /Automations/ }).textContent).toContain(
      '250 / month',
    )
    const container = table.closest('[data-slot=table-container]') as HTMLElement
    expect(container.className).toContain('overflow-y-auto')
    expect(table.querySelector('thead')?.dataset.sticky).toBe('')
    expect(within(table).getByRole('link', { name: 'Start free trial' })).toBeTruthy()
  })

  it('stacks a card per product for narrow containers, highlighted first', () => {
    render(
      <Comparison01
        products={[
          { id: 'a', name: 'Them' },
          { id: 'us', name: 'Us', highlight: true },
        ]}
      />,
    )
    const cards = document.querySelector('[data-slot=comparison-cards]') as HTMLElement
    expect(
      within(cards)
        .getAllByRole('heading', { level: 3 })
        .map((h) => h.textContent),
    ).toEqual(['Us', 'Them'])
    expect(cards.className).toContain('@2xl:hidden')
    expect(
      (document.querySelector('[data-slot=comparison-table]') as HTMLElement).className,
    ).toContain('@2xl:block')
  })

  it('takes rows and words from props and can grow to full height', () => {
    render(
      <Comparison01
        eyebrow={null}
        description={null}
        title="Us vs them"
        action={null}
        maxHeight={null}
        labels={{ yes: 'Yes', no: 'No' }}
        products={[
          { id: 'us', name: 'Us', highlight: true },
          { id: 'them', name: 'Them' },
        ]}
        sections={[{ title: 'Basics', rows: [{ feature: 'Fast', values: { us: true } }] }]}
      />,
    )
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Us vs them')
    const table = screen.getByRole('table')
    expect(within(table).getByRole('row', { name: /Fast/ }).textContent).toContain('YesNo')
    expect(screen.queryByRole('link')).toBeNull()
    const container = table.closest('[data-slot=table-container]') as HTMLElement
    expect(container.className).not.toContain('overflow-y-auto')
  })
})
