'use client'

import * as React from 'react'
import { useInView } from '@/hooks/use-in-view'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

export interface AmbilightProps extends React.ComponentProps<'div'> {
  /** Blur radius for the ambient light in pixels. Default 60. */
  blur?: number
  /** Scale factor of the ambient light spread beyond the content bounds. Default 1.1. */
  spread?: number
  /** Peak opacity of the ambient glow, from 0 to 1. Default 0.7. */
  intensity?: number
  /** Color saturation multiplier for enhanced ambient vibrancy. Default 1.4. */
  saturation?: number
  /** Refresh rate in frames per second when illuminating a video element. Default 15. */
  fps?: number
  /**
   * An image to light the glow with instead of the content, for embeds no page can read, like a
   * Vimeo player. The glow is then still. YouTube players need none: they get a live glow.
   */
  glow?: string
}

const YOUTUBE = /^(https:\/\/www\.youtube(?:-nocookie)?\.com)\/embed\/([\w-]{11})/

interface PlayerInfo {
  /** YouTube's player state: 1 playing, 2 paused, 0 ended, -1 unstarted, 3 buffering. */
  state: number
  /** Seconds. */
  time: number
}

/**
 * What the glow's player must be told to follow the visible one: play or pause with it, and
 * jump when they drift apart by more than half a second.
 */
export function followCommands(
  player: PlayerInfo,
  mirror: PlayerInfo,
  active: boolean,
): [func: string, args: unknown[]][] {
  const playing = active && player.state === 1
  const out: [string, unknown[]][] = []
  if (playing && mirror.state !== 1) out.push(['playVideo', []])
  if (!playing && mirror.state === 1) out.push(['pauseVideo', []])
  if (Math.abs(player.time - mirror.time) > 0.5) out.push(['seekTo', [player.time, true]])
  return out
}

/**
 * Projects dynamic ambient backlight behind images and videos using their own colors.
 * Images are mirrored purely in CSS without JavaScript; videos are sampled into a low-resolution
 * canvas. Pixels are never read back with getImageData, so cross-origin videos without CORS
 * headers still light the glow without security errors.
 */
