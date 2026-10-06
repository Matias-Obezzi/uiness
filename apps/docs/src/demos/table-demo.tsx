import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const invoices = [
  { invoice: 'INV001', status: 'Paid', method: 'Credit card', amount: 250 },
  { invoice: 'INV002', status: 'Pending', method: 'PayPal', amount: 150 },
  { invoice: 'INV003', status: 'Unpaid', method: 'Bank transfer', amount: 350 },
  { invoice: 'INV004', status: 'Paid', method: 'Credit card', amount: 450 },
  { invoice: 'INV005', status: 'Paid', method: 'PayPal', amount: 550 },
]

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const total = invoices.reduce((sum, row) => sum + row.amount, 0)

export default function TableDemo() {
  return (
    <Table containerClassName="max-w-2xl">
      <TableCaption>A list of your recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-24">Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((row) => (
          <TableRow key={row.invoice}>
            <TableCell className="font-medium">{row.invoice}</TableCell>
            <TableCell>{row.status}</TableCell>
            <TableCell>{row.method}</TableCell>
            <TableCell className="text-right tabular-nums">{money.format(row.amount)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className="text-right tabular-nums">{money.format(total)}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}
