import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './table'

function Example({ sticky = false }: { sticky?: boolean }) {
  return (
    <Table containerClassName="max-h-96">
      <TableCaption>Recent invoices</TableCaption>
      <TableHeader sticky={sticky}>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow data-state="selected">
          <TableCell>INV001</TableCell>
          <TableCell>$250.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>INV002</TableCell>
          <TableCell>$150.00</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Total</TableCell>
          <TableCell>$400.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}

describe('Table', () => {
  // Plain table elements all the way down, so screen readers announce rows, columns and the
  // header of every cell, and the caption names the table.
  it('renders a semantic table named by its caption', () => {
    render(<Example />)
    const table = screen.getByRole('table', { name: 'Recent invoices' })
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((th) => th.textContent),
    ).toEqual(['Invoice', 'Amount'])
    expect(within(table).getAllByRole('row')).toHaveLength(4)
    expect(within(table).getByRole('cell', { name: '$400.00' }).closest('tfoot')).toBeTruthy()
  })

  it('wraps the table in a bordered box that scrolls and takes its own classes', () => {
    render(<Example />)
    const container = screen.getByRole('table').parentElement as HTMLElement
    expect(container.dataset.slot).toBe('table-container')
    expect(container.className).toContain('overflow-x-auto')
    expect(container.className).toContain('border')
    expect(container.className).toContain('max-h-96')
  })

  it('styles a row marked as selected', () => {
    render(<Example />)
    const selected = screen.getByRole('row', { name: /INV001/ })
    expect(selected.getAttribute('data-state')).toBe('selected')
    expect(selected.className).toContain('data-[state=selected]:bg-muted')
  })

  it('makes the header cells sticky only when asked', () => {
    const { unmount } = render(<Example />)
    expect(screen.getAllByRole('rowgroup')[0]?.className).not.toContain('[&_th]:sticky')
    unmount()

    render(<Example sticky />)
    const header = screen.getAllByRole('rowgroup')[0] as HTMLElement
    expect(header.hasAttribute('data-sticky')).toBe(true)
    expect(header.className).toContain('[&_th]:sticky')
    expect(header.className).toContain('[&_th]:top-0')
  })
})
