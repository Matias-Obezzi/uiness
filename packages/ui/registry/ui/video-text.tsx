'use client'

import * as React from 'react'
import { useInView } from '@/hooks/use-in-view'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

export interface VideoTextProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** The text that acts as the window into the video. */
  children: React.ReactNode
  /** Source URL of the video file. */
  src: string
  /** Poster image URL displayed before loading or under reduced motion. */
  poster?: string
  /** MIME type of the video stream, such as `'video/mp4'` or `'video/webm'`. */
  type?: string
  /** Font size for the text mask. If omitted, scales to fill container width. */
  fontSize?: number | string
  /** Font weight for the text mask. Default `'bold'`. */
  fontWeight?: number | string
  /** HTML element to render as the root container. Default `'div'`. */
  as?: 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'span'
}

/**
 * Plays a video masked through letterforms using an inline SVG clipPath.
 *
 * Screen readers access the text once via a dedicated visually hidden span,
 * while the video and clipping mask are marked `aria-hidden`. Playback
 * automatically pauses whenever the element scrolls off screen or the tab is hidden,
 * and remains frozen on the poster when reduced motion is preferred.
 */
function VideoText({
  children,
  src,
  poster,
  type,
  fontSize,
  fontWeight = 'bold',
  as: Component = 'div',
  className,
  style,
  ...props
}: VideoTextProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const id = React.useId()
  const clipId = `video-text-clip-${id.replace(/:/g, '')}`

  const inView = useInView(containerRef, { once: false, amount: 0 })
  const reduced = useReducedMotion()

  const [size, setSize] = React.useState<{ width: number; height: number }>({ width: 0, height: 0 })

  // Measure container dimensions to scale the SVG text mask accurately.
  React.useEffect(() => {
    const el = containerRef.current
    if (!el || typeof ResizeObserver === 'undefined') return

    const ro = new ResizeObserver(([entry]) => {
      if (!entry) return
      const { width, height } = entry.contentRect
      setSize({ width, height })
    })

    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Video playback lifecycle: pause when out of view, hidden, or under reduced motion.
  React.useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (reduced) {
      video.pause()
      return
    }

    const playSafely = () => {
      try {
        const res = video.play?.()
        if (res && typeof res.catch === 'function') {
          res.catch(() => {})
        }
      } catch {}
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        try {
          video.pause?.()
        } catch {}
      } else if (inView) {
        playSafely()
      }
    }

    if (inView && document.visibilityState === 'visible') {
      playSafely()
    } else {
      try {
        video.pause?.()
      } catch {}
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [inView, reduced])

  const textString = typeof children === 'string' ? children : String(children ?? '')
  const computedFontSize =
    fontSize ??
    (size.width > 0 && textString.length > 0
      ? `${Math.min(size.width / (textString.length * 0.62), size.height > 0 ? size.height * 0.85 : 80)}px`
      : '4rem')

  return (
    <Component
      ref={containerRef as React.Ref<HTMLDivElement & HTMLHeadingElement>}
      data-slot="video-text"
      className={cn('relative inline-flex items-center justify-center overflow-hidden', className)}
      style={style}
      {...props}
    >
      {/* Accessible text for screen readers */}
      <span className="sr-only">{children}</span>

      {/* Background video clipped to the text mask */}
      <video
        ref={videoRef}
        aria-hidden="true"
        autoPlay={!reduced}
        muted
        suppressHydrationWarning
        loop
        playsInline
        preload="metadata"
        poster={poster}
        tabIndex={-1}
        className="size-full object-cover pointer-events-none select-none"
        style={{
          clipPath: `url(#${clipId})`,
          WebkitClipPath: `url(#${clipId})`,
        }}
      >
        {type ? <source src={src} type={type} /> : <source src={src} />}
      </video>

      {/* SVG clipPath definition inheriting layout font */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full"
        width={size.width || '100%'}
        height={size.height || '100%'}
        viewBox={size.width && size.height ? `0 0 ${size.width} ${size.height}` : undefined}
      >
        <defs>
          <clipPath id={clipId}>
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={computedFontSize}
              fontWeight={fontWeight}
              style={{ fontFamily: 'inherit' }}
            >
              {children}
            </text>
          </clipPath>
        </defs>
      </svg>
    </Component>
  )
}

export { VideoText }
