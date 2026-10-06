import { ArchiveIcon, BookmarkIcon, ForwardIcon, ReplyIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { ExpandingButton, ExpandingButtonGroup } from '@/components/ui/expanding-button-group'

export default function ExpandingButtonGroupDemo() {
  const [saved, setSaved] = useState(false)
  return (
    <ExpandingButtonGroup aria-label="Message actions">
      <ExpandingButton icon={<ReplyIcon />} label="Reply" />
      <ExpandingButton icon={<ForwardIcon />} label="Forward" />
      <ExpandingButton
        icon={<BookmarkIcon className={saved ? 'fill-current' : undefined} />}
        label={saved ? 'Saved' : 'Save'}
        aria-pressed={saved}
        onClick={() => setSaved((s) => !s)}
      />
      <ExpandingButton icon={<ArchiveIcon />} label="Archive" />
      <ExpandingButton
        icon={<Trash2Icon />}
        label="Delete"
        className="hover:text-destructive data-expanded:text-destructive"
      />
    </ExpandingButtonGroup>
  )
}
