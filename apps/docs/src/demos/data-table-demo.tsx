import { DownloadIcon } from 'lucide-react'
import { Badge } from '@/ui/badge'
import { Button } from '@/ui/button'
import { DataTable, type DataTableColumn } from '@/ui/data-table'

interface Payment {
  id: string
  customer: string
  email: string
  status: 'Paid' | 'Pending' | 'Failed' | 'Refunded'
  method: 'Card' | 'Bank transfer' | 'PayPal'
  amount: number
  date: Date
}

// Forty made up payments, the same on every render.
const customers = ['Acme', 'Globex', 'Initech', 'Umbrella', 'Hooli', 'Stark', 'Wayne', 'Wonka']
const statuses: Payment['status'][] = ['Paid', 'Paid', 'Paid', 'Pending', 'Failed', 'Refunded']
const methods: Payment['method'][] = ['Card', 'Card', 'Bank transfer', 'PayPal']
const payments: Payment[] = Array.from({ length: 40 }, (_, i) => {
  const customer = customers[(i * 5) % customers.length] ?? 'Acme'
  return {
    id: `PAY-${String(1040 - i)}`,
    customer,
    email: `billing@${customer.toLowerCase()}.test`,
    status: statuses[(i * 7) % statuses.length] ?? 'Paid',
    method: methods[(i * 3) % methods.length] ?? 'Card',
    amount: 40 + ((i * 7919) % 960),
    date: new Date(2026, 8, 30 - (i % 30)),
  }
})

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const day = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })

const tone: Record<Payment['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  Paid: 'secondary',
  Pending: 'outline',
  Failed: 'destructive',
  Refunded: 'outline',
}

const columns: DataTableColumn<Payment>[] = [
  { id: 'id', header: 'Payment', sortable: true, className: 'font-medium' },
  {
    id: 'customer',
    header: 'Customer',
    sortable: true,
    cell: (row) => (
      <div className="grid">
        <span>{row.customer}</span>
        <span className="text-muted-foreground text-xs">{row.email}</span>
      </div>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    cell: (row) => <Badge variant={tone[row.status]}>{row.status}</Badge>,
  },
  { id: 'method', header: 'Method' },
  {
    id: 'date',
    header: 'Date',
    sortable: true,
    searchable: false,
    cell: (row) => day.format(row.date),
  },
  {
    id: 'amount',
    header: 'Amount',
    sortable: true,
    align: 'right',
    searchable: false,
    cell: (row) => money.format(row.amount),
  },
]

export default function DataTableDemo() {
  return (
    <DataTable
      className="w-full"
      data={payments}
      columns={columns}
      filters={[
        { column: 'status', title: 'Status' },
        { column: 'method', title: 'Method' },
      ]}
      searchPlaceholder="Search payments…"
      defaultSort={[{ id: 'date', desc: true }]}
      selectable
      pageSize={8}
      containerClassName="max-h-[28rem]"
      toolbar={
        <Button variant="outline" size="sm" className="h-8">
          <DownloadIcon />
          Export
        </Button>
      }
    />
  )
}
