'use client'

import { ChevronLeftIcon, ChevronRightIcon, XIcon } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import * as React from 'react'
import {
  GalleryGrid,
  type GalleryGridProps,
  type GalleryImage,
  type GalleryImageRenderProps,
} from '@/components/ui/gallery-grid'
import { Image } from '@/components/ui/image'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export type {
  GalleryBreakpoint,
  GalleryColumns,
  GalleryImage,
  GalleryImageRenderProps,
} from '@/components/ui/gallery-grid'

export interface GalleryLabels {
  /** Name of a thumbnail in the grid, from the image's `alt` when it has one. */
  open: (index: number, alt?: string) => string
  /** Title of the lightbox for an image without `alt`. */
  image: (index: number, count: number) => string
  /** How to use the lightbox, read by screen readers. */
  help: string
  close: string
  previous: string
  next: string
  /** Name of a thumbnail in the lightbox strip. */
  show: (index: number) => string
}

export const defaultGalleryLabels: GalleryLabels = {
  open: (index, alt) => (alt ? `Open ${alt}` : `Open image ${index}`),
  image: (index, count) => `Image ${index} of ${count}`,
  help: 'Use the arrow keys to move between images and Escape to close.',
  close: 'Close',
  previous: 'Previous image',
  next: 'Next image',
  show: (index) => `Show image ${index}`,
}

interface Origin {
  rect: DOMRect
}

const SPRING = 'cubic-bezier(0.2, 0.9, 0.3, 1)'
const reducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** Animate an element from a rect on screen to its current position (FLIP). */
function flyFrom(el: HTMLElement, from: DOMRect, reverse = false): Animation | null {
  if (typeof el.animate !== 'function' || reducedMotion()) return null
  const to = el.getBoundingClientRect()
  if (!to.width || !to.height) return null
  const dx = from.left + from.width / 2 - (to.left + to.width / 2)
  const dy = from.top + from.height / 2 - (to.top + to.height / 2)
  const sx = from.width / to.width
  const sy = from.height / to.height
  const start = { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, opacity: 0.6 }
  const end = { transform: 'none', opacity: 1 }
  return el.animate(reverse ? [end, start] : [start, end], {
    duration: reverse ? 260 : 380,
    easing: SPRING,
    fill: 'both',
  })
}

export interface LightboxProps {
  images: GalleryImage[]
  index: number
  onIndexChange: (index: number) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Rect of the thumbnail the lightbox opens from, for the fly-in animation. */
  origin?: Origin | null
  /** Rects of every thumbnail, so closing flies back to the right one. */
  getOrigin?: (index: number) => DOMRect | undefined
  /**
   * Where focus goes on close, given the image being shown. Without it, focus goes back to
   * whatever had it when the lightbox opened.
   */
  getReturnFocus?: (index: number) => HTMLElement | null | undefined
  /** Show the thumbnail strip. Default true. */
  thumbnails?: boolean
  /** Wrap around at the ends. Default true. */
  loop?: boolean
  /** Close on a tap or click on the dark backdrop around the image. Default true. */
  closeOnBackdrop?: boolean
  /**
   * Element to portal the lightbox into. Default `document.body`. Pass the body of the frame
   * the gallery lives in when it renders inside an iframe, such as a page editor's canvas.
   */
  container?: HTMLElement | null
  /** Words to use instead of the English ones. A `LabelsProvider` sets them for the whole app. */
  labels?: Partial<GalleryLabels>
}

/** How far a pointer may travel between down and up and still count as a tap. */
const TAP_SLOP = 10

/** The empty dark space around the picture: the content box itself and the areas marked so. */
const isBackdrop = (target: EventTarget | null, content: Element) =>
  target === content || (target instanceof Element && target.hasAttribute('data-lightbox-backdrop'))

