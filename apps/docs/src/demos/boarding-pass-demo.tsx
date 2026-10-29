import { useState } from 'react'
import { BoardingPass } from '@/components/ui/boarding-pass'
import { Button } from '@/components/ui/button'

// Updates as the airline would send them.
const updates = [
  { gate: 'B12', boards: '09:40', departs: '10:15', status: 'On time', tone: 'ok' as const },
  { gate: 'B18', boards: '09:40', departs: '10:15', status: 'Gate changed', tone: 'warn' as const },
  {
    gate: 'B18',
    boards: '10:05',
    departs: '10:40',
    status: 'Delayed 25 min',
    tone: 'warn' as const,
  },
  { gate: 'B18', boards: '10:05', departs: '10:40', status: 'Boarding', tone: 'ok' as const },
]

export default function BoardingPassDemo() {
  const [at, setAt] = useState(0)
  const update = updates[at % updates.length] as (typeof updates)[number]
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      <BoardingPass
        from={{ code: 'LIS', city: 'Lisbon' }}
        to={{ code: 'AMS', city: 'Amsterdam' }}
        passenger="Ana Silva"
        flight="TP 662"
        seat="14C"
        {...update}
      />
      <Button variant="outline" size="sm" onClick={() => setAt(at + 1)}>
        Next update
      </Button>
    </div>
  )
}
