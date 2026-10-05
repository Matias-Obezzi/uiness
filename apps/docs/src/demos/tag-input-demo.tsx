import { useState } from 'react'
import { Label } from '@/ui/label'
import { TagInput } from '@/ui/tag-input'

export default function TagInputDemo() {
  const [tags, setTags] = useState(['design', 'react'])
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Label htmlFor="topics">Topics</Label>
      <TagInput
        id="topics"
        value={tags}
        onValueChange={setTags}
        placeholder="Add a topic"
        transform={(tag) => tag.trim().toLowerCase()}
      />
      <p className="text-muted-foreground text-sm">Enter or a comma adds one. Paste a list too.</p>
    </div>
  )
}
