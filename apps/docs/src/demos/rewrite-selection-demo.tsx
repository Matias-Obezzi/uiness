import { RewriteSelection } from '@/components/ui/rewrite-selection'

// A stand-in for a model, streaming its answer a word at a time.
async function* rewrite(text: string, instruction: string) {
  const how = instruction.toLowerCase()
  const out = how.includes('short')
    ? text
        .split(/\s+/)
        .slice(0, Math.max(3, Math.ceil(text.split(/\s+/).length / 2)))
        .join(' ')
    : how.includes('formal')
      ? text
          .replace(/\bwe'll\b/gi, 'we will')
          .replace(/\bgonna\b/gi, 'going to')
          .replace(/\bstuff\b/gi, 'materials')
      : text.toUpperCase()
  for (const word of out.split(/(?<=\s)/)) {
    await new Promise((resolve) => setTimeout(resolve, 80))
    yield word
  }
}

export default function RewriteSelectionDemo() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-2">
      <RewriteSelection
        defaultValue="Hey team, we're gonna ship the new stuff on Friday and we'll send the notes after the launch is done and everything looks fine."
        suggestions={['Shorter', 'More formal', 'Louder']}
        rewrite={rewrite}
      />
      <p className="text-muted-foreground text-xs">Select some words to rewrite them.</p>
    </div>
  )
}
