'use client'

import type * as React from 'react'
import { cn } from '@/lib/utils'

export interface IPadProps extends React.ComponentProps<'div'> {
  /** Image source to display on screen. */
  src?: string
  /** Video source to play on screen. */
  videoSrc?: string
  /** Screen content for interactive apps or previews. */
  children?: React.ReactNode
  /** Accessible image description. */
  alt?: string
  /** Device orientation: portrait or landscape. Default 'portrait'. */
  orientation?: 'portrait' | 'landscape'
}

/**
 * Pure CSS and SVG iPad mockup with uniform bezels, orientation support, and responsive screen frame.
 */
function IPad({
  src,
  videoSrc,
  children,
  alt = 'iPad screen',
  orientation = 'portrait',
  className,
  ...props
}: IPadProps) {
  const isLandscape = orientation === 'landscape'

  return (
    <div
      data-slot="ipad"
      data-orientation={orientation}
      className={cn(
        'relative mx-auto w-full select-none',
        isLandscape ? 'aspect-[4/3] max-w-[560px]' : 'aspect-[3/4] max-w-[420px]',
        className,
      )}
      {...props}
    >
      {/* Outer frame chassis with uniform bezel */}
      <div className="relative h-full w-full rounded-[36px] sm:rounded-[42px] border-[12px] sm:border-[16px] border-neutral-900 bg-neutral-900 shadow-2xl ring-1 ring-white/10">
        {/* Front camera indicator on bezel */}
        {isLandscape ? (
          <div
            className="absolute top-1.5 left-1/2 -translate-x-1/2 h-2.5 w-2.5 rounded-full bg-neutral-800 ring-1 ring-neutral-700/50 pointer-events-none"
            aria-hidden="true"
          />
        ) : (
          <div
            className="absolute top-1.5 left-1/2 -translate-x-1/2 h-2.5 w-2.5 rounded-full bg-neutral-800 ring-1 ring-neutral-700/50 pointer-events-none"
            aria-hidden="true"
          />
        )}

        {/* Screen container */}
        <div className="relative h-full w-full overflow-hidden rounded-[24px] sm:rounded-[26px] bg-background">
          <div className="relative h-full w-full overflow-hidden">
            {children ? (
              children
            ) : src ? (
              <img src={src} alt={alt} className="h-full w-full object-cover" />
            ) : videoSrc ? (
              <video
                src={videoSrc}
                autoPlay
                loop
                muted
                playsInline
                aria-label={alt}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>

          {/* Home Indicator */}
          <div
            className="absolute bottom-1.5 left-1/2 z-30 h-1 w-32 -translate-x-1/2 rounded-full bg-foreground/30 pointer-events-none"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  )
}

export { IPad }
