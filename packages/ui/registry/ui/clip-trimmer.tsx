'use client'

import { PauseIcon, PlayIcon } from 'lucide-react'
import * as React from 'react'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface ClipTrimmerLabels {
  start: string
  end: string
  play: string
  pause: string
  /** The kept length, formatted. */
  kept: (length: string) => string
}

export const defaultClipTrimmerLabels: ClipTrimmerLabels = {
  start: 'Trim start',
  end: 'Trim end',
  play: 'Play',
  pause: 'Pause',
  kept: (length) => `${length} kept`,
}

/** Thumbnails in the filmstrip. */
const FRAMES = 10

/** Seconds as m:ss. */
export function formatTime(seconds: number) {
  const s = Math.max(0, Math.round(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** Moves one end of a range to `to`, on whole seconds, keeping it at least `min` long. */
export function trimTo(range: [number, number], end: 0 | 1, to: number, duration: number, min = 1) {
  const t = Math.round(to)
  return end === 0
    ? ([Math.max(0, Math.min(t, range[1] - min)), range[1]] as [number, number])
    : ([range[0], Math.min(duration, Math.max(t, range[0] + min))] as [number, number])
}

export interface ClipTrimmerProps
  extends Omit<React.ComponentProps<'div'>, 'defaultValue' | 'onChange'> {
  /** The video. Same origin, so the filmstrip can be drawn from it. */
  src: string
  /** The kept range in seconds. */
  value?: [number, number]
  /** Default the whole clip. */
  defaultValue?: [number, number]
  onValueChange?: (value: [number, number]) => void
  labels?: Partial<ClipTrimmerLabels>
}

/**
 * A trim timeline for a video: a filmstrip drawn from the clip, two handles that snap to whole
 * seconds, and a playhead that loops the kept range. The handles are sliders for the keyboard;
 * the arrows move them a second.
 */
function ClipTrimmer({
  src,
  value: valueProp,
  defaultValue,
  onValueChange,
  labels: labelsProp,
  className,
  ...props
}: ClipTrimmerProps) {
  const labels = useLabels('clip-trimmer', defaultClipTrimmerLabels, labelsProp)
  const video = React.useRef<HTMLVideoElement>(null)
  const track = React.useRef<HTMLDivElement>(null)
  const head = React.useRef<HTMLDivElement>(null)
  // Read from the element, not an event: a cached clip has its length before React listens.
  const duration = React.useSyncExternalStore(
    React.useCallback((notify: () => void) => {
      const v = video.current
      v?.addEventListener('durationchange', notify)
      return () => v?.removeEventListener('durationchange', notify)
    }, []),
    () => {
      const d = Math.floor(video.current?.duration ?? 0)
      return Number.isFinite(d) ? d : 0
    },
    () => 0,
  )
  const [inner, setInner] = React.useState<[number, number] | null>(defaultValue ?? null)
  const range = React.useMemo<[number, number]>(
    () => valueProp ?? inner ?? [0, duration],
    [valueProp, inner, duration],
  )
  const [playing, setPlaying] = React.useState(false)
  const [frames, setFrames] = React.useState<string[]>([])
  const dragging = React.useRef<0 | 1 | null>(null)

  const set = (next: [number, number]) => {
    setInner(next)
    onValueChange?.(next)
    const v = video.current
    if (v && (v.currentTime < next[0] || v.currentTime > next[1])) v.currentTime = next[0]
  }

  // The filmstrip: a second video seeks through the clip and each frame is drawn small.
  React.useEffect(() => {
    let cancelled = false
    const v = document.createElement('video')
    v.muted = true
    v.preload = 'auto'
    v.src = src
    const shots: string[] = []
    const canvas = document.createElement('canvas')
    v.addEventListener('loadedmetadata', () => {
      canvas.height = 64
      canvas.width = Math.round((64 * v.videoWidth) / v.videoHeight) || 96
      v.currentTime = 0.05
    })
    v.addEventListener('seeked', () => {
      if (cancelled) return
      try {
        canvas.getContext('2d')?.drawImage(v, 0, 0, canvas.width, canvas.height)
        shots.push(canvas.toDataURL('image/jpeg', 0.6))
      } catch {
        // A clip from another origin cannot be read; the strip stays plain.
        return
      }
      if (shots.length < FRAMES) v.currentTime = (v.duration * shots.length) / FRAMES + 0.05
      else setFrames(shots)
    })
    return () => {
      cancelled = true
      v.removeAttribute('src')
      v.load()
    }
  }, [src])

  // The playhead, and the loop back to the start of the kept range.
  React.useEffect(() => {
    let frame = 0
    const tick = () => {
      const v = video.current
      if (v && duration) {
        if (!v.paused && v.currentTime >= range[1]) v.currentTime = range[0]
        head.current?.style.setProperty('left', `${(v.currentTime / duration) * 100}%`)
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [duration, range])

  const timeAt = (clientX: number) => {
    const r = track.current?.getBoundingClientRect()
    return r ? ((clientX - r.left) / r.width) * duration : 0
  }

  const handle = (end: 0 | 1) => (
    <div
      role="slider"
      tabIndex={0}
      aria-label={end === 0 ? labels.start : labels.end}
      aria-valuemin={end === 0 ? 0 : range[0] + 1}
      aria-valuemax={end === 0 ? range[1] - 1 : duration}
      aria-valuenow={range[end]}
      aria-valuetext={formatTime(range[end])}
      onKeyDown={(e) => {
        const step = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[e.key]
        if (step === undefined) return
        e.preventDefault()
        set(trimTo(range, end, range[end] + step, duration))
      }}
      onPointerDown={(e) => {
        e.stopPropagation()
        e.currentTarget.setPointerCapture(e.pointerId)
        dragging.current = end
      }}
      onPointerMove={(e) => {
        if (dragging.current === end) set(trimTo(range, end, timeAt(e.clientX), duration))
      }}
      onPointerUp={() => {
        dragging.current = null
      }}
      className={cn(
        'absolute inset-y-0 z-10 flex w-4 cursor-ew-resize touch-none items-center justify-center bg-amber-400 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 pointer-coarse:after:absolute pointer-coarse:after:-inset-x-3 pointer-coarse:after:inset-y-0',
        end === 0 ? '-translate-x-full rounded-l-md' : 'rounded-r-md',
      )}
      style={{ left: `${(range[end] / (duration || 1)) * 100}%` }}
    >
      <span className="h-5 w-0.5 rounded-full bg-amber-950/60" />
    </div>
  )

  return (
    <div
      data-slot="clip-trimmer"
      className={cn('flex w-full flex-col gap-3', className)}
      {...props}
    >
      <video
        ref={video}
        src={src}
        muted
        playsInline
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="aspect-video w-full rounded-lg bg-black object-cover"
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={playing ? labels.pause : labels.play}
          onClick={() => {
            const v = video.current
            if (!v) return
            if (v.paused) {
              if (v.currentTime < range[0] || v.currentTime >= range[1]) v.currentTime = range[0]
              v.play().catch(() => {})
            } else v.pause()
          }}
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 pointer-coarse:size-11"
        >
          {playing ? <PauseIcon className="size-4" /> : <PlayIcon className="size-4" />}
        </button>
        <div
          ref={track}
          className="relative mx-4 h-14 flex-1 touch-pan-y"
          onPointerDown={(e) => {
            const v = video.current
            if (v && duration)
              v.currentTime = Math.max(range[0], Math.min(range[1], timeAt(e.clientX)))
          }}
        >
          <div className="absolute inset-0 flex overflow-hidden rounded-md bg-muted">
            {frames.map((f, i) => (
              <img
                // biome-ignore lint/suspicious/noArrayIndexKey: frame n is always the same moment
                key={i}
                src={f}
                alt=""
                draggable={false}
                className="h-full min-w-0 flex-1 object-cover"
              />
            ))}
          </div>
          {duration > 0 && (
            <>
              <div
                className="absolute inset-y-0 left-0 rounded-l-md bg-background/70"
                style={{ width: `${(range[0] / duration) * 100}%` }}
              />
              <div
                className="absolute inset-y-0 right-0 rounded-r-md bg-background/70"
                style={{ width: `${(1 - range[1] / duration) * 100}%` }}
              />
              <div
                className="absolute inset-y-0 border-amber-400 border-y-[3px]"
                style={{
                  left: `${(range[0] / duration) * 100}%`,
                  right: `${(1 - range[1] / duration) * 100}%`,
                }}
              />
              <div
                ref={head}
                aria-hidden="true"
                className="pointer-events-none absolute -inset-y-1 w-0.5 -translate-x-1/2 rounded-full bg-foreground"
              />
              {handle(0)}
              {handle(1)}
            </>
          )}
        </div>
      </div>
      <p className="text-center text-muted-foreground text-sm tabular-nums">
        {formatTime(range[0])} – {formatTime(range[1])} ·{' '}
        {labels.kept(formatTime(range[1] - range[0]))}
      </p>
    </div>
  )
}

export { ClipTrimmer }
