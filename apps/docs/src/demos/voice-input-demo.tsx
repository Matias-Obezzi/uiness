import { useState } from 'react'
import { VoiceInput } from '@/components/ui/voice-input'

export default function VoiceInputDemo() {
  const [takes, setTakes] = useState<{ url: string; seconds: number }[]>([])
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <ul className="flex flex-col items-end gap-2">
        {takes.map((take) => (
          <li
            key={take.url}
            className="rounded-2xl bg-primary px-3 py-2 text-primary-foreground text-sm"
          >
            Voice message · {take.seconds.toFixed(1)}s
          </li>
        ))}
      </ul>
      <VoiceInput
        onSend={(audio, duration) =>
          setTakes((list) => [
            ...list,
            { url: URL.createObjectURL(audio), seconds: duration / 1000 },
          ])
        }
      />
    </div>
  )
}
