import { useState } from 'react'
import { Kanban, KanbanCard, KanbanColumn, KanbanHandle } from '@/ui/kanban'

const COLUMNS: Record<string, string> = {
  backlog: 'Backlog',
  building: 'Building',
  review: 'Review',
  done: 'Done',
}

const CARDS = {
  'auto-scroll': { title: 'Auto scroll near the edges', owner: 'Ana' },
  'touch-handles': { title: 'Handles that survive touch', owner: 'Bruno' },
  'live-region': { title: 'Read every move out loud', owner: 'Ana' },
  'grid-hit-test': { title: 'Hit test the grid in reading order', owner: 'Cami' },
  'overlay-copy': { title: 'Overlay that follows the pointer', owner: 'Bruno' },
  'escape-cancel': { title: 'Escape leaves everything as it was', owner: 'Cami' },
}

const card = (id: string) => CARDS[id as keyof typeof CARDS]

export default function KanbanDemo() {
  const [groups, setGroups] = useState<Record<string, string[]>>({
    backlog: ['auto-scroll', 'touch-handles'],
    building: ['live-region', 'grid-hit-test'],
    review: ['overlay-copy'],
    done: ['escape-cancel'],
  })

  return (
    <div className="w-full space-y-3">
      <Kanban groups={groups} onChange={setGroups} order={Object.keys(COLUMNS)} withHandle>
        {(columnId, cards) => (
          <KanbanColumn key={columnId} id={columnId} title={COLUMNS[columnId]}>
            {cards.map((id) => (
              <KanbanCard key={id} id={id}>
                <KanbanHandle className="mt-0.5" />
                <span className="flex-1">
                  <span className="block font-medium">{card(id).title}</span>
                  <span className="block text-muted-foreground text-xs">{card(id).owner}</span>
                </span>
              </KanbanCard>
            ))}
          </KanbanColumn>
        )}
      </Kanban>
      <p className="text-muted-foreground text-sm">
        Drag a card by its grip, or use the keyboard: Tab to a card, Space to pick it up, up and
        down to move it inside the column and left and right to cross to another one, Space to drop
        it, Escape to put it back.
      </p>
    </div>
  )
}
