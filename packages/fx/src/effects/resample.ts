import { defineEffect, type Effect, keyOf } from '../types'

/**
 * Chunky pixels. Averages `size`x`size` blocks, then scales back up without smoothing.
 * Works without pixel access, so it is fine with cross origin images.
 */
export function pixelate(size = 8): Effect {
  const block = Math.max(1, size)
  return defineEffect({
    name: 'pixelate',
    key: keyOf('pixelate', block),
    draw: ({ ctx, width, height, scratch }) => {
      if (block <= 1) return
      const w = Math.max(1, Math.round(width / block))
      const h = Math.max(1, Math.round(height / block))
      const small = scratch(w, h)
      const sctx = small.getContext('2d') as CanvasRenderingContext2D | null
      if (!sctx) return
      sctx.imageSmoothingEnabled = true
      sctx.clearRect(0, 0, w, h)
      sctx.drawImage(ctx.canvas, 0, 0, w, h)
      ctx.imageSmoothingEnabled = false
      ctx.clearRect(0, 0, width, height)
      ctx.drawImage(small, 0, 0, w, h, 0, 0, width, height)
      ctx.imageSmoothingEnabled = true
    },
  })
}

/** Mirror the image horizontally or vertically. */
export function flip(axis: 'x' | 'y' = 'x'): Effect {
  return defineEffect({
    name: 'flip',
    key: keyOf('flip', axis),
    draw: ({ ctx, width, height, scratch }) => {
      const copy = scratch(width, height)
      const cctx = copy.getContext('2d') as CanvasRenderingContext2D | null
      if (!cctx) return
      cctx.clearRect(0, 0, width, height)
      cctx.drawImage(ctx.canvas, 0, 0)
      ctx.save()
      ctx.clearRect(0, 0, width, height)
      if (axis === 'x') ctx.setTransform(-1, 0, 0, 1, width, 0)
      else ctx.setTransform(1, 0, 0, -1, 0, height)
      ctx.drawImage(copy, 0, 0)
      ctx.restore()
    },
  })
}
