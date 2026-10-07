'use client'

import * as React from 'react'
import { useInView } from '@/hooks/use-in-view'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

export type HighlighterAction =
  | 'highlight'
  | 'underline'
  | 'strike-through'
  | 'box'
  | 'circle'
  | 'bracket'
  | 'crossed-off'

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface RoughPathOptions {
  /** Deterministic seed for jitter generation. Default `42`. */
  seed?: number
  /** Padding around the rect in pixels. Default `2`. */
  padding?: number | [number, number]
  /** Number of sketch lines drawn. Default `1`. */
  iterations?: number
  /** Sides to bracket when action is bracket. Default `'both'`. */
  brackets?: 'left' | 'right' | 'both'
}

/** Linear congruential generator for deterministic pseudo-random jitter. */
function createRng(seed: number) {
  let s = Math.abs(seed) || 1
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

const f = (n: number) => Number(n.toFixed(2))
const subscribeNever = () => () => {}

/**
 * Pure generator creating deterministic SVG paths with subtle hand-drawn jitter.
 */
export function generateRoughPath(
  action: 'box' | 'circle' | 'bracket' | 'crossed-off',
  rect: Rect,
  options: RoughPathOptions = {},
): string {
  const { seed = 42, padding = 2, iterations = 1, brackets = 'both' } = options
  const rng = createRng(seed)

  const padX = Array.isArray(padding) ? padding[0] : padding
  const padY = Array.isArray(padding) ? padding[1] : padding

  const x = f(rect.x - padX)
  const y = f(rect.y - padY)
  const w = f(rect.width + padX * 2)
  const h = f(rect.height + padY * 2)

  const jitter = (amount = 1.5) => (rng() - 0.5) * 2 * amount

  const commands: string[] = []

  if (action === 'box') {
    for (let it = 0; it < iterations; it++) {
      const off = it * 1.2
      const x1 = f(x - off + jitter())
      const y1 = f(y - off + jitter())
      const x2 = f(x + w + off + jitter())
      const y2 = f(y - off + jitter())
      const x3 = f(x + w + off + jitter())
      const y3 = f(y + h + off + jitter())
      const x4 = f(x - off + jitter())
      const y4 = f(y + h + off + jitter())

      commands.push(
        `M ${x1} ${y1}`,
        `C ${f(x1 + w * 0.5 + jitter())} ${f(y1 + jitter())}, ${f(x2 - w * 0.2 + jitter())} ${f(y2 + jitter())}, ${x2} ${y2}`,
        `C ${f(x2 + jitter())} ${f(y2 + h * 0.5 + jitter())}, ${f(x3 + jitter())} ${f(y3 - h * 0.2 + jitter())}, ${x3} ${y3}`,
        `C ${f(x3 - w * 0.5 + jitter())} ${f(y3 + jitter())}, ${f(x4 + w * 0.2 + jitter())} ${f(y4 + jitter())}, ${x4} ${y4}`,
        `C ${f(x4 + jitter())} ${f(y4 - h * 0.5 + jitter())}, ${f(x1 + jitter())} ${f(y1 + h * 0.2 + jitter())}, ${x1} ${y1}`,
      )
    }
    return commands.join(' ')
  }

  if (action === 'circle') {
    const cx = f(x + w / 2)
    const cy = f(y + h / 2)
    const rx = f(w / 2)
    const ry = f(h / 2)

    for (let it = 0; it < iterations; it++) {
      const off = it * 1.5
      const rxOff = rx + off
      const ryOff = ry + off

      // 4-point cubic bezier approximation of an ellipse with jitter
      const kappa = 0.5522847498
      const kx = rxOff * kappa
      const ky = ryOff * kappa

      const p0x = f(cx - rxOff + jitter())
      const p0y = f(cy + jitter())
      const p1x = f(cx + jitter())
      const p1y = f(cy - ryOff + jitter())
      const p2x = f(cx + rxOff + jitter())
      const p2y = f(cy + jitter())
      const p3x = f(cx + jitter())
      const p3y = f(cy + ryOff + jitter())

      commands.push(
        `M ${p0x} ${p0y}`,
        `C ${f(cx - rxOff)} ${f(cy - ky + jitter())}, ${f(cx - kx + jitter())} ${f(cy - ryOff)}, ${p1x} ${p1y}`,
        `C ${f(cx + kx + jitter())} ${f(cy - ryOff)}, ${f(cx + rxOff)} ${f(cy - ky + jitter())}, ${p2x} ${p2y}`,
        `C ${f(cx + rxOff)} ${f(cy + ky + jitter())}, ${f(cx + kx + jitter())} ${f(cy + ryOff)}, ${p3x} ${p3y}`,
        `C ${f(cx - kx + jitter())} ${f(cy + ryOff)}, ${f(cx - rxOff)} ${f(cy + ky + jitter())}, ${p0x} ${p0y}`,
      )
    }
    return commands.join(' ')
  }

  if (action === 'bracket') {
    const arm = Math.min(10, w * 0.15)
    if (brackets === 'left' || brackets === 'both') {
      const xLeft = f(x + jitter())
      commands.push(
        `M ${f(xLeft + arm)} ${f(y + jitter())}`,
        `L ${xLeft} ${f(y + jitter())}`,
        `L ${xLeft} ${f(y + h + jitter())}`,
        `L ${f(xLeft + arm)} ${f(y + h + jitter())}`,
      )
    }
    if (brackets === 'right' || brackets === 'both') {
      const xRight = f(x + w + jitter())
      commands.push(
        `M ${f(xRight - arm)} ${f(y + jitter())}`,
        `L ${xRight} ${f(y + jitter())}`,
        `L ${xRight} ${f(y + h + jitter())}`,
        `L ${f(xRight - arm)} ${f(y + h + jitter())}`,
      )
    }
    return commands.join(' ')
  }

  if (action === 'crossed-off') {
    // Two diagonal lines
    commands.push(
      `M ${f(x + jitter())} ${f(y + jitter())}`,
      `L ${f(x + w + jitter())} ${f(y + h + jitter())}`,
      `M ${f(x + jitter())} ${f(y + h + jitter())}`,
      `L ${f(x + w + jitter())} ${f(y + jitter())}`,
    )
    return commands.join(' ')
  }

  return ''
}

export interface HighlighterProps extends Omit<React.ComponentProps<'span'>, 'children'> {
  /** The text or inline content to annotate. */
  children: React.ReactNode
  /** Type of annotation to draw. Default `'highlight'`. */
  action?: HighlighterAction
  /** Color of the highlight stroke or background fill. Default `'currentColor'`. */
  color?: string
  /** Stroke width in pixels for underlines, strikethroughs, or rough SVG paths. Default `2`. */
  strokeWidth?: number
  /** Duration of the drawing animation in milliseconds. Default `600`. */
  duration?: number
  /** Delay before drawing begins in milliseconds. Default `0`. */
  delay?: number
  /** Padding around the annotated content in pixels. Default `2`. */
  padding?: number | [number, number]
  /** Number of sketch lines drawn for rough hand-drawn paths. Default `1`. */
  iterations?: number
  /** Whether the drawing triggers on scroll into view or upon mounting. Default `'view'`. */
  trigger?: 'view' | 'mount'
  /** Sides to bracket when action is bracket. Default `'both'`. */
  brackets?: 'left' | 'right' | 'both'
  /** Deterministic seed for the hand-drawn jitter. Default `42`. */
  seed?: number
}

/**
 * Hand-drawn annotations (highlights, underlines, boxes, circles and brackets) without third-party dependencies.
 *
 * Linear gradient annotations (`highlight`, `underline`, `strike-through`) use CSS background sizing
 * and `box-decoration-break: clone` to wrap cleanly across multiple lines. Enclosing annotations
 * (`box`, `circle`, `bracket`, `crossed-off`) measure client rects and render deterministic SVG paths.
 */
function Highlighter({
  children,
  action = 'highlight',
  color = 'currentColor',
  strokeWidth = 2,
  duration = 600,
  delay = 0,
  padding = 2,
  iterations = 1,
  trigger = 'view',
  brackets = 'both',
  seed = 42,
  className,
  style,
  ...props
}: HighlighterProps) {
  const containerRef = React.useRef<HTMLSpanElement>(null)
  const inView = useInView(containerRef, { once: true, amount: 0.1 })
  const reduced = useReducedMotion()

  const mounted = React.useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  )
  const [rects, setRects] = React.useState<Rect[]>([])

  const isDrawn = reduced || (trigger === 'mount' ? mounted : inView)

  const isCssAction =
    action === 'highlight' || action === 'underline' || action === 'strike-through'

  // Measure client rects for multi-line SVG path annotations
  React.useEffect(() => {
    if (isCssAction) return
    const el = containerRef.current
    if (!el) return

    const measure = () => {
      const containerRect = el.getBoundingClientRect()
      const clientRects = Array.from(el.getClientRects()).map((r) => ({
        x: r.left - containerRect.left,
        y: r.top - containerRect.top,
        width: r.width,
        height: r.height,
      }))
      setRects(
        clientRects.length > 0
          ? clientRects
          : [{ x: 0, y: 0, width: containerRect.width, height: containerRect.height }],
      )
    }

    measure()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    ro?.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      ro?.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [isCssAction])

  if (isCssAction) {
    const isHighlight = action === 'highlight'
    const isUnderline = action === 'underline'

    const bgSize = isDrawn
      ? isHighlight
        ? '100% 100%'
        : `100% ${strokeWidth}px`
      : isHighlight
        ? '0% 100%'
        : `0% ${strokeWidth}px`

    const bgPosition = isHighlight ? '0 0' : isUnderline ? '0 100%' : '0 50%'

    return (
      <span
        ref={containerRef}
        data-slot="text-highlighter"
        className={cn(
          'relative inline [box-decoration-break:clone] [-webkit-box-decoration-break:clone]',
          className,
        )}
        style={
          {
            backgroundImage: `linear-gradient(to right, ${color}, ${color})`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: bgPosition,
            backgroundSize: bgSize,
            transition: reduced
              ? 'none'
              : `background-size ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
            ...style,
          } as React.CSSProperties
        }
        {...props}
      >
        {children}
      </span>
    )
  }

  // SVG-based rough path actions: box, circle, bracket, crossed-off
  return (
    <span
      ref={containerRef}
      data-slot="text-highlighter"
      className={cn('relative inline', className)}
      style={style}
      {...props}
    >
      {children}
      {rects.length > 0 ? (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 size-full overflow-visible"
        >
          {rects.map((rect, idx) => {
            const pathD = generateRoughPath(
              action as 'box' | 'circle' | 'bracket' | 'crossed-off',
              rect,
              {
                seed: seed + idx * 17,
                padding,
                iterations,
                brackets,
              },
            )

            // Approximate stroke length for the dasharray animation
            const approxLength = Math.max(
              100,
              action === 'circle'
                ? Math.PI * (rect.width + rect.height) * iterations
                : (rect.width + rect.height) * 2 * iterations,
            )

            return (
              <path
                // biome-ignore lint/suspicious/noArrayIndexKey: rects are positional based on multiline layout
                key={idx}
                d={pathD}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  strokeDasharray: approxLength,
                  strokeDashoffset: isDrawn ? 0 : approxLength,
                  transition: reduced
                    ? 'none'
                    : `stroke-dashoffset ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
                }}
              />
            )
          })}
        </svg>
      ) : null}
    </span>
  )
}

export { Highlighter, Highlighter as TextHighlighter }
