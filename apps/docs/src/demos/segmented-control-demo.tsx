import { CalendarIcon, KanbanIcon, ListIcon } from 'lucide-react'
import { useState } from 'react'
import { SegmentedControl, SegmentedControlItem } from '@/ui/segmented-control'

const views = {
  list: 'Every task in one list, sorted by due date.',
  board: 'Tasks in columns by status.',
  calendar: 'Tasks on the day they are due.',
}

export default function SegmentedControlDemo() {
  const [view, setView] = useState<keyof typeof views>('list')
  return (
    <div className="flex flex-col items-center gap-4">
      <SegmentedControl
        aria-label="View"
        value={view}
        onValueChange={(v) => setView(v as keyof typeof views)}
      >
        <SegmentedControlItem value="list">
          <ListIcon />
          List
        </SegmentedControlItem>
        <SegmentedControlItem value="board">
          <KanbanIcon />
          Board
        </SegmentedControlItem>
        <SegmentedControlItem value="calendar">
          <CalendarIcon />
          Calendar
        </SegmentedControlItem>
      </SegmentedControl>
      <p className="text-muted-foreground text-sm">{views[view]}</p>
    </div>
  )
}
