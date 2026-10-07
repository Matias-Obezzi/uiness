'use client'

import { Lock, RotateCw, Share, ShieldCheck } from 'lucide-react'
import type * as React from 'react'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface SafariLabels {
  /** Placeholder or accessible label for the Safari address bar. */
  search: string
}

export const defaultSafariLabels: SafariLabels = {
  search: 'Search or enter website name',
}

export interface SafariProps extends React.ComponentProps<'div'> {
  /** URL displayed in the address bar. */
  url?: string
  /** Visual appearance theme for window chrome. Default follows system/theme. */
  mode?: 'light' | 'dark'
  /** Device layout style: desktop window or mobile Safari browser. Default 'desktop'. */
  variant?: 'desktop' | 'mobile'
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
 * Pure CSS and SVG Safari browser mockup with window controls, address bar, and responsive screen frame.
 */
function Safari({
  url = 'example.com',
  mode,
  variant = 'desktop',
  src,
  videoSrc,
  children,
  alt = 'Safari browser preview',
  className,
  ...props
}: SafariProps) {
  const labels = useLabels('safari', defaultSafariLabels)
  const isMobile = variant === 'mobile'

  return (
    <div
      data-slot="safari"
      data-mode={mode}
      data-variant={variant}
      className={cn(
        'relative mx-auto w-full overflow-hidden rounded-2xl border border-border bg-card shadow-2xl transition-all',
        mode === 'light' && 'bg-white text-neutral-900 border-neutral-200',
        mode === 'dark' && 'bg-neutral-950 text-neutral-100 border-neutral-800',
        isMobile ? 'max-w-[340px] aspect-[9/19]' : 'max-w-[720px]',
        className,
      )}
      {...props}
    >
      {/* Safari Window Header / Chrome */}
      {isMobile ? (
        <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground text-sm">9:41</span>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-current" />
            <span className="h-2 w-2 rounded-full bg-current" />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-4 py-2.5">
          {/* Traffic lights */}
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#ef4444] shadow-xs" />
            <span className="h-3 w-3 rounded-full bg-[#f59e0b] shadow-xs" />
            <span className="h-3 w-3 rounded-full bg-[#10b981] shadow-xs" />
          </div>

          {/* Desktop Address Bar */}
          <search
            aria-label={labels.search}
            className="mx-4 flex max-w-sm flex-1 items-center justify-between rounded-lg border border-border/60 bg-background/80 px-3 py-1 text-xs text-muted-foreground shadow-xs"
          >
            <div className="flex items-center gap-1.5 truncate">
              <Lock className="h-3 w-3 shrink-0 text-muted-foreground/70" />
              <span className="truncate font-medium text-foreground/90">{url}</span>
            </div>
            <RotateCw className="h-3 w-3 shrink-0 opacity-60" />
          </search>

          {/* Action icons */}
          <div className="flex items-center gap-2 text-muted-foreground opacity-60">
            <Share className="h-3.5 w-3.5" />
          </div>
        </div>
      )}

      {/* Screen Display Content */}
      <div className="relative w-full overflow-hidden bg-background">
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

      {/* Mobile Safari Bottom Navigation / Address Bar */}
      {isMobile && (
        <div className="border-t border-border/60 bg-muted/40 p-3">
          <search
            aria-label={labels.search}
            className="flex items-center justify-between rounded-xl border border-border/60 bg-background/90 px-3.5 py-2 text-xs text-muted-foreground shadow-xs"
          >
            <div className="flex items-center gap-2 truncate">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" />
              <span className="truncate font-medium text-foreground">{url}</span>
            </div>
            <RotateCw className="h-3.5 w-3.5 shrink-0 opacity-60" />
          </search>
        </div>
      )}
    </div>
  )
}

export { Safari }
