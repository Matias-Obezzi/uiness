import { LoaderCircleIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { MessageQueue } from '@/components/ui/message-queue'

export default function MessageQueueDemo() {
  const [log, setLog] = useState<string[]>(['Refactor the auth module'])
  const [busy, setBusy] = useState(true)
  // Each message keeps the pretend agent busy for a few seconds.
  useEffect(() => {
    if (!busy) return
    const timer = setTimeout(() => setBusy(false), 5000)
    return () => clearTimeout(timer)
  }, [busy])

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <ul className="flex flex-col gap-1.5 text-sm">
        {log.map((text, i) => (
          <li
            // biome-ignore lint/suspicious/noArrayIndexKey: a log only grows
            key={i}
            className="self-end rounded-2xl bg-primary px-3 py-1.5 text-primary-foreground"
          >
            {text}
          </li>
        ))}
      </ul>
      <p className="flex h-5 items-center gap-1.5 text-muted-foreground text-xs">
        {busy && <LoaderCircleIcon aria-hidden="true" className="size-3.5 animate-spin" />}
        {busy ? 'Agent is working… type follow-ups, they will wait.' : 'Agent is idle.'}
      </p>
      <MessageQueue
        busy={busy}
        onSend={(text) => {
          setLog((list) => [...list, text])
          setBusy(true)
        }}
      />
    </div>
  )
}