/** Full screen viewer with keyboard, swipe and a fly-in from the thumbnail. */
function Lightbox({
  images,
  index,
  onIndexChange,
  open,
  onOpenChange,
  origin,
  getOrigin,
  getReturnFocus,
  thumbnails = true,
  loop = true,
  closeOnBackdrop = true,
  container,
  labels: labelsProp,
}: LightboxProps) {
  const labels = useLabels('gallery', defaultGalleryLabels, labelsProp)
  const imgRef = React.useRef<HTMLImageElement | null>(null)
  const overlayRef = React.useRef<HTMLDivElement | null>(null)
  const topRef = React.useRef<HTMLDivElement | null>(null)
  const bottomRef = React.useRef<HTMLDivElement | null>(null)
  const opener = React.useRef<HTMLElement | null>(null)
  const [loaded, setLoaded] = React.useState(false)
  const [direction, setDirection] = React.useState<1 | -1>(1)
  const closing = React.useRef(false)
  const pointer = React.useRef<{ x: number; y: number; backdrop: boolean } | null>(null)
  const count = images.length
  const current = images[index]

  const go = React.useCallback(
    (delta: 1 | -1) => {
      if (count < 2) return
      let next = index + delta
      if (next < 0) next = loop ? count - 1 : 0
      if (next >= count) next = loop ? 0 : count - 1
      if (next === index) return
      setDirection(delta)
      setLoaded(false)
      onIndexChange(next)
    },
    [count, index, loop, onIndexChange],
  )

  // Fly in from the thumbnail on open.
  React.useLayoutEffect(() => {
    if (!open) {
      closing.current = false
      return
    }
    const img = imgRef.current
    if (!img || !origin) return
    const run = () => flyFrom(img, origin.rect)
    if (img.complete && img.naturalWidth) run()
    else img.addEventListener('load', run, { once: true })
    return () => img.removeEventListener('load', run)
  }, [open, origin])

  // Slide when moving between images.
  const previousIndex = React.useRef(index)
  React.useLayoutEffect(() => {
    if (previousIndex.current === index) return
    previousIndex.current = index
    const img = imgRef.current
    if (!img || typeof img.animate !== 'function' || reducedMotion()) return
    img.animate(
      [
        { transform: `translateX(${direction * 40}px)`, opacity: 0 },
        { transform: 'none', opacity: 1 },
      ],
      { duration: 260, easing: SPRING },
    )
  }, [index, direction])

  const close = React.useCallback(() => {
    if (closing.current) return
    closing.current = true
    const img = imgRef.current
    const back = getOrigin?.(index) ?? origin?.rect
    const flight = img && back ? flyFrom(img, back, true) : null
    overlayRef.current?.animate?.([{ opacity: 1 }, { opacity: 0 }], {
      duration: 240,
      fill: 'forwards',
    })
    for (const chrome of [topRef.current, bottomRef.current]) {
      chrome?.animate?.([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' })
    }
    let done = false
    const finish = () => {
      if (done) return
      done = true
      onOpenChange(false)
    }
    if (flight) {
      flight.onfinish = finish
      // Safety net for throttled tabs where animation events never arrive.
      setTimeout(finish, 400)
    } else finish()
  }, [getOrigin, index, origin, onOpenChange])

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowRight') go(1)
    if (event.key === 'ArrowLeft') go(-1)
  }

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) close()
        else onOpenChange(true)
      }}
    >
      <DialogPrimitive.Portal container={container}>
        <DialogPrimitive.Overlay
          ref={overlayRef}
          data-slot="lightbox-overlay"
          className="fixed inset-0 z-(--z-overlay,50) bg-black/90 backdrop-blur-sm duration-(--duration-slow,300ms) data-[state=open]:animate-in data-[state=open]:fade-in-0"
        />
        <DialogPrimitive.Content
          data-slot="lightbox"
          className="fixed inset-0 z-(--z-overlay,50) flex flex-col outline-none"
          onKeyDown={onKeyDown}
          onEscapeKeyDown={(event) => {
            event.preventDefault()
            close()
          }}
          onOpenAutoFocus={() => {
            // Still the element that opened it: focus moves inside only after this event.
            const active = (container?.ownerDocument ?? document).activeElement
            opener.current = active instanceof HTMLElement ? active : null
          }}
          onCloseAutoFocus={(event) => {
            // A Dialog with no Trigger has nowhere to send focus back to, and drops it on the
            // body. The thumbnail of the image last shown is the place the reader left off.
            event.preventDefault()
            const target = getReturnFocus?.(index) ?? opener.current
            target?.focus({ preventScroll: true })
            opener.current = null
          }}
          onPointerDownOutside={(event) => event.preventDefault()}
          onPointerDown={(event) => {
            pointer.current = {
              x: event.clientX,
              y: event.clientY,
              backdrop: isBackdrop(event.target, event.currentTarget),
            }
          }}
          onPointerCancel={() => {
            pointer.current = null
          }}
          onPointerUp={(event) => {
            const start = pointer.current
            pointer.current = null
            if (!start) return
            const dx = event.clientX - start.x
            const dy = event.clientY - start.y
            if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1)
            else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) close()
            // A tap, not a swipe: it began and ended on the backdrop and barely moved. Deciding
            // on the way up means a swipe that happens to end on the backdrop does not close.
            else if (
              closeOnBackdrop &&
              start.backdrop &&
              isBackdrop(event.target, event.currentTarget) &&
              Math.hypot(dx, dy) <= TAP_SLOP
            )
              close()
          }}
        >
          <DialogPrimitive.Title className="sr-only">
            {current?.alt || labels.image(index + 1, count)}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            {labels.help}
          </DialogPrimitive.Description>

          <div ref={topRef} className="contents">
            <div
              data-lightbox-backdrop=""
              className="absolute inset-x-0 top-0 z-(--z-raised,10) flex items-center justify-between p-4 text-white/80"
            >
              <span className="font-mono text-sm tabular-nums">
                {index + 1} / {count}
              </span>
              <button
                type="button"
                onClick={close}
                aria-label={labels.close}
                className="rounded-full p-2 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <XIcon className="size-5" />
              </button>
            </div>
            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label={labels.previous}
                  className="absolute top-1/2 left-2 z-(--z-raised,10) hidden -translate-y-1/2 rounded-full p-3 text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:block"
                >
                  <ChevronLeftIcon className="size-6" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label={labels.next}
                  className="absolute top-1/2 right-2 z-(--z-raised,10) hidden -translate-y-1/2 rounded-full p-3 text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:block"
                >
                  <ChevronRightIcon className="size-6" />
                </button>
              </>
            )}
          </div>

          <div
            data-slot="lightbox-stage"
            data-lightbox-backdrop=""
            className="flex min-h-0 flex-1 items-center justify-center p-4 pt-14 pb-4 sm:px-16"
          >
            {current && (
              <img
                ref={imgRef}
                key={current.src}
                src={current.src}
                alt={current.alt ?? ''}
                onLoad={() => setLoaded(true)}
                draggable={false}
                data-loaded={loaded ? '' : undefined}
                className="max-h-full max-w-full select-none rounded-md object-contain shadow-2xl"
                style={{ opacity: loaded ? 1 : 0.4, transition: 'opacity 0.2s' }}
              />
            )}
          </div>

          <div ref={bottomRef} className="contents">
            {(current?.caption || (thumbnails && count > 1)) && (
              <div
                data-lightbox-backdrop=""
                className="flex flex-col items-center gap-3 px-4 pb-4 text-white/80"
              >
                {current?.caption && (
                  <p className="max-w-2xl text-center text-sm">{current.caption}</p>
                )}
                {thumbnails && count > 1 && (
                  <div className="flex max-w-full gap-2 overflow-x-auto p-1">
                    {images.map((image, i) => (
                      <button
                        // biome-ignore lint/suspicious/noArrayIndexKey: the strip is positional, and two images may share a src
                        key={i}
                        type="button"
                        aria-label={labels.show(i + 1)}
                        aria-current={i === index}
                        onClick={() => {
                          setDirection(i > index ? 1 : -1)
                          setLoaded(false)
                          onIndexChange(i)
                        }}
                        className={cn(
                          'size-14 shrink-0 overflow-hidden rounded-md opacity-50 ring-white transition-[opacity,box-shadow] hover:opacity-90 focus-visible:outline-none focus-visible:ring-2',
                          i === index && 'opacity-100 ring-2',
                        )}
                      >
                        <img
                          src={image.thumbnail ?? image.src}
                          alt=""
                          className="size-full object-cover"
                          draggable={false}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export interface GalleryProps extends Omit<GalleryGridProps, 'getItemProps'> {
  /**
   * Open the lightbox when a cell is pressed. With false the cells are plain pictures, or
   * buttons that only call `onImageClick` when one is given. Default true.
   */
  openOnClick?: boolean
  /** Called when a cell is pressed. Calling `event.preventDefault()` keeps the lightbox shut. */
  onImageClick?: (index: number, event: React.MouseEvent<HTMLButtonElement>) => void
  /** Show the thumbnail strip in the lightbox. Default true. */
  thumbnails?: boolean
  /** Element to portal the lightbox into. Default `document.body`. See `Lightbox`. */
  container?: HTMLElement | null
  /** Words to use instead of the English ones. A `LabelsProvider` sets them for the whole app. */
  labels?: Partial<GalleryLabels>
}

/** The grid's pictures through `Image`, with the blur-up from `placeholder`. */
function renderGalleryImage({ image, src, alt, className }: GalleryImageRenderProps) {
  return (
    <Image
      src={src}
      alt={alt}
      placeholder={image.placeholder}
      variant={image.placeholder ? 'blur' : 'fade'}
      width={image.width}
      height={image.height}
      className={className}
      wrapperProps={{ className: 'block size-full rounded-none' }}
      style={{ objectFit: 'cover' }}
    />
  )
}

/**
 * A grid of images that opens a full screen lightbox. The picture flies from
 * its thumbnail to the center and back. For the grid without the lightbox, use `GalleryGrid`.
 */
function Gallery({
  images,
  openOnClick = true,
  onImageClick,
  thumbnails,
  container,
  labels: labelsProp,
  renderImage = renderGalleryImage,
  ...props
}: GalleryProps) {
  const labels = useLabels('gallery', defaultGalleryLabels, labelsProp)
  const [open, setOpen] = React.useState(false)
  const [index, setIndex] = React.useState(0)
  const [origin, setOrigin] = React.useState<Origin | null>(null)
  const thumbs = React.useRef(new Map<number, HTMLElement>())

  const openAt = (i: number, element: HTMLElement) => {
    setIndex(i)
    setOrigin({ rect: element.getBoundingClientRect() })
    setOpen(true)
  }

  const interactive = openOnClick || Boolean(onImageClick)

  return (
    <>
      <GalleryGrid
        images={images}
        renderImage={renderImage}
        getItemProps={
          interactive
            ? (i, image) => ({
                ref: (el: HTMLButtonElement | null) => {
                  if (el) thumbs.current.set(i, el)
                  else thumbs.current.delete(i)
                },
                onClick: (event) => {
                  onImageClick?.(i, event)
                  if (openOnClick && !event.defaultPrevented) openAt(i, event.currentTarget)
                },
                'aria-label': labels.open(i + 1, image.alt),
              })
            : undefined
        }
        {...props}
      />
      {openOnClick && (
        <Lightbox
          images={images}
          index={index}
          onIndexChange={setIndex}
          open={open}
          onOpenChange={setOpen}
          origin={origin}
          getOrigin={(i) => thumbs.current.get(i)?.getBoundingClientRect()}
          getReturnFocus={(i) => thumbs.current.get(i)}
          thumbnails={thumbnails}
          container={container}
          labels={labelsProp}
        />
      )}
    </>
  )
}

export { Gallery, Lightbox }
