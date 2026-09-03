'use client'

import { type ImageProps, Image as ImageRoot } from '@uiness/image'
import { cn } from '@/lib/utils'

export type { ImageProps, ImageStatus, ImageVariant, VariantContext } from '@uiness/image'
export {
  bar,
  blur,
  defineVariant,
  fade,
  none,
  pixelate,
  reveal,
  useImageLoad,
  variants,
} from '@uiness/image'

/**
 * `<Image />` with theme defaults: muted background while loading and rounded corners.
 * Pass `variant`, `placeholder` and `progressive` like the base component.
 */
function Image({ className, wrapperProps, color, ...props }: ImageProps) {
  return (
    <ImageRoot
      color={color ?? 'var(--muted)'}
      className={cn('block h-auto max-w-full', className)}
      wrapperProps={{
        ...wrapperProps,
        className: cn('overflow-hidden rounded-lg', wrapperProps?.className),
      }}
      {...props}
    />
  )
}

export { Image }
