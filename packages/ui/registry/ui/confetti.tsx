'use client'

import { Slot } from 'radix-ui'
import type * as React from 'react'
import { cn } from '@/lib/utils'

export type ConfettiShape = 'square' | 'circle' | 'strip' | 'star'

export interface ConfettiOptions {
  /** How many pieces in the burst. Default 60. */
  particleCount?: number
  /** Where the burst starts, as fractions of the viewport. Default `{ x: 0.5, y: 0.6 }`. */
  origin?: { x?: number; y?: number }
  /** Start from the center of this element instead of `origin`. */
  element?: Element | null
  /** Direction in degrees, 90 is straight up. Default 90. */
  angle?: number
  /** How wide the burst fans out, in degrees. Default 60. */
  spread?: number
  /** Starting speed in pixels per frame. Default 45. */
  velocity?: number
  /** How hard pieces fall. Default 1. */
  gravity?: number
  /** How much speed is kept each frame, 0 to 1. Default 0.9. */
  decay?: number
  /** Sideways push in pixels per frame, for wind. Default 0. */
  drift?: number
  /** Frames a piece lives for. Default 200. */
  ticks?: number
  /** Any CSS colors, theme variables included. Defaults to a bright mix. */
  colors?: string[]
  /** Shapes picked at random. Default `['square', 'circle', 'strip']`. */
  shapes?: ConfettiShape[]
  /** Size multiplier. Default 1. */
  scalar?: number
}

interface Piece {
  x: number
  y: number
  angle: number
  velocity: number
  gravity: number
  decay: number
  drift: number
  size: number
  color: string
  shape: ConfettiShape
  rotation: number
  spin: number
  wobble: number
  wobbleSpeed: number
  tick: number
  ticks: number
}

const DEFAULT_COLORS = ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
const DEFAULT_SHAPES: ConfettiShape[] = ['square', 'circle', 'strip']

let canvas: HTMLCanvasElement | null = null
let ctx: CanvasRenderingContext2D | null = null
let pieces: Piece[] = []
let frame = 0
let last = 0
let dpr = 1

/** The one shared canvas, created on the first burst and removed when the last piece is gone. */
function ensureCanvas() {
  if (canvas && ctx) return true
  const el = document.createElement('canvas')
  const context = el.getContext('2d')
  if (!context) return false
  el.setAttribute('aria-hidden', 'true')
  el.dataset.slot = 'confetti'
  Object.assign(el.style, {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 'var(--z-toast, 70)',
  })
  document.body.appendChild(el)
  canvas = el
  ctx = context
  return true
}

function resize() {
  if (!canvas || !ctx) return
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = Math.round(window.innerWidth * dpr)
  const h = Math.round(window.innerHeight * dpr)
  if (canvas.width === w && canvas.height === h) return
  canvas.width = w
  canvas.height = h
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

/** Turns `var(--primary)` and friends into something the canvas understands. */
function resolveColors(colors: string[]) {
  const el = canvas
  if (!el) return colors
  return colors.map((color) => {
    if (!color.includes('var(')) return color
    el.style.color = color
    return getComputedStyle(el).color || color
  })
}

function star(context: CanvasRenderingContext2D, r: number) {
  context.beginPath()
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : r * 0.45
    const a = (Math.PI / 5) * i - Math.PI / 2
    context.lineTo(Math.cos(a) * radius, Math.sin(a) * radius)
  }
  context.closePath()
  context.fill()
}

function draw(context: CanvasRenderingContext2D, p: Piece) {
  const progress = p.tick / p.ticks
  context.save()
  context.globalAlpha = Math.min(1, (1 - progress) * 3)
  context.fillStyle = p.color
  context.translate(p.x, p.y)
  context.rotate(p.rotation)
  // Squash one axis with the wobble so the piece looks like it flips in 3D.
  context.scale(1, Math.cos(p.wobble))
  const s = p.size
  if (p.shape === 'circle') {
    context.beginPath()
    context.arc(0, 0, s / 2, 0, Math.PI * 2)
    context.fill()
  } else if (p.shape === 'strip') {
    context.fillRect(-s * 0.2, -s, s * 0.4, s * 2)
  } else if (p.shape === 'star') {
    star(context, s * 0.75)
  } else {
    context.fillRect(-s / 2, -s / 2, s, s)
  }
  context.restore()
}

