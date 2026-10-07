'use client'

import type * as React from 'react'
import { cn } from '@/lib/utils'

export interface MacBookProps extends React.ComponentProps<'div'> {
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
 * Pure CSS and SVG MacBook mockup with display notch, aluminum chassis, and opening thumb indent.
 */
function MacBook({
  src,
  videoSrc,
  children,
  alt = 'MacBook screen',
  className,
  ...props
}: MacBookProps) {
  return (
    <div
      data-slot="macbook"
      className={cn('relative mx-auto w-full max-w-[640px] select-none', className)}
      {...props}
    >
      {/* Display Lid */}
      <div className="relative aspect-[16/10] w-full rounded-t-2xl sm:rounded-t-3xl border-[6px] sm:border-[8px] border-b-0 border-neutral-900 bg-neutral-900 shadow-2xl ring-1 ring-white/10">
        {/* Top Camera Notch */}
        <div
          className="absolute top-0 left-1/2 z-30 flex h-3 sm:h-3.5 w-24 sm:w-28 -translate-x-1/2 items-center justify-center rounded-b-md bg-neutral-900 pointer-events-none"
          aria-hidden="true"
        >
          {/* Camera dot */}
          <span className="h-1.5 w-1.5 rounded-full bg-neutral-950 ring-1 ring-neutral-800" />
        </div>

        {/* Screen container */}
        <div className="relative h-full w-full overflow-hidden rounded-t-lg bg-background">
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
      </div>

      {/* Aluminum Base & Deck */}
      <div className="relative mx-auto h-3 sm:h-4 w-[106%] -ml-[3%] rounded-b-xl sm:rounded-b-2xl bg-neutral-600 dark:bg-neutral-700 shadow-xl border-t border-neutral-500/30">
        {/* Centered opening thumb indent */}
        <div
          className="absolute top-0 left-1/2 h-1.5 w-16 sm:w-20 -translate-x-1/2 rounded-b-md bg-neutral-800 dark:bg-neutral-900"
          aria-hidden="true"
        />
      </div>
    </div>
  )
}

export { MacBook }
