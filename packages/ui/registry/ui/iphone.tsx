'use client'

import type * as React from 'react'
import { cn } from '@/lib/utils'

export interface IPhoneProps extends React.ComponentProps<'div'> {
  /** Image source to display on screen. */
  src?: string
  /** Video source to play on screen. */
  videoSrc?: string
  /** Screen content for interactive apps or previews. */
  children?: React.ReactNode
  /** Accessible image description. */
  alt?: string
  /** Outer frame finish color. Default neutral dark. */
  color?: string
}

/**
 * Pure CSS and SVG iPhone mockup with Dynamic Island, hardware buttons, and responsive screen frame.
 */
function IPhone({
  src,
  videoSrc,
  children,
  alt = 'iPhone screen',
  color,
  className,
  ...props
}: IPhoneProps) {
  return (
    <div
      data-slot="iphone"
      className={cn('relative mx-auto aspect-[9/19.5] w-full max-w-[340px] select-none', className)}
      {...props}
    >
      {/* Side buttons */}
      {/* Action button */}
      <span className="absolute -left-[3px] top-[18%] h-7 w-[3px] rounded-l-xs bg-neutral-600 dark:bg-neutral-700" />
      {/* Volume Up */}
      <span className="absolute -left-[3px] top-[26%] h-12 w-[3px] rounded-l-xs bg-neutral-600 dark:bg-neutral-700" />
      {/* Volume Down */}
      <span className="absolute -left-[3px] top-[34%] h-12 w-[3px] rounded-l-xs bg-neutral-600 dark:bg-neutral-700" />
      {/* Power button */}
      <span className="absolute -right-[3px] top-[28%] h-16 w-[3px] rounded-r-xs bg-neutral-600 dark:bg-neutral-700" />

      {/* Main outer chassis */}
      <div
        className="relative h-full w-full rounded-[48px] border-[10px] sm:border-[12px] border-neutral-900 bg-neutral-900 p-0 shadow-2xl ring-1 ring-white/10"
        style={color ? { borderColor: color, backgroundColor: color } : undefined}
      >
        {/* Screen container */}
        <div className="relative h-full w-full overflow-hidden rounded-[36px] bg-background">
          {/* Dynamic Island */}
          <div
            className="absolute top-2.5 left-1/2 z-30 h-6 w-24 -translate-x-1/2 rounded-full bg-black px-2 shadow-xs transition-all pointer-events-none"
            aria-hidden="true"
          >
            <div className="flex h-full w-full items-center justify-end pr-0.5">
              {/* Front Camera Lens */}
              <span className="h-2.5 w-2.5 rounded-full bg-neutral-900 ring-1 ring-neutral-800" />
            </div>
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

          {/* Home Indicator Bar */}
          <div
            className="absolute bottom-1.5 left-1/2 z-30 h-1 w-28 -translate-x-1/2 rounded-full bg-foreground/30 pointer-events-none"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  )
}

export { IPhone }