function Ambilight({
  blur = 60,
  spread = 1.1,
  intensity = 0.7,
  saturation = 1.4,
  fps = 15,
  glow,
  className,
  style,
  children,
  ...props
}: AmbilightProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const canvasARef = React.useRef<HTMLCanvasElement>(null)
  const canvasBRef = React.useRef<HTMLCanvasElement>(null)
  const mirrorRef = React.useRef<HTMLIFrameElement>(null)
  const activeRef = React.useRef(0)
  const inView = useInView(containerRef, { once: false, amount: 0 })
  const reduced = useReducedMotion()
  // Decided from the element, not from the DOM after mount: the server and the first client
  // render agree, and a video is never cloned into the glow, where it would load and play twice.
  const isVideo = !glow && React.isValidElement(children) && children.type === 'video'
  const youtube =
    !glow && React.isValidElement<{ src?: string }>(children) && children.type === 'iframe'
      ? YOUTUBE.exec(children.props.src ?? '')
      : null
  const youtubeOrigin = youtube?.[1]
  const youtubeId = youtube?.[2]

  // No page can read the pixels of a YouTube player, so the glow is a second one: muted, blurred
  // by CSS, and kept in step with the visible player over the embed's postMessage protocol.
  React.useEffect(() => {
    if (!youtubeOrigin || reduced) return
    const player = contentRef.current?.querySelector('iframe')
    const mirror = mirrorRef.current
    if (!player || !mirror) return

    const post = (frame: HTMLIFrameElement, message: object) =>
      frame.contentWindow?.postMessage(
        JSON.stringify({ ...message, channel: 'widget' }),
        youtubeOrigin,
      )
    const seen = { player: { state: -1, time: 0 }, mirror: { state: -1, time: 0 } }
    const ready = { player: false, mirror: false }
    let lastSeek = 0

    const follow = () => {
      for (const [func, args] of followCommands(seen.player, seen.mirror, inView)) {
        // The mirror reports its new time a moment after a seek, so wait for it before another.
        if (func === 'seekTo') {
          if (performance.now() - lastSeek < 2000) continue
          lastSeek = performance.now()
        }
        post(mirror, { event: 'command', func, args })
      }
    }

    const onMessage = (event: MessageEvent) => {
      const from =
        event.source === player.contentWindow
          ? 'player'
          : event.source === mirror.contentWindow
            ? 'mirror'
            : null
      if (!from || typeof event.data !== 'string') return
      let data: { event?: string; info?: unknown }
      try {
        data = JSON.parse(event.data)
      } catch {
        return
      }
      ready[from] = true
      const info = data.info as { playerState?: number; currentTime?: number } | number | null
      if (data.event === 'onStateChange' && typeof info === 'number') seen[from].state = info
      if (info && typeof info === 'object') {
        if (typeof info.playerState === 'number') seen[from].state = info.playerState
        if (typeof info.currentTime === 'number') seen[from].time = info.currentTime
      }
      if (from === 'player') follow()
    }

    // A player only reports once asked, and ignores the ask until it has loaded: keep asking.
    const listen = () => {
      if (!ready.player) post(player, { event: 'listening' })
      if (!ready.mirror) post(mirror, { event: 'listening' })
    }
    window.addEventListener('message', onMessage)
    listen()
    const timer = setInterval(() => {
      if (ready.player && ready.mirror) clearInterval(timer)
      else listen()
    }, 500)
    return () => {
      clearInterval(timer)
      window.removeEventListener('message', onMessage)
    }
  }, [youtubeOrigin, inView, reduced])

  React.useEffect(() => {
    if (!isVideo) return
    const video = contentRef.current?.querySelector('video')
    if (!video) return

    let frameId = 0
    let videoCallbackId = 0
    let lastTime = 0
    let running = false

    // Draws into the hidden canvas and crossfades to it, so the glow eases between samples.
    const drawFrame = () => {
      const target = activeRef.current === 0 ? canvasBRef.current : canvasARef.current
      const current = activeRef.current === 0 ? canvasARef.current : canvasBRef.current
      if (!target || video.readyState < 2) return
      const ctx = target.getContext('2d')
      if (!ctx) return
      ctx.drawImage(video, 0, 0, target.width, target.height)
      target.style.opacity = '1'
      if (current) current.style.opacity = '0'
      activeRef.current = activeRef.current === 0 ? 1 : 0
    }

    const stopLoop = () => {
      running = false
      if (frameId) cancelAnimationFrame(frameId)
      if (videoCallbackId && 'cancelVideoFrameCallback' in video) {
        video.cancelVideoFrameCallback(videoCallbackId)
      }
      frameId = 0
      videoCallbackId = 0
    }

    const tick = (now: number) => {
      if (!running) return
      if (video.paused || video.ended || !inView || document.visibilityState === 'hidden') {
        stopLoop()
        return
      }
      if (now - lastTime >= 1000 / fps) {
        lastTime = now
        drawFrame()
      }
      // A new video frame is the only time the glow can change, so wait for one when we can.
      if ('requestVideoFrameCallback' in video) {
        videoCallbackId = video.requestVideoFrameCallback(tick)
      } else {
        frameId = requestAnimationFrame(tick)
      }
    }

    const startLoop = () => {
      if (reduced || running || video.paused || video.ended || !inView) return
      running = true
      lastTime = 0
      tick(performance.now())
    }

    const onPause = () => {
      stopLoop()
      drawFrame()
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') stopLoop()
      else startLoop()
    }

    video.addEventListener('play', startLoop)
    video.addEventListener('pause', onPause)
    video.addEventListener('ended', onPause)
    video.addEventListener('seeked', drawFrame)
    video.addEventListener('loadeddata', drawFrame)
    document.addEventListener('visibilitychange', onVisibility)

    drawFrame()
    startLoop()

    return () => {
      stopLoop()
      video.removeEventListener('play', startLoop)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('ended', onPause)
      video.removeEventListener('seeked', drawFrame)
      video.removeEventListener('loadeddata', drawFrame)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [isVideo, inView, reduced, fps])

  const glowStyle: React.CSSProperties = {
    filter: `blur(${blur}px) saturate(${saturation})`,
    transform: `scale(${spread})`,
    opacity: intensity,
  }

  let content = children
  let light: React.ReactNode = null
  if (glow) {
    light = <img src={glow} alt="" className="size-full object-cover" />
  } else if (youtube && React.isValidElement<{ src: string }>(children)) {
    const url = new URL(children.props.src)
    url.searchParams.set('enablejsapi', '1')
    content = React.cloneElement(children, { src: url.toString() })
    light = reduced ? (
      <img
        src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`}
        alt=""
        className="size-full object-cover"
      />
    ) : (
      // A quarter of the size scaled back up: YouTube streams by the player's size, so the glow
      // costs its lowest quality, which is plenty under a blur.
      <iframe
        ref={mirrorRef}
        src={`${youtubeOrigin}/embed/${youtubeId}?enablejsapi=1&mute=1&controls=0&disablekb=1&playsinline=1&rel=0&iv_load_policy=3&fs=0`}
        title="Ambient glow"
        tabIndex={-1}
        loading="lazy"
        className="h-1/4 w-1/4 origin-top-left scale-400 border-0"
      />
    )
  } else if (isVideo) {
    light = (
      <>
        <canvas
          ref={canvasARef}
          width={32}
          height={18}
          className="absolute inset-0 size-full transition-opacity duration-300"
        />
        <canvas
          ref={canvasBRef}
          width={32}
          height={18}
          className="absolute inset-0 size-full opacity-0 transition-opacity duration-300"
        />
      </>
    )
  } else if (React.isValidElement<{ className?: string }>(children)) {
    light = React.cloneElement(children, {
      className: cn(children.props.className, 'size-full object-cover'),
    })
  }

  return (
    <div
      ref={containerRef}
      data-slot="ambilight"
      className={cn('relative isolate', className)}
      style={style}
      {...props}
    >
      <div
        aria-hidden="true"
        inert
        data-slot="ambilight-glow"
        className="pointer-events-none absolute inset-0 -z-10 select-none overflow-hidden"
        style={glowStyle}
      >
        {light}
      </div>
      <div ref={contentRef} data-slot="ambilight-content" className="relative z-10">
        {content}
      </div>
    </div>
  )
}

export { Ambilight }
