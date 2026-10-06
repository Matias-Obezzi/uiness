import { SearchXIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

export default function EmptyStateIllustrations() {
  return (
    <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-2">
      <EmptyState
        variant="card"
        size="sm"
        illustration="no-results"
        title="No results for “quarterly”"
        description="Check the spelling or try fewer words."
      />
      <EmptyState
        variant="card"
        size="sm"
        illustration="inbox-zero"
        title="Inbox zero"
        description="Nothing needs you right now."
      />
      <EmptyState
        variant="card"
        size="sm"
        illustration="error"
        title="Could not load the report"
        description="The server did not answer."
        actions={
          <Button size="sm" variant="outline">
            Try again
          </Button>
        }
      />
      <EmptyState
        variant="card"
        size="sm"
        icon={<SearchXIcon />}
        title="No matching filters"
        description="An icon instead of a drawing, for tighter spaces."
      />
    </div>
  )
}