function loop(now: number) {
  if (!canvas || !ctx) return
  // Physics are tuned per 60fps frame, so scale by how many frames actually passed.
  const f = last ? Math.min(Math.max((now - last) / (1000 / 60), 0), 4) : 1
  last = now
  resize()
  const width = window.innerWidth
  const height = window.innerHeight
  ctx.clearRect(0, 0, width, height)
  pieces = pieces.filter((p) => {
    p.x += (Math.cos(p.angle) * p.velocity + p.drift) * f
    p.y += (Math.sin(p.angle) * p.velocity + p.gravity * 3) * f
    p.velocity *= p.decay ** f
    p.rotation += p.spin * f
    p.wobble += p.wobbleSpeed * f
    p.tick += f
    if (p.tick >= p.ticks || p.y > height + 40) return false
    draw(ctx as CanvasRenderingContext2D, p)
    return true
  })
  if (pieces.length) {
    frame = requestAnimationFrame(loop)
  } else {
    reset()
  }
}

/**
 * Fires a burst of confetti on a fixed canvas over the page. The canvas is added on the first
 * burst and removed once every piece has fallen. Does nothing on the server, without canvas
 * support, or with `prefers-reduced-motion`.
 */
function confetti(options: ConfettiOptions = {}) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return
  }
  if (!ensureCanvas()) return

  const {
    particleCount = 60,
    origin,
    element,
    angle = 90,
    spread = 60,
    velocity = 45,
    gravity = 1,
    decay = 0.9,
    drift = 0,
    ticks = 200,
    colors = DEFAULT_COLORS,
    shapes = DEFAULT_SHAPES,
    scalar = 1,
  } = options

  let x = (origin?.x ?? 0.5) * window.innerWidth
  let y = (origin?.y ?? 0.6) * window.innerHeight
  if (element) {
    const rect = element.getBoundingClientRect()
    x = rect.left + rect.width / 2
    y = rect.top + rect.height / 2
  }

  const palette = resolveColors(colors.length ? colors : DEFAULT_COLORS)
  const kinds = shapes.length ? shapes : DEFAULT_SHAPES
  const rad = (angle * Math.PI) / 180
  const fan = (spread * Math.PI) / 180

  for (let i = 0; i < particleCount; i++) {
    pieces.push({
      x,
      y,
      // Canvas y points down, so flip the angle.
      angle: -rad + (0.5 * fan - Math.random() * fan),
      velocity: velocity * 0.5 + Math.random() * velocity * 0.5,
      gravity,
      decay,
      drift,
      size: (6 + Math.random() * 6) * scalar,
      color: palette[Math.floor(Math.random() * palette.length)] as string,
      shape: kinds[Math.floor(Math.random() * kinds.length)] as ConfettiShape,
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.3,
      wobble: Math.random() * 10,
      wobbleSpeed: 0.05 + Math.random() * 0.1,
      tick: 0,
      ticks: ticks * (0.8 + Math.random() * 0.4),
    })
  }

  if (!frame) {
    resize()
    last = 0
    frame = requestAnimationFrame(loop)
  }
}

/** Stops every burst right away and removes the canvas. */
function reset() {
  if (frame) cancelAnimationFrame(frame)
  frame = 0
  last = 0
  pieces = []
  canvas?.remove()
  canvas = null
  ctx = null
}

confetti.reset = reset

export interface ConfettiButtonProps extends React.ComponentProps<'button'> {
  /** Render the child element instead of a `<button>`, e.g. your own `Button`. */
  asChild?: boolean
  /** Burst options. Without an `origin` it bursts from the button itself. */
  options?: ConfettiOptions
}

/** A button that fires confetti from itself when clicked. */
function ConfettiButton({ asChild, options, className, onClick, ...props }: ConfettiButtonProps) {
  const Comp = asChild ? Slot.Root : 'button'
  return (
    <Comp
      data-slot="confetti-button"
      type={asChild ? undefined : 'button'}
      className={cn(className)}
      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(e)
        if (e.defaultPrevented) return
        confetti(options?.origin ? options : { element: e.currentTarget, ...options })
      }}
      {...props}
    />
  )
}

export { ConfettiButton, confetti }
