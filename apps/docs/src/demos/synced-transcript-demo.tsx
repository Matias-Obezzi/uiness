import { PauseIcon, PlayIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { SyncedTranscript, type TranscriptSegment } from '@/components/ui/synced-transcript'

const lines: [string, string][] = [
  [
    'Ana',
    'Welcome back to the show. Today we are talking about how small teams ship design systems without a design systems team.',
  ],
  [
    'Leo',
    'Thanks for having me. The short answer is that you start with the boring parts: names, spacing, and the five components everyone already copies.',
  ],
  ['Ana', 'And when do you stop copying and start a package?'],
  [
    'Leo',
    'When the third copy drifts. Then the cost of keeping them in step is bigger than the cost of a package, and people feel it.',
  ],
  ['Ana', 'That is a good rule. What about documentation?'],
  [
    'Leo',
    'Write the page you wish you had found. One example that runs, the props, and what it does for the keyboard. That is most of it.',
  ],
]

// A word every 0.32 seconds, as if read aloud.
let at = 0
const segments: TranscriptSegment[] = lines.map(([speaker, text]) => ({
  speaker,
  words: text.split(' ').map((word) => {
    const start = at
    at += 0.32
    return { text: word, start: Math.round(start * 100) / 100 }
  }),
}))
const length = at

export default function SyncedTranscriptDemo() {
  const [time, setTime] = useState(0)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => setTime((t) => (t + 0.1 >= length ? 0 : t + 0.1)), 100)
    return () => clearInterval(id)
  }, [playing])

  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <div className="flex items-center gap-3">
        <Button
          size="icon"
          aria-label={playing ? 'Pause' : 'Play'}
          onClick={() => setPlaying(!playing)}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </Button>
        <span className="text-muted-foreground text-sm tabular-nums">
          {Math.floor(time / 60)}:{String(Math.floor(time % 60)).padStart(2, '0')}
        </span>
      </div>
      <SyncedTranscript
        segments={segments}
        time={time}
        onSeek={setTime}
        className="[&_section]:max-h-64"
      />
    </div>
  )
}
