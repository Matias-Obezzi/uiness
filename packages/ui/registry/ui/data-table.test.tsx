import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DataTable, type DataTableColumn } from './data-table'

interface Invoice {
  id: string
  customer: string
  status: 'Paid' | 'Pending' | 'Overdue'
  amount: number
}

const rows: Invoice[] = [
  { id: 'INV-1', customer: 'Acme', status: 'Paid', amount: 250 },
  { id: 'INV-2', customer: 'Globex', status: 'Pending', amount: 150 },
  { id: 'INV-3', customer: 'Initech', status: 'Overdue', amount: 350 },
  { id: 'INV-4', customer: 'Acme', status: 'Pending', amount: 150 },
  { id: 'INV-5', customer: 'Umbrella', status: 'Paid', amount: 90 },
]

const columns: DataTableColumn<Invoice>[] = [
  { id: 'id', header: 'Invoice', sortable: true },
  { id: 'customer', header: 'Customer', sortable: true },
  { id: 'status', header: 'Status' },
  {
    id: 'amount',
    header: 'Amount',
    sortable: true,
    align: 'right',
    cell: (row) => `$${row.amount}`,
  },
]

const body = () => screen.getAllByRole('rowgroup')[1] as HTMLElement
const column = (index: number) =>
  within(body())
    .getAllByRole('row')
    .map((r) => within(r).getAllByRole('cell')[index]?.textContent)
const header = (name: string) => screen.getByRole('columnheader', { name: new RegExp(name) })

describe('DataTable', () => {
  it('renders the columns with custom cells and alignment', () => {
    render(<DataTable data={rows} columns={columns} />)
    expect(column(3)).toEqual(['$250', '$150', '$350', '$150', '$90'])
    expect(within(body()).getAllByRole('cell')[3]?.className).toContain('text-right')
    expect(screen.getByText('5 results')).toBeTruthy()
  })

  it('sorts up, down and back to the data order', async () => {
    render(<DataTable data={rows} columns={columns} />)
    const amount = within(header('Amount')).getByRole('button')
    expect(header('Amount').getAttribute('aria-sort')).toBe('none')
    await userEvent.click(amount)
    expect(header('Amount').getAttribute('aria-sort')).toBe('ascending')
    expect(column(3)).toEqual(['$90', '$150', '$150', '$250', '$350'])
    await userEvent.click(amount)
    expect(header('Amount').getAttribute('aria-sort')).toBe('descending')
    expect(column(3)[0]).toBe('$350')
    await userEvent.click(amount)
    expect(header('Amount').getAttribute('aria-sort')).toBe('none')
    expect(column(0)).toEqual(['INV-1', 'INV-2', 'INV-3', 'INV-4', 'INV-5'])
  })

  it('adds a second sort with shift and numbers them', async () => {
    render(<DataTable data={rows} columns={columns} />)
    await userEvent.click(within(header('Amount')).getByRole('button'))
    const user = userEvent.setup()
    await user.keyboard('{Shift>}')
    await user.click(within(header('Customer')).getByRole('button'))
    await user.click(within(header('Customer')).getByRole('button'))
    await user.keyboard('{/Shift}')
    expect(header('Customer').getAttribute('aria-sort')).toBe('descending')
    expect(header('Amount').getAttribute('aria-sort')).toBe('ascending')
    // The two 150s are ordered by customer, descending.
    expect(column(1)).toEqual(['Umbrella', 'Globex', 'Acme', 'Acme', 'Initech'])
    expect(header('Customer').textContent).toContain('2')
  })

  it('searches the columns and resets', async () => {
    render(<DataTable data={rows} columns={columns} />)
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search' }), 'acme')
    expect(column(0)).toEqual(['INV-1', 'INV-4'])
    expect(screen.getByText('2 results of 5')).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(column(0)).toHaveLength(5)
  })

  it('filters by facet with counts, and shows the empty state', async () => {
    render(
      <DataTable
        data={rows}
        columns={columns}
        filters={[{ column: 'status', title: 'Status' }]}
        empty="No invoices"
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /Status/ }))
    const dialog = await screen.findByRole('dialog')
    const pending = within(dialog).getByRole('checkbox', { name: /Pending/ })
    expect(within(dialog).getByText('Pending').parentElement?.textContent).toBe('Pending2')
    await userEvent.click(pending)
    expect(column(0)).toEqual(['INV-2', 'INV-4'])
    await userEvent.keyboard('{Escape}')
    await userEvent.type(screen.getByRole('searchbox'), 'zzz')
    expect(screen.getByText('No invoices')).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'Reset filters' }))
    expect(column(0)).toHaveLength(5)
  })

  it('selects rows, and all the filtered rows from the header', async () => {
    const onSelectionChange = vi.fn()
    render(
      <DataTable data={rows} columns={columns} selectable onSelectionChange={onSelectionChange} />,
    )
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select INV-2' }))
    expect(onSelectionChange).toHaveBeenLastCalledWith(['INV-2'])
    const all = screen.getByRole('checkbox', { name: 'Select all rows' })
    expect(all.getAttribute('data-state')).toBe('indeterminate')
    expect(screen.getByText('1 of 5 selected')).toBeTruthy()
    await userEvent.click(all)
    expect(onSelectionChange).toHaveBeenLastCalledWith([
      'INV-2',
      'INV-1',
      'INV-3',
      'INV-4',
      'INV-5',
    ])
    expect(all.getAttribute('data-state')).toBe('checked')
    await userEvent.click(all)
    expect(onSelectionChange).toHaveBeenLastCalledWith([])
  })

  it('pages through the rows', async () => {
    render(<DataTable data={rows} columns={columns} pageSize={2} />)
    expect(column(0)).toEqual(['INV-1', 'INV-2'])
    expect(screen.getByText('Page 1 of 3')).toBeTruthy()
    const previous = screen.getByRole('button', { name: 'Previous page' })
    expect((previous as HTMLButtonElement).disabled).toBe(true)
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }))
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }))
    expect(column(0)).toEqual(['INV-5'])
    expect((screen.getByRole('button', { name: 'Next page' }) as HTMLButtonElement).disabled).toBe(
      true,
    )
  })
})
