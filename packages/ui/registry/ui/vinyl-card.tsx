'use client'

import { PauseIcon, PlayIcon } from 'lucide-react'
import * as React from 'react'
import { Slider } from '@/components/ui/slider'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface VinylCardLabels {
  play: string
  pause: string
  seek: string
}

export const defaultVinylCardLabels: VinylCardLabels = {
  play: 'Play',
  pause: 'Pause',
  seek: 'Seek',
}

/** Seconds a record takes for one turn at 33⅓ rpm. */
const TURN = 1.8

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

/** The signed angle between two directions in degrees, the short way round. */
export function angleDelta(from: number, to: number) {
  return ((((to - from) % 360) + 540) % 360) - 180
}

export interface VinylCardProps extends React.ComponentProps<'div'> {
  title: string
  artist: string
  /** The cover, shown on the label and blurred behind the glass. */
  cover: string
  /** Length in seconds. */
  duration: number
  /** The position in seconds, when you keep it, as from an audio element. */
  time?: number
  defaultTime?: number
  onTimeChange?: (time: number) => void
  playing?: boolean
  defaultPlaying?: boolean
  onPlayingChange?: (playing: boolean) => void
  labels?: Partial<VinylCardLabels>
}

/**
 * A music card of frosted glass over its own cover, with a record that turns while it plays.
 * Grab the record and turn it to scrub, a turn per 1.8 seconds like a real one; let go and it
 * plays on. Wire `time` and `playing` to your audio, or leave them and it keeps its own clock.
 */
function VinylCard({
  title,
  artist,
  cover,
  duration,
  time: timeProp,
  defaultTime = 0,
  onTimeChange,
  playing: playingProp,
  defaultPlaying = false,
  onPlayingChange,
  labels: labelsProp,
  className,
  ...props
}: VinylCardProps) {
  const labels = useLabels('vinyl-card', defaultVinylCardLabels, labelsProp)
  const reduced = useReducedMotion()
  const [innerTime, setInnerTime] = React.useState(defaultTime)
  const [innerPlaying, setInnerPlaying] = React.useState(defaultPlaying)
  const time = timeProp ?? innerTime
  const playing = playingProp ?? innerPlaying
  const disc = React.useRef<HTMLDivElement>(null)
  const grab = React.useRef<{ angle: number } | null>(null)
  const [scrubbing, setScrubbing] = React.useState(false)

  const seek = React.useCallback(
    (t: number) => {
      const next = Math.max(0, Math.min(duration, t))
      setInnerTime(next)
      onTimeChange?.(next)
    },
    [duration, onTimeChange],
  )
  const setPlaying = React.useCallback(
    (p: boolean) => {
      setInnerPlaying(p)
      onPlayingChange?.(p)
    },
    [onPlayingChange],
  )

  // Its own clock, when nobody else keeps the time. It starts from wherever the time was.
  const startAt = React.useRef(time)
  React.useEffect(() => {
    startAt.current = time
  })
  React.useEffect(() => {
    if (!playing || scrubbing || timeProp !== undefined) return
    let t = startAt.current
    let last = performance.now()
    let frame = 0
    const tick = (now: number) => {
      t = Math.min(duration, t + (now - last) / 1000)
      last = now
      seek(t)
      if (t >= duration) setPlaying(false)
      else frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing, scrubbing, timeProp, duration, seek, setPlaying])

  const pointerAngle = (e: React.PointerEvent) => {
    const r = disc.current?.getBoundingClientRect()
    if (!r) return 0
    return (
      (Math.atan2(e.clientY - r.top - r.height / 2, e.clientX - r.left - r.width / 2) * 180) /
      Math.PI
    )
  }
  // The record's turn follows the time, so scrubbing and playing are the same motion.
  const turn = reduced && !scrubbing ? 0 : (time / TURN) * 360

  return (
    <div
      data-slot="vinyl-card"
      className={cn(
        'relative isolate w-full max-w-sm overflow-hidden rounded-3xl text-white',
        className,
      )}
      {...props}
    >
      <img
        src={cover}
        alt=""
        className="absolute inset-0 -z-10 size-full scale-125 object-cover blur-2xl saturate-150"
      />
      <div className="flex flex-col gap-5 border border-white/25 bg-white/10 p-5 shadow-[inset_0_1px_0_rgb(255_255_255/0.4)] backdrop-blur-xl">
        <div
          ref={disc}
          aria-hidden="true"
          className="relative mx-auto aspect-square w-3/4 cursor-grab touch-none rounded-full bg-[repeating-radial-gradient(circle,#111_0,#111_2px,#1c1c1c_3px,#111_4px)] shadow-[0_10px_30px_rgb(0_0_0/0.45)] active:cursor-grabbing"
          style={{ transform: `rotate(${turn}deg)` }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            grab.current = { angle: pointerAngle(e) }
            setScrubbing(true)
          }}
          onPointerMove={(e) => {
            const g = grab.current
            if (!g) return
            const a = pointerAngle(e)
            seek(time + (angleDelta(g.angle, a) / 360) * TURN)
            g.angle = a
          }}
          onPointerUp={() => {
            grab.current = null
            setScrubbing(false)
          }}
          onPointerCancel={() => {
            grab.current = null
            setScrubbing(false)
          }}
        >
          {/* The sheen stays put while the grooves turn under it. */}
          <div
            className="pointer-events-none absolute inset-0 rounded-full bg-[conic-gradient(from_30deg,transparent_0deg,rgb(255_255_255/0.14)_40deg,transparent_80deg,transparent_180deg,rgb(255_255_255/0.1)_220deg,transparent_260deg)]"
            style={{ transform: `rotate(${-turn}deg)` }}
          />
          <img
            src={cover}
            alt=""
            draggable={false}
            className="absolute inset-[32%] size-[36%] rounded-full object-cover"
          />
          <span className="absolute inset-[48.5%] rounded-full bg-neutral-200" />
        </div>
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold [text-shadow:0_1px_6px_rgb(0_0_0/0.35)]">
              {title}
            </div>
            <div className="truncate text-sm text-white/80 [text-shadow:0_1px_6px_rgb(0_0_0/0.35)]">
              {artist}
            </div>
          </div>
          <button
            type="button"
            aria-label={playing ? labels.pause : labels.play}
            onClick={() => {
              if (!playing && time >= duration) seek(0)
              setPlaying(!playing)
            }}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-neutral-900 outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          >
            {playing ? <PauseIcon className="size-5" /> : <PlayIcon className="size-5" />}
          </button>
        </div>
        <div className="flex flex-col gap-1.5">
          <Slider
            aria-label={labels.seek}
            min={0}
            max={duration}
            step={1}
            value={[time]}
            onValueChange={([t]) => seek(t ?? 0)}
            className="[&_[data-slot=slider-range]]:bg-white [&_[data-slot=slider-thumb]]:border-white [&_[data-slot=slider-track]]:bg-white/25"
          />
          <div className="flex justify-between text-white/80 text-xs tabular-nums">
            <span>{clock(time)}</span>
            <span>-{clock(duration - time)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export { VinylCard }
