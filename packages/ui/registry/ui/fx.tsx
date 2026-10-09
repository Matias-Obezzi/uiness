'use client'

import { type FxProps, Fx as FxRoot } from '@uiness/fx'
import { cn } from '@/lib/utils'

export type { Effect, EffectInput, FxHandle, FxProps } from '@uiness/fx'
export {
  ascii,
  blur,
  brightness,
  chromatic,
  contrast,
  crt,
  defineEffect,
  dither,
  duotone,
  edge,
  emboss,
  flip,
  glitch,
  grayscale,
  halftone,
  hueRotate,
  invert,
  kaleidoscope,
  noise,
  palette,
  palettes,
  pixelate,
  pixelSort,
  posterize,
  renderEffects,
  saturate,
  scanlines,
  sepia,
  sharpen,
  threshold,
  vignette,
} from '@uiness/fx'

/** `<Fx />` with rounded corners and a muted background while the image loads. */
function Fx({ className, ...props }: FxProps) {
  return (
    <FxRoot
      data-slot="fx"
      className={cn('rounded-lg bg-muted data-[status=ready]:bg-transparent', className)}
      {...props}
    />
  )
}

export { Fx }
