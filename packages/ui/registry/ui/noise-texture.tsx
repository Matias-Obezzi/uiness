'use client'

import type * as React from 'react'
import { cn } from '@/lib/utils'

export interface NoiseTextureProps extends React.ComponentProps<'div'> {
  /** Opacity of the noise grain overlay, from 0 to 1. Default 0.12. */
  opacity?: number
  /** Base frequency of the SVG turbulence filter. Default 0.8. */
  frequency?: number
  /** Number of octaves for fractal turbulence detail. Default 4. */
  octaves?: number
  /** CSS mix-blend-mode for blending the grain over background colors. Default 'overlay'. */
  blend?: React.CSSProperties['mixBlendMode']
  /** Whether the grain jumps rapidly with stepping animation. Default false. */
  animated?: boolean
}

/**
 * A decorative procedural film grain overlay powered by an inline SVG turbulence filter.
 * 100% CSS with identical SSR output, disabled automatically under prefers-reduced-motion.
 */
function NoiseTexture({
  opacity = 0.12,
  frequency = 0.8,
  octaves = 4,
  blend = 'overlay',
  animated = false,
  className,
  style,
  ...props
}: NoiseTextureProps) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><filter id='noise'><feTurbulence type='fractalNoise' baseFrequency='${frequency}' numOctaves='${octaves}' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#noise)'/></svg>`
  const dataUrl = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`

  return (
    <div
      aria-hidden="true"
      data-slot="noise-texture"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      style={
        {
          opacity,
          mixBlendMode: blend,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      <div
        data-slot="noise-texture-grain"
        className={cn(
          animated
            ? 'absolute -inset-[50%] h-[200%] w-[200%] [animation:noise-grain_0.35s_steps(1)_infinite] motion-reduce:animate-none'
            : 'absolute inset-0 size-full',
        )}
        style={{ backgroundImage: dataUrl }}
      />
    </div>
  )
}

export { NoiseTexture }
