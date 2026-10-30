'use client'

import { MicIcon, PauseIcon, PlayIcon, SendIcon, SquareIcon, Trash2Icon } from 'lucide-react'
import * as React from 'react'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface VoiceInputLabels {
  record: string
  stop: string
  play: string
  pause: string
  discard: string
  send: string
  /** Announced while recording, with the seconds so far. */
  recording: (time: string) => string
  denied: string
}

export const defaultVoiceInputLabels: VoiceInputLabels = {
  record: 'Record a voice message',
  stop: 'Stop recording',
  play: 'Play',
  pause: 'Pause',
  discard: 'Discard',
  send: 'Send',
  recording: (time) => `Recording, ${time}`,
  denied: 'The microphone is not available.',
}

/** Bars in the waveform. */
const BARS = 40
/** Milliseconds between bars while recording. */
const SAMPLE_MS = 90

const clock = (ms: number) => {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** `levels` squeezed or stretched to `count` bars, each the loudest of its share. */
export function resample(levels: number[], count: number): number[] {
  if (!levels.length) return Array(count).fill(0)
  return Array.from({ length: count }, (_, i) => {
    const from = Math.floor((i * levels.length) / count)
    const to = Math.max(from + 1, Math.floor(((i + 1) * levels.length) / count))
    return Math.max(...levels.slice(from, to))
  })
}

type State =
  | { phase: 'idle' }
  | { phase: 'recording'; started: number }
  | { phase: 'recorded'; blob: Blob; url: string; duration: number }

export interface VoiceInputProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** Called with the take and its length in milliseconds. */
  onSend: (audio: Blob, duration: number) => void
  labels?: Partial<VoiceInputLabels>
}

/**
 * Records a voice message. While recording, a waveform scrolls by with the time; once stopped,
 * the take can be played back, discarded or sent. It asks for the microphone on the first press.
 */
