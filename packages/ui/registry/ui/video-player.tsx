'use client'

import {
  CaptionsIcon,
  CaptionsOffIcon,
  LoaderCircleIcon,
  MaximizeIcon,
  MinimizeIcon,
  PauseIcon,
  PictureInPicture2Icon,
  PlayIcon,
  RotateCcwIcon,
  Volume1Icon,
  Volume2Icon,
  VolumeXIcon,
} from 'lucide-react'
import { Slider as SliderPrimitive } from 'radix-ui'
import * as React from 'react'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface VideoPlayerLabels {
  /** The player's name for screen readers. */
  player: string
  play: string
  pause: string
  replay: string
  mute: string
  unmute: string
  volume: string
  seek: string
  fullscreen: string
  exitFullscreen: string
  pictureInPicture: string
  captions: string
  /** The speed button, given the current rate. */
  speed: (rate: number) => string
  /** Where playback is, for the seek bar. */
  progress: (current: string, total: string) => string
}

export const defaultVideoPlayerLabels: VideoPlayerLabels = {
  player: 'Video player',
  play: 'Play',
  pause: 'Pause',
  replay: 'Play again',
  mute: 'Mute',
  unmute: 'Unmute',
  volume: 'Volume',
  seek: 'Seek',
  fullscreen: 'Full screen',
  exitFullscreen: 'Exit full screen',
  pictureInPicture: 'Picture in picture',
  captions: 'Captions',
  speed: (rate) => `Playback speed ${rate}×`,
  progress: (current, total) => `${current} of ${total}`,
}

export interface VideoPlayerProps extends Omit<React.ComponentProps<'video'>, 'controls'> {
  /** Rates the speed button steps through. Default 0.5, 1, 1.25, 1.5 and 2. */
  rates?: number[]
  /** Milliseconds of stillness before the controls hide while playing. Default 2500. */
  hideAfter?: number
  /** Classes for the `<video>` itself; `className` goes on the frame around it. */
  videoClassName?: string
  labels?: Partial<VideoPlayerLabels>
}

