import type * as React from 'react'
import { cn } from '@/lib/utils'

export interface GalleryImage {
  src: string
  alt?: string
  /** Intrinsic size, keeps the grid stable before the image loads. */
  width?: number
  height?: number
  /** Tiny version for the blur transition in the grid. */
  placeholder?: string
  /** Smaller file for the grid; `src` is used in the lightbox. */
  thumbnail?: string
  caption?: React.ReactNode
}

/** Container widths the `columns` breakpoints switch at, measured on the grid itself. */
export type GalleryBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl'

/**
 * A count for every width, or columns per breakpoint of the grid's own width — not the
 * viewport's — so the same grid fits a full page and a narrow sidebar column. `sm` is 24rem
 * (384px) and up, `md` 36rem (576px), `lg` 48rem (768px), `xl` 64rem (1024px).
 */
export type GalleryColumns = number | Partial<Record<GalleryBreakpoint, number>>

/** What `renderImage` gets to draw one cell's picture. */
export interface GalleryImageRenderProps {
  image: GalleryImage
  index: number
  /** The file for the grid: `thumbnail` when there is one, else `src`. */
  src: string
  /** Empty inside a button, which carries the name, else the image's `alt`. */
  alt: string
  /** Fills the cell, crops to cover and zooms on hover. Put it on the `img`. */
  className: string
}

export interface GalleryGridProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  images: GalleryImage[]
  /**
   * Grid columns, by the grid's own width. A number keeps the old shorthand: two (three for
   * five and up) when narrow, that many from `md`. An object sets each breakpoint, e.g.
   * `{ base: 1, sm: 2, md: 3, lg: 4 }`. Default 3.
   */
  columns?: GalleryColumns
  /** Space between cells. Any CSS length. Default `0.5rem`. */
  gap?: string
  /** Aspect ratio of the cells, e.g. "4 / 3". Default "1 / 1". */
  aspect?: string
  /** Corner radius of the cells. Any CSS length. Default follows the theme's `--radius`. */
  radius?: string
  /**
   * Scale of a picture under the pointer: `true` for a slight 1.03, `false` for none, or a number
   * such as 1.1. Never under a reduced motion preference. Default true.
   */
  zoom?: boolean | number
  /**
   * Draws a picture, to use your own image component for sized and optimized files. Default a
   * plain lazy `img`.
   */
  renderImage?: (props: GalleryImageRenderProps) => React.ReactNode
  /**
   * Props for a cell, which make it a button: an `onClick`, its `aria-label`, a `ref`.
   * `undefined` leaves it a plain picture. `Gallery` opens its lightbox through this.
   */
  getItemProps?: (index: number, image: GalleryImage) => React.ComponentProps<'button'> | undefined
}

/*
 * Columns change with container queries, not media queries: a grid dropped in a sidebar
 * is narrow on a wide screen. Each breakpoint's count goes in a custom property, and a class
 * per breakpoint that is set reads it; a breakpoint left out has no class, so the one below
 * carries on. The classes are written out whole so Tailwind finds them.
 */
const breakpointClass: Record<GalleryBreakpoint, string> = {
  base: 'grid-cols-(--gallery-cols-base)',
  sm: '@sm:grid-cols-(--gallery-cols-sm)',
  md: '@xl:grid-cols-(--gallery-cols-md)',
  lg: '@3xl:grid-cols-(--gallery-cols-lg)',
  xl: '@5xl:grid-cols-(--gallery-cols-xl)',
}

const breakpoints = Object.keys(breakpointClass) as GalleryBreakpoint[]

function columnsByBreakpoint(columns: GalleryColumns): Partial<Record<GalleryBreakpoint, number>> {
  if (typeof columns !== 'number') return { base: 1, ...columns }
  const n = Math.max(1, Math.round(columns))
  return { base: Math.min(n, n >= 5 ? 3 : 2), md: n }
}

function defaultRenderImage({ image, src, alt, className }: GalleryImageRenderProps) {
  return (
    <img
      src={src}
      alt={alt}
      width={image.width}
      height={image.height}
      loading="lazy"
      decoding="async"
      className={className}
    />
  )
}

/**
 * The grid of a gallery on its own: no lightbox, no JavaScript of its own and no `'use client'`,
 * so it renders as a server component. Columns follow its own width with container queries.
 * `Gallery` is this grid plus the full screen viewer.
 */
function GalleryGrid({
  images,
  columns = 3,
  gap = '0.5rem',
  aspect = '1 / 1',
  radius,
  zoom = true,
  renderImage = defaultRenderImage,
  getItemProps,
  className,
  style,
  ...props
}: GalleryGridProps) {
  const counts = columnsByBreakpoint(columns)
  const vars: Record<string, string> = {}
  for (const bp of breakpoints) {
    const n = counts[bp]
    if (n) vars[`--gallery-cols-${bp}`] = `repeat(${Math.max(1, Math.round(n))}, minmax(0, 1fr))`
  }
  if (zoom !== false) vars['--gallery-zoom'] = String(zoom === true ? 1.03 : zoom)

  const imageClass = cn(
    'block size-full object-cover',
    zoom !== false &&
      'transition-transform duration-300 group-hover:scale-(--gallery-zoom) motion-reduce:transition-none motion-reduce:group-hover:scale-100',
  )
  const cellStyle: React.CSSProperties = { aspectRatio: aspect, borderRadius: radius }
  const cellClass = (button: boolean) =>
    cn(
      'group relative overflow-hidden bg-muted outline-none',
      radius === undefined && 'rounded-lg',
      button && 'focus-visible:ring-[3px] focus-visible:ring-ring/50',
    )

  return (
    <div
      data-slot="gallery"
      className={cn('@container w-full', className)}
      style={{ ...vars, ...style } as React.CSSProperties}
      {...props}
    >
      <div
        data-slot="gallery-grid"
        className={cn(
          'grid',
          ...breakpoints.filter((bp) => counts[bp]).map((bp) => breakpointClass[bp]),
        )}
        style={{ gap }}
      >
        {images.map((image, i) => {
          const button = getItemProps?.(i, image)
          const picture = renderImage({
            image,
            index: i,
            src: image.thumbnail ?? image.src,
            // Inside a button the name lives on the button, so the picture stays silent.
            alt: button ? '' : (image.alt ?? ''),
            className: imageClass,
          })
          if (!button)
            return (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: cells are positional, and two images may share a src
                key={i}
                data-slot="gallery-item"
                className={cellClass(false)}
                style={cellStyle}
              >
                {picture}
              </div>
            )
          return (
            <button
              // biome-ignore lint/suspicious/noArrayIndexKey: cells are positional, and two images may share a src
              key={i}
              type="button"
              data-slot="gallery-item"
              {...button}
              className={cn(cellClass(true), button.className)}
              style={{ ...cellStyle, ...button.style }}
            >
              {picture}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export { GalleryGrid }