function VoiceInput({ onSend, labels: labelsProp, className, ...props }: VoiceInputProps) {
  const labels = useLabels('voice-input', defaultVoiceInputLabels, labelsProp)
  const [state, setState] = React.useState<State>({ phase: 'idle' })
  const [levels, setLevels] = React.useState<number[]>([])
  const [now, setNow] = React.useState(0)
  const [denied, setDenied] = React.useState(false)
  const [playing, setPlaying] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const recorder = React.useRef<MediaRecorder | null>(null)
  const stopAll = React.useRef<() => void>(() => {})
  const asking = React.useRef(false)
  const audio = React.useRef<HTMLAudioElement>(null)

  React.useEffect(() => () => stopAll.current(), [])
  React.useEffect(() => {
    if (state.phase === 'recorded') return () => URL.revokeObjectURL(state.url)
  }, [state])

  const start = async () => {
    // A second press while the browser asks for the microphone would start a second take whose
    // timer nothing stops.
    if (asking.current) return
    asking.current = true
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setDenied(true)
      return
    } finally {
      asking.current = false
    }
    setDenied(false)
    const context = new AudioContext()
    const analyser = context.createAnalyser()
    analyser.fftSize = 512
    context.createMediaStreamSource(stream).connect(analyser)
    const samples = new Uint8Array(analyser.fftSize)
    const chunks: Blob[] = []
    const media = new MediaRecorder(stream)
    media.ondataavailable = (event) => chunks.push(event.data)
    const started = performance.now()
    media.onstop = () => {
      const blob = new Blob(chunks, { type: media.mimeType })
      setState({
        phase: 'recorded',
        blob,
        url: URL.createObjectURL(blob),
        duration: performance.now() - started,
      })
    }
    // Loudness as the peak of the latest samples, a bar every SAMPLE_MS.
    const timer = window.setInterval(() => {
      analyser.getByteTimeDomainData(samples)
      let peak = 0
      for (const v of samples) peak = Math.max(peak, Math.abs(v - 128) / 128)
      setLevels((prev) => [...prev, Math.min(1, peak * 1.6)])
      setNow(performance.now() - started)
    }, SAMPLE_MS)
    stopAll.current = () => {
      window.clearInterval(timer)
      if (media.state !== 'inactive') media.stop()
      for (const track of stream.getTracks()) track.stop()
      void context.close()
      stopAll.current = () => {}
    }
    recorder.current = media
    setLevels([])
    setNow(0)
    media.start()
    setState({ phase: 'recording', started })
  }

  const discard = () => {
    audio.current?.pause()
    setPlaying(false)
    setProgress(0)
    setLevels([])
    setState({ phase: 'idle' })
  }

  const recording = state.phase === 'recording'
  // While recording the latest bars scroll in from the right; after, the whole take fits.
  const bars = recording
    ? [...Array(Math.max(0, BARS - levels.length)).fill(0), ...levels.slice(-BARS)]
    : resample(levels, BARS)

  return (
    <div
      data-slot="voice-input"
      className={cn(
        'flex h-12 items-center gap-2 rounded-full border bg-background px-1.5',
        className,
      )}
      {...props}
    >
      {state.phase === 'idle' ? (
        <>
          <RoundButton
            label={labels.record}
            onClick={start}
            className="bg-primary text-primary-foreground"
          >
            <MicIcon />
          </RoundButton>
          <p role="status" className="min-w-0 flex-1 truncate px-1 text-muted-foreground text-sm">
            {denied ? labels.denied : labels.record}
          </p>
        </>
      ) : (
        <>
          {recording ? (
            <RoundButton
              label={labels.stop}
              onClick={() => stopAll.current()}
              className="bg-destructive text-white"
            >
              <SquareIcon className="fill-current" />
            </RoundButton>
          ) : (
            <RoundButton
              label={labels.discard}
              onClick={discard}
              className="text-muted-foreground hover:text-foreground"
            >
              <Trash2Icon />
            </RoundButton>
          )}
          {state.phase === 'recorded' && (
            <>
              {/* biome-ignore lint/a11y/useMediaCaption: a voice message just recorded has no captions */}
              <audio
                ref={audio}
                src={state.url}
                onEnded={() => {
                  setPlaying(false)
                  setProgress(0)
                }}
                onTimeUpdate={(event) => {
                  const el = event.currentTarget
                  setProgress(el.currentTime / (state.duration / 1000))
                }}
              />
              <RoundButton
                label={playing ? labels.pause : labels.play}
                onClick={() => {
                  const el = audio.current
                  if (!el) return
                  if (playing) el.pause()
                  else void el.play()
                  setPlaying(!playing)
                }}
              >
                {playing ? <PauseIcon /> : <PlayIcon />}
              </RoundButton>
            </>
          )}
          <div aria-hidden="true" className="flex h-7 min-w-0 flex-1 items-center gap-[2px]">
            {bars.map((level, i) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: bars are positional
                key={i}
                className={cn(
                  'w-full min-w-px flex-1 rounded-full bg-foreground/70 transition-[height] duration-75',
                  !recording && i / BARS >= progress && 'bg-foreground/30',
                )}
                style={{ height: `${Math.max(8, level * 100)}%` }}
              />
            ))}
          </div>
          <span
            aria-hidden="true"
            className="w-10 shrink-0 text-right font-mono text-muted-foreground text-xs tabular-nums"
          >
            {clock(state.phase === 'recorded' ? state.duration : now)}
          </span>
          {recording && (
            <span role="timer" className="sr-only">
              {labels.recording(clock(now))}
            </span>
          )}
          {state.phase === 'recorded' && (
            <RoundButton
              label={labels.send}
              onClick={() => {
                onSend(state.blob, state.duration)
                discard()
              }}
              className="bg-primary text-primary-foreground"
            >
              <SendIcon />
            </RoundButton>
          )}
        </>
      )}
    </div>
  )
}

function RoundButton({
  label,
  className,
  ...props
}: React.ComponentProps<'button'> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        'relative flex size-9 shrink-0 items-center justify-center rounded-full outline-none transition-[opacity,box-shadow,color] hover:opacity-90 focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:after:absolute pointer-coarse:after:-inset-1 [&_svg]:size-4',
        className,
      )}
      {...props}
    />
  )
}

export { VoiceInput }
