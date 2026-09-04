'use client'

import { ChevronLeftIcon, ChevronRightIcon, XIcon } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import * as React from 'react'
import { cn } from '@/lib/utils'
import { Image } from '@/ui/image'

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
  /** Show the thumbnail strip. Default true. */
  thumbnails?: boolean
  /** Wrap around at the ends. Default true. */
  loop?: boolean
}

/** Full screen viewer with keyboard, swipe and a fly-in from the thumbnail. */
function Lightbox({
  images,
  index,
  onIndexChange,
  open,
  onOpenChange,
  origin,
  getOrigin,
  thumbnails = true,
  loop = true,
}: LightboxProps) {
  const imgRef = React.useRef<HTMLImageElement | null>(null)
  const overlayRef = React.useRef<HTMLDivElement | null>(null)
  const chromeRef = React.useRef<HTMLDivElement | null>(null)
  const [loaded, setLoaded] = React.useState(false)
  const [direction, setDirection] = React.useState<1 | -1>(1)
  const closing = React.useRef(false)
  const pointer = React.useRef<{ x: number; y: number } | null>(null)
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
    chromeRef.current?.animate?.([{ opacity: 1 }, { opacity: 0 }], {
      duration: 160,
      fill: 'forwards',
    })
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
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          ref={overlayRef}
          data-slot="lightbox-overlay"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm duration-300 data-[state=open]:animate-in data-[state=open]:fade-in-0"
        />
        <DialogPrimitive.Content
          data-slot="lightbox"
          className="fixed inset-0 z-50 flex flex-col outline-none"
          onKeyDown={onKeyDown}
          onEscapeKeyDown={(event) => {
            event.preventDefault()
            close()
          }}
          onPointerDownOutside={(event) => event.preventDefault()}
          onPointerDown={(event) => {
            pointer.current = { x: event.clientX, y: event.clientY }
          }}
          onPointerUp={(event) => {
            const start = pointer.current
            pointer.current = null
            if (!start) return
            const dx = event.clientX - start.x
            const dy = event.clientY - start.y
            if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1)
            else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) close()
          }}
        >
          <DialogPrimitive.Title className="sr-only">
            {current?.alt || `Image ${index + 1} of ${count}`}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Use the arrow keys to move between images and Escape to close.
          </DialogPrimitive.Description>

          <div ref={chromeRef} className="contents">
            <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-4 text-white/80">
              <span className="font-mono text-sm tabular-nums">
                {index + 1} / {count}
              </span>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
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
                  aria-label="Previous image"
                  className="absolute top-1/2 left-2 z-10 hidden -translate-y-1/2 rounded-full p-3 text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:block"
                >
                  <ChevronLeftIcon className="size-6" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Next image"
                  className="absolute top-1/2 right-2 z-10 hidden -translate-y-1/2 rounded-full p-3 text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:block"
                >
                  <ChevronRightIcon className="size-6" />
                </button>
              </>
            )}
          </div>

          <div className="flex min-h-0 flex-1 items-center justify-center p-4 pt-14 pb-4 sm:px-16">
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

          <div ref={chromeRef} className="contents">
            {(current?.caption || (thumbnails && count > 1)) && (
              <div className="flex flex-col items-center gap-3 px-4 pb-4 text-white/80">
                {current?.caption && (
                  <p className="max-w-2xl text-center text-sm">{current.caption}</p>
                )}
                {thumbnails && count > 1 && (
                  <div className="flex max-w-full gap-2 overflow-x-auto p-1">
                    {images.map((image, i) => (
                      <button
                        key={image.src}
                        type="button"
                        aria-label={`Show image ${i + 1}`}
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

export interface GalleryProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  images: GalleryImage[]
  /** Grid columns. Default 3. */
  columns?: 2 | 3 | 4 | 5
  /** Aspect ratio of the cells, e.g. "4 / 3". Default "1 / 1". */
  aspect?: string
  /** Show the thumbnail strip in the lightbox. Default true. */
  thumbnails?: boolean
}

const columnClass = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-4',
  5: 'grid-cols-3 sm:grid-cols-5',
} as const

/**
 * A grid of images that opens a full screen lightbox. The picture flies from
 * its thumbnail to the center and back.
 */
function Gallery({
  images,
  columns = 3,
  aspect = '1 / 1',
  thumbnails,
  className,
  ...props
}: GalleryProps) {
  const [open, setOpen] = React.useState(false)
  const [index, setIndex] = React.useState(0)
  const [origin, setOrigin] = React.useState<Origin | null>(null)
  const thumbs = React.useRef(new Map<number, HTMLElement>())

  const openAt = (i: number, element: HTMLElement) => {
    setIndex(i)
    setOrigin({ rect: element.getBoundingClientRect() })
    setOpen(true)
  }

  return (
    <div
      data-slot="gallery"
      className={cn('grid gap-2', columnClass[columns], className)}
      {...props}
    >
      {images.map((image, i) => (
        <button
          key={image.src}
          type="button"
          ref={(el) => {
            if (el) thumbs.current.set(i, el)
            else thumbs.current.delete(i)
          }}
          onClick={(event) => openAt(i, event.currentTarget)}
          aria-label={image.alt ? `Open ${image.alt}` : `Open image ${i + 1}`}
          className="group relative overflow-hidden rounded-lg bg-muted outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          style={{ aspectRatio: aspect }}
        >
          <Image
            src={image.thumbnail ?? image.src}
            alt=""
            placeholder={image.placeholder}
            variant={image.placeholder ? 'blur' : 'fade'}
            width={image.width}
            height={image.height}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            wrapperProps={{ className: 'block size-full rounded-none' }}
            style={{ objectFit: 'cover' }}
          />
        </button>
      ))}
      <Lightbox
        images={images}
        index={index}
        onIndexChange={setIndex}
        open={open}
        onOpenChange={setOpen}
        origin={origin}
        getOrigin={(i) => thumbs.current.get(i)?.getBoundingClientRect()}
        thumbnails={thumbnails}
      />
    </div>
  )
}

export { Gallery, Lightbox }
