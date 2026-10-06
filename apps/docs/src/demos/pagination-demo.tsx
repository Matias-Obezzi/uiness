import { useState } from 'react'
import { Paginator } from '@/components/ui/pagination'

const orders = Array.from({ length: 236 }, (_, i) => ({
  id: 10_000 + i,
  total: ((i * 37) % 400) + 12,
}))

export default function PaginationDemo() {
  const [page, setPage] = useState(1)
  const pageSize = 4
  const rows = orders.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="flex w-full max-w-xl flex-col gap-4">
      <ul className="divide-y rounded-lg border text-sm">
        {rows.map((order) => (
          <li key={order.id} className="flex justify-between px-4 py-2.5">
            <span className="font-medium">Order #{order.id}</span>
            <span className="text-muted-foreground tabular-nums">${order.total}.00</span>
          </li>
        ))}
      </ul>
      <Paginator page={page} total={orders.length} pageSize={pageSize} onPageChange={setPage} />
    </div>
  )
}
