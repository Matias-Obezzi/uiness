import { AutocompleteInput } from '@/components/ui/autocomplete-input'

// A stand-in for a model: the rest of a few sentences it knows.
const endings = [
  'Thanks for getting back to me so quickly.',
  'Could we move the meeting to Thursday afternoon?',
  'I’ll send the updated draft by the end of the day.',
  'Let me know if you have any questions.',
]

function suggest(text: string) {
  const last = text.split(/(?<=[.!?])\s+/).at(-1) ?? ''
  if (!last.trim()) return ''
  const match = endings.find(
    (e) => e.toLowerCase().startsWith(last.toLowerCase()) && e.length > last.length,
  )
  return match ? match.slice(last.length) : ''
}

export default function AutocompleteInputDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <AutocompleteInput
        aria-label="Email"
        placeholder="Start typing “Thanks”, “Could we” or “Let me”…"
        getSuggestion={(text) =>
          new Promise((resolve) => setTimeout(() => resolve(suggest(text)), 150))
        }
      />
      <p className="text-muted-foreground text-xs">
        Tab takes the suggestion, → one word, Esc drops it.
      </p>
    </div>
  )
}
