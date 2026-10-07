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
}

/**
 * Projects dynamic ambient backlight behind images and videos using their own colors.
 * Images are mirrored purely in CSS without JavaScript; videos are sampled into a low-resolution
 * off-screen canvas. Pixels are never read back with getImageData, ensuring cross-origin
 * videos without CORS headers continue to project without security errors.
 */
function Ambilight({
  blur = 60,
  spread = 1.1,
  intensity = 0.7,
  saturation = 1.4,
  fps = 15,
  className,
  style,
  children,
  ...props
}: AmbilightProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const canvasARef = React.useRef<HTMLCanvasElement>(null)
  const canvasBRef = React.useRef<HTMLCanvasElement>(null)
  const [hasVideo, setHasVideo] = React.useState(false)
  const inView = useInView(containerRef, { once: false, amount: 0 })
  const reduced = useReducedMotion()

  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const video = container.querySelector('video')
    if (!video) {
      setHasVideo(false)
      return
    }

    setHasVideo(true)

    let active = 0
    let frameId = 0
    let videoCallbackId = 0
    let lastTime = 0
    let running = false

    const drawFrame = () => {
      const target = active === 0 ? canvasBRef.current : canvasARef.current
      const current = active === 0 ? canvasARef.current : canvasBRef.current
      if (!target || video.readyState < 2) return

      const ctx = target.getContext('2d')
      if (!ctx) return

      ctx.drawImage(video, 0, 0, target.width, target.height)
      target.style.opacity = '1'
      if (current) current.style.opacity = '0'
      active = active === 0 ? 1 : 0
    }

    const stopLoop = () => {
      running = false
      if (frameId) cancelAnimationFrame(frameId)
      if (
        videoCallbackId &&
        'cancelVideoFrameCallback' in video &&
        typeof video.cancelVideoFrameCallback === 'function'
      ) {
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

      if (
        'requestVideoFrameCallback' in video &&
        typeof video.requestVideoFrameCallback === 'function'
      ) {
        videoCallbackId = video.requestVideoFrameCallback((time) => tick(time))
      } else {
        frameId = requestAnimationFrame(tick)
      }
    }

    const startLoop = () => {
      if (reduced || running || video.paused || video.ended || !inView) return
      running = true
      lastTime = performance.now()
      tick(lastTime)
    }

    const onPlay = () => startLoop()
    const onPause = () => {
      stopLoop()
      drawFrame()
    }
    const onSeeked = () => drawFrame()
    const onLoaded = () => drawFrame()

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') stopLoop()
      else if (!video.paused) startLoop()
    }

    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('ended', onPause)
    video.addEventListener('seeked', onSeeked)
    video.addEventListener('loadeddata', onLoaded)
    document.addEventListener('visibilitychange', onVisibility)

    if (video.readyState >= 2) drawFrame()
    if (!video.paused) startLoop()

    return () => {
      stopLoop()
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('ended', onPause)
      video.removeEventListener('seeked', onSeeked)
      video.removeEventListener('loadeddata', onLoaded)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [inView, reduced, fps])

  const glowStyle: React.CSSProperties = {
    filter: `blur(${blur}px) saturate(${saturation})`,
    transform: `scale(${spread})`,
    opacity: intensity,
  }

  return (
    <div
      ref={containerRef}
      data-slot="ambilight"
      className={cn('relative isolate', className)}
      style={style}
      {...props}
    >
      {!hasVideo && (
        <div
          aria-hidden="true"
          data-slot="ambilight-glow"
          className="pointer-events-none absolute inset-0 -z-10 select-none overflow-hidden transition-opacity duration-300 [&>*]:size-full [&>*]:object-cover"
          style={glowStyle}
        >
          {React.isValidElement(children) &&
            React.cloneElement(children as React.ReactElement<{ className?: string }>, {
              className: cn(
                (children.props as { className?: string })?.className,
                'size-full object-cover',
              ),
            })}
        </div>
      )}

      {hasVideo && (
        <div
          aria-hidden="true"
          data-slot="ambilight-glow"
          className="pointer-events-none absolute inset-0 -z-10 select-none overflow-hidden"
          style={glowStyle}
        >
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
        </div>
      )}

      <div data-slot="ambilight-content" className="relative z-10">
        {children}
      </div>
    </div>
  )
}

export { Ambilight }
