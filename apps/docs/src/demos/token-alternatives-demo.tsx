import { useState } from 'react'
import { type AnswerToken, TokenAlternatives } from '@/components/ui/token-alternatives'

const answer: AnswerToken[] = [
  { text: 'Lisbon', p: 0.97 },
  { text: ' is', p: 0.99 },
  { text: ' a', p: 0.9 },
  {
    text: ' sunny',
    p: 0.42,
    alternatives: [
      { text: ' hilly', p: 0.31 },
      { text: ' coastal', p: 0.18 },
    ],
  },
  { text: ' city', p: 0.95 },
  {
    text: ' best',
    p: 0.55,
    alternatives: [
      { text: ' easiest', p: 0.25 },
      { text: ' loveliest', p: 0.12 },
    ],
  },
  { text: ' seen', p: 0.88 },
  { text: ' on', p: 0.9 },
  {
    text: ' foot',
    p: 0.36,
    alternatives: [
      { text: ' tram', p: 0.34 },
      { text: ' a bike', p: 0.2 },
    ],
  },
  { text: '.', p: 0.99 },
]

// What the pretend model writes after each pick.
const after: Record<string, string> = {
  ' hilly': ' city, so wear good shoes.',
  ' coastal': ' city with long beaches nearby.',
  ' easiest': ' seen from the old trams.',
  ' loveliest': ' at golden hour.',
  ' tram': ', on the old yellow 28 line.',
  ' a bike': ' along the river.',
}

export default function TokenAlternativesDemo() {
  const [tokens, setTokens] = useState(answer)
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <TokenAlternatives
        tokens={tokens}
        onPick={(index, text) => {
          const rest = after[text] ?? ''
          // The picked word, then the answer written again from there.
          setTokens([
            ...tokens.slice(0, index),
            { ...(tokens[index] as AnswerToken), text, p: 0.99, alternatives: undefined },
            ...rest.split(/(?=\s)/).map((t) => ({ text: t, p: 0.95 })),
          ])
        }}
      />
      <button
        type="button"
        className="self-start text-muted-foreground text-xs underline-offset-4 hover:underline"
        onClick={() => setTokens(answer)}
      >
        Start over
      </button>
    </div>
  )
}
