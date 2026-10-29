'use client'

import * as React from 'react'

export interface CanvasPointer {
  /** In CSS pixels from the canvas's top left. */
  x: number
  y: number
  /** Movement since the last frame, in CSS pixels. */
  dx: number
  dy: number
  down: boolean
}

export interface CanvasFrame {
  ctx: CanvasRenderingContext2D
  /** Size in CSS pixels; the context is already scaled for the screen's density. */
  width: number
  height: number
  /** Milliseconds since it started, and since the last frame. */
  time: number
  delta: number
  /** Where the pointer is over the canvas's parent, or null when it is away. */
  pointer: CanvasPointer | null
  /** Presses since the last frame, in CSS pixels. */
  presses: { x: number; y: number }[]
  /** The width or height changed since the last frame: the first frame too. */
  resized: boolean
  reduced: boolean
}

export interface UseCanvasOptions {
  /**
   * Keep drawing every frame. Default true. With reduced motion, or off screen, it draws once
   * and then only when the pointer moves or presses, or the size changes.
   */
  animate?: boolean
  /** Change it to draw again from scratch, such as once an image has loaded. */
  version?: unknown
}

/**
 * Draws on a canvas with `draw(frame)` every frame while it is on screen. The canvas follows
 * the size of its box at the screen's density, and the pointer is tracked over its parent, so
 * content laid over the canvas still feeds it. With reduced motion it draws only on change.
 */
export function useCanvas(
  ref: React.RefObject<HTMLCanvasElement | null>,
  draw: (frame: CanvasFrame) => void,
  { animate = true, version }: UseCanvasOptions = {},
) {
  const drawRef = React.useRef(draw)
  React.useEffect(() => {
    drawRef.current = draw
  })

  // `version` only asks for a fresh start.
  // biome-ignore lint/correctness/useExhaustiveDependencies: see above
  React.useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    const area = canvas?.parentElement
    if (!canvas || !ctx || !area) return
    const reduced =
      typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
    let pointer: CanvasPointer | null = null
    let presses: { x: number; y: number }[] = []
    let width = 0
    let height = 0
    let resized = true
    let visible = true
    let frame = 0
    let last = performance.now()
    const start = last

    const step = (now: number) => {
      frame = 0
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      if (w !== width || h !== height || canvas.width !== Math.round(w * dpr)) {
        width = w
        height = h
        canvas.width = Math.round(w * dpr)
        canvas.height = Math.round(h * dpr)
        resized = true
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (width && height)
        drawRef.current({
          ctx,
          width,
          height,
          time: now - start,
          delta: Math.min(64, now - last),
          pointer,
          presses,
          resized,
          reduced,
        })
      last = now
      presses = []
      resized = false
      if (pointer) {
        pointer.dx = 0
        pointer.dy = 0
      }
      if (animate && !reduced && visible) frame = requestAnimationFrame(step)
    }
    const wake = () => {
      if (!frame) frame = requestAnimationFrame(step)
    }

    const at = (event: PointerEvent) => {
      const box = canvas.getBoundingClientRect()
      return { x: event.clientX - box.left, y: event.clientY - box.top }
    }
    const move = (event: PointerEvent) => {
      const p = at(event)
      pointer = {
        ...p,
        dx: pointer ? p.x - pointer.x + pointer.dx : 0,
        dy: pointer ? p.y - pointer.y + pointer.dy : 0,
        down: event.buttons > 0,
      }
      wake()
    }
    const down = (event: PointerEvent) => {
      const p = at(event)
      presses.push(p)
      pointer = { ...p, dx: 0, dy: 0, down: true }
      wake()
    }
    const up = () => {
      if (pointer) pointer.down = false
    }
    const leave = () => {
      pointer = null
      wake()
    }
    area.addEventListener('pointermove', move)
    area.addEventListener('pointerdown', down)
    area.addEventListener('pointerup', up)
    area.addEventListener('pointerleave', leave)
    const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(wake)
    resize?.observe(canvas)
    // Off screen, nothing is drawn.
    const seen =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(([entry]) => {
            visible = !!entry?.isIntersecting
            if (visible) wake()
          })
    seen?.observe(canvas)
    wake()
    return () => {
      cancelAnimationFrame(frame)
      area.removeEventListener('pointermove', move)
      area.removeEventListener('pointerdown', down)
      area.removeEventListener('pointerup', up)
      area.removeEventListener('pointerleave', leave)
      resize?.disconnect()
      seen?.disconnect()
    }
  }, [ref, animate, version])
}

/** Smooth noise in two dimensions, from -1 to 1: cheap value noise, enough for drifting fields. */
export function noise2(x: number, y: number): number {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const hash = (i: number, j: number) => {
    const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453
    return (s - Math.floor(s)) * 2 - 1
  }
  const fade = (t: number) => t * t * (3 - 2 * t)
  const u = fade(xf)
  const v = fade(yf)
  const a = hash(xi, yi) + (hash(xi + 1, yi) - hash(xi, yi)) * u
  const b = hash(xi, yi + 1) + (hash(xi + 1, yi + 1) - hash(xi, yi + 1)) * u
  return a + (b - a) * v
}

/** A CSS colour of an element, resolved, for drawing on a canvas. */
export function cssColor(element: Element, property = 'color'): string {
  return getComputedStyle(element).getPropertyValue(property) || '#000'
}
