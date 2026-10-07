'use client'

import type * as React from 'react'
import { cn } from '@/lib/utils'

export interface AndroidProps extends React.ComponentProps<'div'> {
  /** Image source to display on screen. */
  src?: string
  /** Video source to play on screen. */
  videoSrc?: string
  /** Screen content for interactive apps or previews. */
  children?: React.ReactNode
  /** Accessible image description. */
  alt?: string
}

/**
 * Pure CSS and SVG Android device mockup with centered punch-hole camera and slim bezels.
 */
function Android({
  src,
  videoSrc,
  children,
  alt = 'Android screen',
  className,
  ...props
}: AndroidProps) {
  return (
    <div
      data-slot="android"
      className={cn('relative mx-auto aspect-[9/19.5] w-full max-w-[340px] select-none', className)}
      {...props}
    >
      {/* Side volume / power buttons */}
      <span className="absolute -right-[3px] top-[24%] h-14 w-[3px] rounded-r-xs bg-neutral-600 dark:bg-neutral-700" />
      <span className="absolute -right-[3px] top-[34%] h-10 w-[3px] rounded-r-xs bg-neutral-600 dark:bg-neutral-700" />

      {/* Main outer chassis */}
      <div className="relative h-full w-full rounded-[42px] border-[8px] sm:border-[9px] border-neutral-900 bg-neutral-900 p-0 shadow-2xl ring-1 ring-white/10">
        {/* Screen container */}
        <div className="relative h-full w-full overflow-hidden rounded-[33px] bg-background">
          {/* Centered punch-hole camera */}
          <div
            className="absolute top-2.5 left-1/2 z-30 flex h-3.5 w-3.5 -translate-x-1/2 items-center justify-center rounded-full bg-black ring-1 ring-neutral-800 pointer-events-none"
            aria-hidden="true"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-900" />
          </div>

          {/* Screen Display Content */}
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

          {/* Android Gesture Navigation Bar */}
          <div
            className="absolute bottom-1.5 left-1/2 z-30 h-1 w-20 -translate-x-1/2 rounded-full bg-foreground/30 pointer-events-none"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  )
}

export { Android }