const time = (seconds: number) => {
  if (!Number.isFinite(seconds)) return '0:00'
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const rest = String(s % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${rest}` : `${m}:${rest}`
}

/** What the controls show, read from the video's own events. */
function useVideo(ref: React.RefObject<HTMLVideoElement | null>) {
  const [state, setState] = React.useState({
    paused: true,
    ended: false,
    waiting: false,
    duration: 0,
    volume: 1,
    muted: false,
    rate: 1,
    pip: false,
    captions: false,
    hasCaptions: false,
  })
  React.useEffect(() => {
    const video = ref.current
    if (!video) return
    const tracks = () =>
      Array.from(video.textTracks ?? []).filter(
        (t) => t.kind === 'captions' || t.kind === 'subtitles',
      )
    const read = () => {
      // Captions are drawn here, above the controls, so the browser must not draw them too.
      for (const t of tracks()) if (t.mode === 'showing') t.mode = 'hidden'
      setState({
        paused: video.paused,
        ended: video.ended,
        waiting: !video.paused && video.readyState < 3,
        duration: video.duration,
        volume: video.volume,
        muted: video.muted || video.volume === 0,
        rate: video.playbackRate,
        pip: document.pictureInPictureElement === video,
        captions: tracks().some((t) => t.mode === 'hidden'),
        hasCaptions: tracks().length > 0,
      })
    }
    const events = [
      'play',
      'pause',
      'ended',
      'waiting',
      'playing',
      'canplay',
      'loadedmetadata',
      'durationchange',
      'volumechange',
      'ratechange',
      'enterpictureinpicture',
      'leavepictureinpicture',
    ]
    for (const name of events) video.addEventListener(name, read)
    // Not every engine reports text track changes (old ones, test DOMs): then there is no
    // captions button to keep in step.
    const list = video.textTracks as TextTrackList | undefined
    const listens = typeof list?.addEventListener === 'function'
    if (listens) {
      list.addEventListener('change', read)
      list.addEventListener('addtrack', read)
    }
    read()
    return () => {
      for (const name of events) video.removeEventListener(name, read)
      if (listens) {
        list.removeEventListener('change', read)
        list.removeEventListener('addtrack', read)
      }
    }
  }, [ref])
  return state
}

/** The seek bar: follows playback every frame on its own, so the rest of the player does not. */
function Seek({
  video,
  videoRef,
  duration,
  playing,
  labels,
}: {
  video: HTMLVideoElement | null
  /** For writing the time: the element itself only arrives to be read. */
  videoRef: React.RefObject<HTMLVideoElement | null>
  duration: number
  playing: boolean
  labels: VideoPlayerLabels
}) {
  const [now, setNow] = React.useState(0)
  const [buffered, setBuffered] = React.useState(0)
  const [hover, setHover] = React.useState<number | null>(null)
  const scrubbing = React.useRef(false)

  React.useEffect(() => {
    if (!video) return
    let frame = 0
    const read = () => {
      if (!scrubbing.current) setNow(video.currentTime)
      const ranges = video.buffered
      for (let i = 0; i < ranges.length; i++) {
        if (ranges.start(i) <= video.currentTime && video.currentTime <= ranges.end(i)) {
          setBuffered(ranges.end(i))
          break
        }
      }
    }
    const loop = () => {
      read()
      frame = requestAnimationFrame(loop)
    }
    if (playing) frame = requestAnimationFrame(loop)
    read()
    video.addEventListener('timeupdate', read)
    video.addEventListener('progress', read)
    video.addEventListener('seeked', read)
    return () => {
      cancelAnimationFrame(frame)
      video.removeEventListener('timeupdate', read)
      video.removeEventListener('progress', read)
      video.removeEventListener('seeked', read)
    }
  }, [video, playing])

  const total = Number.isFinite(duration) ? duration : 0
  const share = (value: number) => (total ? `${(value / total) * 100}%` : '0%')

  return (
    <SliderPrimitive.Root
      data-slot="video-player-seek"
      className="group/seek relative flex h-4 w-full cursor-pointer touch-none select-none items-center"
      min={0}
      max={total || 1}
      step={0.1}
      value={[now]}
      onValueChange={(values) => {
        const value = values[0] ?? 0
        scrubbing.current = true
        setNow(value)
        if (videoRef.current) videoRef.current.currentTime = value
      }}
      onValueCommit={() => {
        scrubbing.current = false
      }}
      onPointerMove={(e) => {
        const box = e.currentTarget.getBoundingClientRect()
        setHover(Math.min(1, Math.max(0, (e.clientX - box.left) / box.width)) * total)
      }}
      onPointerLeave={() => setHover(null)}
    >
      <SliderPrimitive.Track className="relative h-1 grow overflow-hidden rounded-full bg-white/25 transition-[height] group-hover/seek:h-1.5">
        <span
          className="absolute inset-y-0 left-0 bg-white/35"
          style={{ width: share(buffered) }}
        />
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      {/* The thumb is the slider screen readers meet, so it carries the name. */}
      <SliderPrimitive.Thumb
        aria-label={labels.seek}
        aria-valuetext={labels.progress(time(now), time(total))}
        className="block size-3.5 scale-0 rounded-full bg-primary shadow outline-none ring-white/50 transition-transform group-hover/seek:scale-100 focus-visible:scale-100 focus-visible:ring-4"
      />
      {hover !== null && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-full mb-2 -translate-x-1/2 rounded bg-black/80 px-1.5 py-0.5 font-medium text-xs tabular-nums"
          style={{ left: share(hover) }}
        >
          {time(hover)}
        </span>
      )}
      <span aria-hidden="true" className="sr-only">
        {time(now)}
      </span>
    </SliderPrimitive.Root>
  )
}

const control =
  'inline-flex size-9 shrink-0 items-center justify-center rounded-md outline-none transition-colors hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/70 [&_svg]:size-5'

/**
 * A video with its own controls: play, a seek bar showing what has loaded and the time under
 * the pointer, volume, speed, captions when the video has them, picture in picture and full
 * screen. The controls hide while it plays and come back on any movement. Keyboard: Space or
 * K plays, J and L jump 10 seconds, the arrows seek and set the volume, M mutes, F goes full
 * screen, C toggles captions and 0 to 9 jump to that tenth. Put `<track>` and `<source>`
 * elements inside it as you would in a `<video>`.
 */
function VideoPlayer({
  rates = [0.5, 1, 1.25, 1.5, 2],
  hideAfter = 2500,
  className,
  videoClassName,
  labels: labelsProp,
  children,
  style,
  ...props
}: VideoPlayerProps) {
  const labels = useLabels('video-player', defaultVideoPlayerLabels, labelsProp)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const [video, setVideo] = React.useState<HTMLVideoElement | null>(null)
  const state = useVideo(videoRef)
  const [active, setActive] = React.useState(true)
  const [fullscreen, setFullscreen] = React.useState(false)
  const [canPip, setCanPip] = React.useState(false)
  const idle = React.useRef<ReturnType<typeof setTimeout>>(undefined)

  React.useEffect(() => {
    setVideo(videoRef.current)
    setCanPip(
      typeof document !== 'undefined' &&
        'pictureInPictureEnabled' in document &&
        document.pictureInPictureEnabled &&
        !videoRef.current?.disablePictureInPicture,
    )
    const onFullscreen = () => setFullscreen(document.fullscreenElement === rootRef.current)
    document.addEventListener('fullscreenchange', onFullscreen)
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreen)
      clearTimeout(idle.current)
    }
  }, [])

  /** Shows the controls, and hides them again after a while if it is playing. */
  const wake = React.useCallback(() => {
    setActive(true)
    clearTimeout(idle.current)
    idle.current = setTimeout(() => setActive(false), hideAfter)
  }, [hideAfter])

  const playing = !state.paused
  const shown = !playing || active

  const toggle = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused || v.ended) void v.play().catch(() => {})
    else v.pause()
  }
  const seekBy = (seconds: number) => {
    const v = videoRef.current
    if (v) v.currentTime = Math.min(Math.max(0, v.currentTime + seconds), v.duration || 0)
  }
  const setVolume = (value: number) => {
    const v = videoRef.current
    if (!v) return
    v.volume = Math.min(1, Math.max(0, value))
    v.muted = v.volume === 0
  }
  const toggleMute = () => {
    const v = videoRef.current
    if (!v) return
    if (v.muted || v.volume === 0) {
      v.muted = false
      if (v.volume === 0) v.volume = 0.5
    } else v.muted = true
  }
  const toggleFullscreen = () => {
    const root = rootRef.current
    const v = videoRef.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null
    if (document.fullscreenElement) void document.exitFullscreen()
    else if (root?.requestFullscreen) void root.requestFullscreen().catch(() => {})
    // iPhone Safari only puts the video itself in full screen.
    else v?.webkitEnterFullscreen?.()
  }
  const togglePip = () => {
    const v = videoRef.current
    if (!v) return
    if (document.pictureInPictureElement === v) void document.exitPictureInPicture()
    else void v.requestPictureInPicture().catch(() => {})
  }
  const toggleCaptions = () => {
    const v = videoRef.current
    if (!v) return
    const tracks = Array.from(v.textTracks ?? []).filter(
      (t) => t.kind === 'captions' || t.kind === 'subtitles',
    )
    const on = tracks.some((t) => t.mode === 'hidden')
    // 'hidden' loads the cues and reports them without the browser drawing them.
    tracks.forEach((t, i) => {
      t.mode = !on && i === 0 ? 'hidden' : 'disabled'
    })
  }
  const nextRate = () => {
    const v = videoRef.current
    if (!v) return
    const at = rates.indexOf(v.playbackRate)
    v.playbackRate = rates[(at + 1) % rates.length] ?? 1
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return
    const target = e.target as HTMLElement
    // Sliders and buttons keep their own keys; the shortcuts work everywhere else.
    const onSlider = target.getAttribute('role') === 'slider'
    const onButton = target.tagName === 'BUTTON'
    const v = videoRef.current
    if (!v) return
    const key = e.key.toLowerCase()
    const run = (fn: () => void) => {
      e.preventDefault()
      fn()
      wake()
    }
    if ((key === ' ' && !onButton) || key === 'k') return run(toggle)
    if (key === 'j') return run(() => seekBy(-10))
    if (key === 'l') return run(() => seekBy(10))
    if (key === 'm') return run(toggleMute)
    if (key === 'f') return run(toggleFullscreen)
    if (key === 'c' && state.hasCaptions) return run(toggleCaptions)
    if (onSlider) return
    if (key === 'arrowleft') return run(() => seekBy(-5))
    if (key === 'arrowright') return run(() => seekBy(5))
    if (key === 'arrowup') return run(() => setVolume(v.volume + 0.1))
    if (key === 'arrowdown') return run(() => setVolume(v.volume - 0.1))
    if (/^[0-9]$/.test(key) && Number.isFinite(v.duration)) {
      return run(() => {
        v.currentTime = (Number(key) / 10) * v.duration
      })
    }
  }

  const VolumeIcon = state.muted ? VolumeXIcon : state.volume < 0.5 ? Volume1Icon : Volume2Icon

  return (
    <section
      ref={rootRef}
      aria-label={labels.player}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: the frame takes focus so its keyboard shortcuts work
      tabIndex={0}
      data-slot="video-player"
      data-playing={playing ? '' : undefined}
      // Controls sit on the picture, not on the theme's surfaces, so they keep the light on
      // dark of every player whatever the theme.
      className={cn(
        'group/player relative isolate overflow-hidden rounded-xl bg-black text-white outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
        !shown && 'cursor-none',
        className,
      )}
      style={style}
      onKeyDown={onKeyDown}
      onPointerMove={wake}
      onPointerLeave={() => playing && setActive(false)}
      onFocus={wake}
    >
      <video
        ref={videoRef}
        playsInline
        className={cn('block size-full', videoClassName)}
        onClick={(e) => {
          // A first tap on a phone brings the controls back rather than pausing.
          if (!shown && (e.nativeEvent as PointerEvent).pointerType === 'touch') return wake()
          toggle()
          wake()
        }}
        onDoubleClick={toggleFullscreen}
        {...props}
      >
        {children}
      </video>

      {state.captions && <CaptionLine video={video} raised={shown} />}

      {state.waiting && (
        <LoaderCircleIcon
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 m-auto size-10 animate-spin text-white/90 motion-reduce:animate-none"
        />
      )}

      {state.paused && !state.waiting && (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={toggle}
          className="absolute inset-0 m-auto flex size-16 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-transform hover:scale-105 [&_svg]:size-7"
        >
          {state.ended ? <RotateCcwIcon /> : <PlayIcon className="translate-x-0.5 fill-current" />}
        </button>
      )}

      <div
        data-slot="video-player-controls"
        className={cn(
          'absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pt-10 pb-2 transition-opacity duration-(--duration-normal,200ms)',
          shown
            ? 'opacity-100'
            : // A control with keyboard focus keeps them up. The frame itself does not: a click
              // focuses it, and the shortcuts wake the controls anyway.
              'pointer-events-none opacity-0 group-has-focus-visible/player:pointer-events-auto group-has-focus-visible/player:opacity-100',
        )}
      >
        <Seek
          video={video}
          videoRef={videoRef}
          duration={state.duration}
          playing={playing}
          labels={labels}
        />
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={control}
            onClick={toggle}
            aria-label={state.ended ? labels.replay : playing ? labels.pause : labels.play}
          >
            {state.ended ? (
              <RotateCcwIcon />
            ) : playing ? (
              <PauseIcon className="fill-current" />
            ) : (
              <PlayIcon className="fill-current" />
            )}
          </button>

          <div className="group/volume flex items-center">
            <button
              type="button"
              className={control}
              onClick={toggleMute}
              aria-label={state.muted ? labels.unmute : labels.mute}
            >
              <VolumeIcon />
            </button>
            <SliderPrimitive.Root
              className="relative flex h-9 w-0 touch-none select-none items-center overflow-hidden opacity-0 transition-[width,opacity] duration-(--duration-normal,200ms) group-hover/volume:w-20 group-hover/volume:opacity-100 has-focus-visible:w-20 has-focus-visible:opacity-100"
              min={0}
              max={1}
              step={0.05}
              value={[state.muted ? 0 : state.volume]}
              onValueChange={(values) => setVolume(values[0] ?? 0)}
            >
              <SliderPrimitive.Track className="relative mx-1.5 h-1 grow overflow-hidden rounded-full bg-white/25">
                <SliderPrimitive.Range className="absolute h-full bg-white" />
              </SliderPrimitive.Track>
              <SliderPrimitive.Thumb
                aria-label={labels.volume}
                className="block size-3 rounded-full bg-white outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              />
            </SliderPrimitive.Root>
          </div>

          <span className="px-1 font-medium text-xs tabular-nums">
            <CurrentTime video={video} /> / {time(state.duration)}
          </span>

          <span className="flex-1" />

          <button
            type="button"
            className={cn(control, 'w-auto min-w-9 px-1.5 font-semibold text-xs tabular-nums')}
            onClick={nextRate}
            aria-label={labels.speed(state.rate)}
          >
            {state.rate}×
          </button>
          {state.hasCaptions && (
            <button
              type="button"
              className={control}
              onClick={toggleCaptions}
              aria-label={labels.captions}
              aria-pressed={state.captions}
            >
              {state.captions ? <CaptionsIcon /> : <CaptionsOffIcon />}
            </button>
          )}
          {canPip && (
            <button
              type="button"
              className={control}
              onClick={togglePip}
              aria-label={labels.pictureInPicture}
              aria-pressed={state.pip}
            >
              <PictureInPicture2Icon />
            </button>
          )}
          <button
            type="button"
            className={control}
            onClick={toggleFullscreen}
            aria-label={fullscreen ? labels.exitFullscreen : labels.fullscreen}
          >
            {fullscreen ? <MinimizeIcon /> : <MaximizeIcon />}
          </button>
        </div>
      </div>
    </section>
  )
}

/**
 * The caption being spoken, drawn above the controls while they show and lower once they hide,
 * where the browser's own drawing would sit under them.
 */
function CaptionLine({ video, raised }: { video: HTMLVideoElement | null; raised: boolean }) {
  const [text, setText] = React.useState('')
  React.useEffect(() => {
    const list = video?.textTracks as TextTrackList | undefined
    if (!list || typeof list.addEventListener !== 'function') return
    let track: TextTrack | undefined
    const read = () => {
      const cues = Array.from(track?.activeCues ?? []) as VTTCue[]
      // Voice and style tags (<v Ana>, <i>) are for renderers that style them; this one reads.
      setText(cues.map((cue) => cue.text.replace(/<[^>]+>/g, '')).join('\n'))
    }
    const pick = () => {
      track?.removeEventListener('cuechange', read)
      track = Array.from(list).find(
        (t) => (t.kind === 'captions' || t.kind === 'subtitles') && t.mode === 'hidden',
      )
      track?.addEventListener('cuechange', read)
      read()
    }
    pick()
    list.addEventListener('change', pick)
    return () => {
      list.removeEventListener('change', pick)
      track?.removeEventListener('cuechange', read)
    }
  }, [video])
  if (!text) return null
  return (
    <div
      data-slot="video-player-captions"
      className={cn(
        'pointer-events-none absolute inset-x-4 z-10 text-center transition-[bottom] duration-(--duration-normal,200ms)',
        raised ? 'bottom-20' : 'bottom-4',
      )}
    >
      <span className="whitespace-pre-line rounded bg-black/75 box-decoration-clone px-2 py-0.5 text-sm leading-relaxed sm:text-base">
        {text}
      </span>
    </div>
  )
}

/** The elapsed time, kept apart so its updates re-render only itself. */
function CurrentTime({ video }: { video: HTMLVideoElement | null }) {
  const [now, setNow] = React.useState(0)
  React.useEffect(() => {
    if (!video) return
    const read = () => setNow(video.currentTime)
    read()
    video.addEventListener('timeupdate', read)
    video.addEventListener('seeked', read)
    return () => {
      video.removeEventListener('timeupdate', read)
      video.removeEventListener('seeked', read)
    }
  }, [video])
  return <>{time(now)}</>
}

export { VideoPlayer }
