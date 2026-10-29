import { SpoilerText } from '@/components/ui/spoiler-text'

export default function SpoilerTextDemo() {
  return (
    <div className="flex max-w-sm flex-col gap-2 rounded-2xl bg-muted px-4 py-3 text-sm">
      <p className="font-medium">Ana</p>
      <p>
        Did you finish the book? The twist is that{' '}
        <SpoilerText>the narrator was the thief all along</SpoilerText>, I did not see it coming.
      </p>
    </div>
  )
}
