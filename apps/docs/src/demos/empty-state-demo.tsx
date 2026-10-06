import { PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

export default function EmptyStateDemo() {
  return (
    <EmptyState
      variant="dashed"
      illustration="no-files"
      title="No documents yet"
      description="Documents you create or upload show up here. Drag files in, or start from a blank page."
      actions={
        <>
          <Button>
            <PlusIcon />
            New document
          </Button>
          <Button variant="outline">Upload</Button>
        </>
      }
      className="max-w-lg"
    />
  )
}
