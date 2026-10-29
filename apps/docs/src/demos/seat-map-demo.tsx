import { useState } from 'react'
import { SeatMap, type SeatRow } from '@/components/ui/seat-map'

// A small hall: two blocks of seats with an aisle, some already sold.
const sold = new Set(['A3', 'A4', 'B6', 'C1', 'C2', 'D5', 'D6', 'D7', 'E4'])
const rows: SeatRow[] = ['A', 'B', 'C', 'D', 'E'].map((id) => {
  let n = 0
  return {
    id,
    seats: [0, 1, 2, 3, null, 4, 5, 6, 7].map((place) =>
      place === null ? null : sold.has(`${id}${++n}`),
    ),
  }
})

export default function SeatMapDemo() {
  const [seats, setSeats] = useState<string[]>([])
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      <SeatMap rows={rows} value={seats} onValueChange={setSeats} max={6} />
      <p className="text-sm">
        {seats.length ? `Your seats: ${seats.join(', ')}` : 'Pick up to 6 seats.'}
      </p>
    </div>
  )
}
