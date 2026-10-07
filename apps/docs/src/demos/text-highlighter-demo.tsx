import { Highlighter } from '@/components/ui/text-highlighter'

export default function TextHighlighterDemo() {
  return (
    <div className="flex min-h-60 w-full max-w-lg flex-col justify-center gap-6 p-8 font-medium text-lg leading-relaxed">
      <p>
        Draw attention with a{' '}
        <Highlighter action="highlight" color="color-mix(in srgb, var(--primary) 30%, transparent)">
          vibrant marker highlight
        </Highlighter>
        , or emphasize with an{' '}
        <Highlighter action="underline" color="var(--primary)" strokeWidth={3}>
          expressive underline
        </Highlighter>
        .
      </p>
      <p>
        Surround key words in a{' '}
        <Highlighter action="circle" color="#ef4444" padding={6}>
          hand-drawn circle
        </Highlighter>
        , bracket items in a{' '}
        <Highlighter action="box" color="#10b981" padding={4}>
          sketchy box
        </Highlighter>
        , or{' '}
        <Highlighter action="strike-through" color="var(--muted-foreground)">
          strike through
        </Highlighter>{' '}
        mistakes.
      </p>
    </div>
  )
}
