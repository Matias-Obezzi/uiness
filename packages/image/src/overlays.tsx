import { useCallback, useEffect, useRef, useState } from 'react'
import type { ObjectFit, VariantOverlayProps } from './types'

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3

interface DrawRect {
  sx: number
  sy: number
  sw: number
  sh: number
  dx: number
  dy: number
  dw: number
  dh: number
}

/** Maps a source image into a destination box following CSS `object-fit` semantics. */
export function fitRect(
  sourceWidth: number,
  sourceHeight: number,
  destWidth: number,
  destHeight: number,
  objectFit: ObjectFit,
): DrawRect {
  const sourceRatio = sourceWidth / sourceHeight
  const destRatio = destWidth / destHeight

  if (objectFit === 'fill') {
    return {
      sx: 0,
      sy: 0,
      sw: sourceWidth,
      sh: sourceHeight,
      dx: 0,
      dy: 0,
      dw: destWidth,
      dh: destHeight,
    }
  }

  if (objectFit === 'cover') {
    let sw = sourceWidth
    let sh = sourceHeight
    if (sourceRatio > destRatio) sw = sourceHeight * destRatio
    else sh = sourceWidth / destRatio
    return {
      sx: (sourceWidth - sw) / 2,
      sy: (sourceHeight - sh) / 2,
      sw,
      sh,
      dx: 0,
      dy: 0,
      dw: destWidth,
      dh: destHeight,
    }
  }

  // contain, none and scale-down all letterbox the whole source.
  let dw = destWidth
  let dh = destHeight
  if (sourceRatio > destRatio) dh = destWidth / sourceRatio
  else dw = destHeight * sourceRatio
  return {
    sx: 0,
    sy: 0,
    sw: sourceWidth,
    sh: sourceHeight,
    dx: (destWidth - dw) / 2,
    dy: (destHeight - dh) / 2,
    dw,
    dh,
  }
}

export interface PixelateOverlayProps extends VariantOverlayProps {
  /** Largest block size in CSS pixels, used while nothing has loaded yet. */
  size: number
}

/**
 * Draws the placeholder (and later the real image) on a low resolution canvas
 * scaled up with `image-rendering: pixelated`, then refines the block size to 1px.
 */
export function PixelateOverlay({
  ctx,
  imgRef,
  placeholder,
  onComplete,
  size,
}: PixelateOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const placeholderRef = useRef<HTMLImageElement | null>(null)
  const [placeholderReady, setPlaceholderReady] = useState(false)
  const lastFrame = useRef<{ source: HTMLImageElement | null; pixel: number }>({
    source: null,
    pixel: size,
  })
  const completed = useRef(false)

  const draw = useCallback(
    (source: HTMLImageElement | null, pixel: number) => {
      const canvas = canvasRef.current
      if (!canvas) return
      lastFrame.current = { source, pixel }
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      if (!width || !height) return

      const cw = Math.max(1, Math.round(width / pixel))
      const ch = Math.max(1, Math.round(height / pixel))
      if (canvas.width !== cw) canvas.width = cw
      if (canvas.height !== ch) canvas.height = ch

      const g = canvas.getContext('2d')
      if (!g) return
      g.imageSmoothingEnabled = false
      g.clearRect(0, 0, cw, ch)
      if (!source?.naturalWidth || !source.naturalHeight) return

      const r = fitRect(source.naturalWidth, source.naturalHeight, cw, ch, ctx.objectFit)
      g.drawImage(source, r.sx, r.sy, r.sw, r.sh, r.dx, r.dy, r.dw, r.dh)
    },
    [ctx.objectFit],
  )

  // Decode the placeholder off-DOM.
  useEffect(() => {
    if (!placeholder) return
    const img = document.createElement('img')
    let cancelled = false
    img.onload = () => {
      if (cancelled) return
      placeholderRef.current = img
      setPlaceholderReady(true)
    }
    img.src = placeholder
    return () => {
      cancelled = true
      img.onload = null
    }
  }, [placeholder])

  // Loading frames: placeholder at a block size that shrinks with real progress.
  useEffect(() => {
    if (ctx.status === 'loaded') return
    const pixel = Math.max(1, size - (size - 1) * ctx.value)
    draw(placeholderReady ? placeholderRef.current : null, pixel)
  }, [ctx.status, ctx.value, size, placeholderReady, draw])

  // Keep the canvas crisp when the box resizes.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => {
      const { source, pixel } = lastFrame.current
      draw(source, pixel)
    })
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [draw])

  // Loaded: refine the real image from the current block size down to 1px.
  useEffect(() => {
    if (ctx.status !== 'loaded' || completed.current) return
    const img = imgRef.current
    const finish = () => {
      if (completed.current) return
      completed.current = true
      onComplete()
    }
    if (!img || ctx.duration <= 0) {
      finish()
      return
    }

    const from = lastFrame.current.pixel
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const t = Math.min((now - start) / ctx.duration, 1)
      const pixel = from + (1 - from) * easeOutCubic(t)
      draw(img, pixel)
      if (t < 1) frame = requestAnimationFrame(tick)
      else finish()
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [ctx.status, ctx.duration, imgRef, draw, onComplete])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      data-uiness-overlay="pixelate"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        imageRendering: 'pixelated',
        pointerEvents: 'none',
      }}
    />
  )
}

export interface BarOverlayProps extends VariantOverlayProps {
  thickness: number
}

/** Thin progress bar along the bottom edge. Meaningful with `progressive`. */
export function BarOverlay({ ctx, onComplete, thickness }: BarOverlayProps) {
  useEffect(() => {
    if (ctx.status !== 'loaded') return
    const timer = setTimeout(onComplete, ctx.duration)
    return () => clearTimeout(timer)
  }, [ctx.status, ctx.duration, onComplete])

  return (
    <div
      aria-hidden
      data-uiness-overlay="bar"
      style={{
        position: 'absolute',
        left: 0,
        bottom: 0,
        height: thickness,
        width: `${ctx.value * 100}%`,
        background: 'currentColor',
        opacity: ctx.status === 'loaded' ? 0 : 1,
        transition: `width 200ms linear, opacity ${ctx.duration}ms ${ctx.easing}`,
        pointerEvents: 'none',
      }}
    />
  )
}
