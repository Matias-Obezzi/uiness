import {
  CalendarClockIcon,
  CopyIcon,
  FileTextIcon,
  GitBranchIcon,
  GitCommitHorizontalIcon,
  GitMergeIcon,
} from 'lucide-react'
import { useState } from 'react'
import { DropdownMenuItem, DropdownMenuSeparator } from '@/ui/dropdown-menu'
import { SplitButton, SplitButtonAction, SplitButtonMenu } from '@/ui/split-button'

export default function SplitButtonDemo() {
  const [last, setLast] = useState('Nothing yet')
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-wrap items-center justify-center gap-4">
        <SplitButton>
          <SplitButtonAction onClick={() => setLast('Saved')}>Save</SplitButtonAction>
          <SplitButtonMenu label="More save options">
            <DropdownMenuItem onSelect={() => setLast('Saved as draft')}>
              <FileTextIcon />
              Save as draft
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setLast('Scheduled')}>
              <CalendarClockIcon />
              Save and schedule
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setLast('Copy saved')}>
              <CopyIcon />
              Save a copy
            </DropdownMenuItem>
          </SplitButtonMenu>
        </SplitButton>
        <SplitButton variant="outline">
          <SplitButtonAction onClick={() => setLast('Merged')}>
            <GitMergeIcon />
            Merge
          </SplitButtonAction>
          <SplitButtonMenu label="More merge options">
            <DropdownMenuItem onSelect={() => setLast('Squashed and merged')}>
              <GitCommitHorizontalIcon />
              Squash and merge
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setLast('Rebased and merged')}>
              <GitBranchIcon />
              Rebase and merge
            </DropdownMenuItem>
          </SplitButtonMenu>
        </SplitButton>
      </div>
      <p className="text-muted-foreground text-sm" aria-live="polite">
        {last}
      </p>
    </div>
  )
}
