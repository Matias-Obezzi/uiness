'use client'

import { PlayIcon, Trash2Icon, Undo2Icon } from 'lucide-react'
import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'
import { Button } from '@/ui/button'

/* -------------------------------------------------------------------------------------------------
 * Strokes. Points in CSS pixels from the top left of the pad, so they survive a resize and a
 * change of pixel ratio, and export at any scale.
 * -----------------------------------------------------------------------------------------------*/

export interface SignaturePoint {
  x: number
  y: number
  /** Milliseconds since the page loaded, used for the replay. */
  t: number
  /** Line width at this point, in CSS pixels. */
  w: number
}

export type SignatureStroke = SignaturePoint[]

const mid = (a: SignaturePoint, b: SignaturePoint) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })

/**
 * Walk a stroke as a chain of quadratic curves between midpoints, which is what keeps fast
 * strokes round instead of a polyline. `upTo` stops early for the replay.
 */
function walk(
  stroke: SignatureStroke,
  draw: {
    dot: (x: number, y: number, r: number) => void
    segment: (
      from: { x: number; y: number },
      ctrl: { x: number; y: number } | null,
      to: { x: number; y: number },
      w: number,
    ) => void
  },
  upTo = stroke.length,
  closed = true,
) {
  const n = Math.min(upTo, stroke.length)
  const first = stroke[0]
  if (!first || n === 0) return
  if (stroke.length === 1) {
    draw.dot(first.x, first.y, first.w / 2)
    return
  }
  for (let i = 1; i < n; i++) {
    const a = stroke[i - 1]
    const b = stroke[i]
    if (!a || !b) continue
    const prev = stroke[i - 2]
    if (!prev) draw.segment(a, null, mid(a, b), (a.w + b.w) / 2)
    else draw.segment(mid(prev, a), a, mid(a, b), (prev.w + a.w + b.w) / 3)
  }
  const last = stroke[n - 1]
  const before = stroke[n - 2]
  if (closed && n === stroke.length && last && before) {
    draw.segment(mid(before, last), null, last, last.w)
  }
}

function paint(
  ctx: CanvasRenderingContext2D,
  stroke: SignatureStroke,
  color: string,
  upTo?: number,
  closed?: boolean,
) {
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  walk(
    stroke,
    {
      dot: (x, y, r) => {
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
      },
      segment: (from, ctrl, to, w) => {
        ctx.beginPath()
        ctx.lineWidth = w
        ctx.moveTo(from.x, from.y)
        if (ctrl) ctx.quadraticCurveTo(ctrl.x, ctrl.y, to.x, to.y)
        else ctx.lineTo(to.x, to.y)
        ctx.stroke()
      },
    },
    upTo,
    closed,
  )
}

/** The newest curve of a stroke still being drawn, so each move costs one curve. */
function paintLatest(ctx: CanvasRenderingContext2D, stroke: SignatureStroke, color: string) {
  const n = stroke.length
  const c = stroke[n - 1]
  const b = stroke[n - 2]
  if (!c || !b) return
  const a = stroke[n - 3]
  ctx.strokeStyle = color
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  if (a) {
    const from = mid(a, b)
    const to = mid(b, c)
    ctx.lineWidth = (a.w + b.w + c.w) / 3
    ctx.moveTo(from.x, from.y)
    ctx.quadraticCurveTo(b.x, b.y, to.x, to.y)
  } else {
    const to = mid(b, c)
    ctx.lineWidth = (b.w + c.w) / 2
    ctx.moveTo(b.x, b.y)
    ctx.lineTo(to.x, to.y)
  }
  ctx.stroke()
}

const fixed = (n: number) => Math.round(n * 100) / 100

/** The strokes as an SVG document, one path per curve so each keeps its own width. */
export function signatureToSVG(
  strokes: SignatureStroke[],
  {
    width,
    height,
    color = '#000',
    background,
  }: { width: number; height: number; color?: string; background?: string },
) {
  const parts: string[] = []
  for (const stroke of strokes) {
    walk(stroke, {
      dot: (x, y, r) =>
        parts.push(`<circle cx="${fixed(x)}" cy="${fixed(y)}" r="${fixed(r)}" fill="${color}"/>`),
      segment: (from, ctrl, to, w) => {
        const d = ctrl
          ? `M${fixed(from.x)} ${fixed(from.y)}Q${fixed(ctrl.x)} ${fixed(ctrl.y)} ${fixed(to.x)} ${fixed(to.y)}`
          : `M${fixed(from.x)} ${fixed(from.y)}L${fixed(to.x)} ${fixed(to.y)}`
        parts.push(`<path d="${d}" stroke-width="${fixed(w)}"/>`)
      },
    })
  }
  const bg = background ? `<rect width="100%" height="100%" fill="${background}"/>` : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${bg}<g fill="none" stroke="${color}" stroke-linecap="round" stroke-linejoin="round">${parts.join('')}</g></svg>`
}

/* -------------------------------------------------------------------------------------------------
 * Props
 * -----------------------------------------------------------------------------------------------*/

export interface SignaturePadHandle {
  /** The canvas, for anything not covered here. */
  canvas: HTMLCanvasElement | null
  clear: () => void
  undo: () => void
  /** Draw the strokes again in the order and at the pace they were made. */
  replay: () => void
  isEmpty: () => boolean
  /** A PNG data URL. Transparent unless a background is given. Default scale the pixel ratio. */
  toDataURL: (options?: { background?: string; color?: string; scale?: number }) => string
  /** An SVG document as a string. */
  toSVG: (options?: { background?: string; color?: string }) => string
}

export interface SignaturePadLabels {
  /** Name of the drawing surface. */
  pad: string
  /** Read after the name when something is drawn. */
  strokes: (count: number) => string
  /** Read after the name when nothing is drawn. */
  empty: string
  undo: string
  clear: string
  replay: string
  placeholder: string
}

export const defaultSignaturePadLabels: SignaturePadLabels = {
  pad: 'Signature',
  strokes: (count) => `${count} ${count === 1 ? 'stroke' : 'strokes'}`,
  empty: 'empty',
  undo: 'Undo',
  clear: 'Clear',
  replay: 'Replay',
  placeholder: 'Sign here',
}

export interface SignaturePadProps
  extends Omit<React.ComponentProps<'div'>, 'onChange' | 'defaultValue' | 'ref'> {
  /** Imperative handle: clear, undo, replay and export. */
  ref?: React.Ref<SignaturePadHandle>
  /** The strokes. Controlled. */
  value?: SignatureStroke[]
  /** The starting strokes when uncontrolled. */
  defaultValue?: SignatureStroke[]
  /** Called after every finished stroke, undo and clear. */
  onChange?: (strokes: SignatureStroke[]) => void
  /** Ink color. Default the text color, so it follows light and dark themes. */
  color?: string
  /** Thinnest line, reached when moving fast. Default 0.75. */
  minWidth?: number
  /** Thickest line, when moving slowly. Default 3. */
  maxWidth?: number
  /** Show the undo, clear and replay buttons. Default true. */
  toolbar?: boolean
  disabled?: boolean
  /** With a name, a hidden input carries the signature as a PNG data URL in a form. */
  name?: string
  /** Words to use instead of the English ones. A `LabelsProvider` sets them for the whole app. */
  labels?: Partial<SignaturePadLabels>
  /** Classes for the drawing surface. `className` goes on the wrapper. */
  canvasClassName?: string
}

/* -------------------------------------------------------------------------------------------------
 * SignaturePad
 * -----------------------------------------------------------------------------------------------*/

/**
 * A canvas to sign on with a mouse, a finger or a pen. The line thins as it speeds up, a pen
 * uses its pressure, and the ink follows the theme. Undo, clear and replay are buttons, and
 * the result exports as a PNG or an SVG.
 */
function SignaturePad({
  ref,
  value: valueProp,
  defaultValue,
  onChange,
  color,
  minWidth = 0.75,
  maxWidth = 3,
  toolbar = true,
  disabled,
  name,
  labels: labelsProp,
  className,
  canvasClassName,
  onKeyDown,
  ...props
}: SignaturePadProps) {
  const labels = useLabels('signature-pad', defaultSignaturePadLabels, labelsProp)
  const [internal, setInternal] = React.useState<SignatureStroke[]>(defaultValue ?? [])
  const strokes = valueProp ?? internal
  const strokesRef = React.useRef(strokes)
  strokesRef.current = strokes

  const commit = (next: SignatureStroke[]) => {
    strokesRef.current = next
    if (valueProp === undefined) setInternal(next)
    onChange?.(next)
  }

  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const hiddenRef = React.useRef<HTMLInputElement>(null)
  const current = React.useRef<{ points: SignatureStroke; velocity: number } | null>(null)
  const replayFrame = React.useRef(0)
  const [replaying, setReplaying] = React.useState(false)
  const [ink, setInk] = React.useState(color ?? '#000')
  const reduced = useReducedMotion()

  const redraw = React.useCallback(
    (list: SignatureStroke[] = strokesRef.current) => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!canvas || !ctx) return
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.restore()
      for (const s of list) paint(ctx, s, ink)
    },
    [ink],
  )

  // The ink is read from CSS, so it changes with the theme. Watch the attributes themes
  // usually flip on the root, and the system scheme, and read it again.
  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const read = () => setInk(color ?? (getComputedStyle(canvas).color || '#000'))
    read()
    if (color) return
    const observer = new MutationObserver(read)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style', 'data-theme'],
    })
    const mq = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null
    mq?.addEventListener('change', read)
    return () => {
      observer.disconnect()
      mq?.removeEventListener('change', read)
    }
  }, [color])

  // Back the canvas with device pixels and draw again whenever its box or the ratio changes.
  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const fitCanvas = () => {
      const dpr = window.devicePixelRatio || 1
      const w = Math.round(canvas.clientWidth * dpr)
      const h = Math.round(canvas.clientHeight * dpr)
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      canvas.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0)
      redraw()
    }
    fitCanvas()
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(fitCanvas) : null
    ro?.observe(canvas)
    window.addEventListener('resize', fitCanvas)
    return () => {
      ro?.disconnect()
      window.removeEventListener('resize', fitCanvas)
    }
  }, [redraw])

  React.useEffect(() => {
    if (!replaying) redraw(strokes)
  }, [strokes, redraw, replaying])

  const exportPNG = React.useCallback(
    (options: { background?: string; color?: string; scale?: number } = {}) => {
      const canvas = canvasRef.current
      if (!canvas) return ''
      const scale = options.scale ?? (window.devicePixelRatio || 1)
      const out = document.createElement('canvas')
      out.width = Math.max(1, Math.round(canvas.clientWidth * scale))
      out.height = Math.max(1, Math.round(canvas.clientHeight * scale))
      const ctx = out.getContext('2d')
      if (!ctx) return ''
      if (options.background) {
        ctx.fillStyle = options.background
        ctx.fillRect(0, 0, out.width, out.height)
      }
      ctx.scale(scale, scale)
      for (const s of strokesRef.current) paint(ctx, s, options.color ?? ink)
      try {
        return out.toDataURL('image/png')
      } catch {
        return ''
      }
    },
    [ink],
  )

  // The form value is a PNG, refreshed after each change rather than on every render.
  React.useEffect(() => {
    if (!name || !hiddenRef.current) return
    hiddenRef.current.value = strokes.length ? exportPNG() : ''
  }, [name, strokes, exportPNG])

  const stopReplay = React.useCallback(() => {
    cancelAnimationFrame(replayFrame.current)
    setReplaying(false)
  }, [])

  const replay = React.useCallback(() => {
    const list = strokesRef.current
    cancelAnimationFrame(replayFrame.current)
    if (reduced || list.length === 0) {
      redraw(list)
      return
    }
    // Lay the strokes on one timeline, the pauses between them shortened.
    const timeline: { stroke: SignatureStroke; offsets: number[] }[] = []
    let clock = 0
    for (const s of list) {
      const t0 = s[0]?.t ?? 0
      timeline.push({ stroke: s, offsets: s.map((p) => clock + (p.t - t0)) })
      clock += (s[s.length - 1]?.t ?? t0) - t0 + 200
    }
    setReplaying(true)
    // The clock starts on the first frame; a frame's time can be earlier than the click.
    let start = -1
    const tick = (now: number) => {
      if (start < 0) start = now
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!canvas || !ctx) return
      const elapsed = now - start
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.restore()
      for (const { stroke, offsets } of timeline) {
        const shown = offsets.filter((o) => o <= elapsed).length
        if (shown === 0) break
        paint(ctx, stroke, ink, shown, shown === stroke.length)
      }
      if (elapsed < clock) replayFrame.current = requestAnimationFrame(tick)
      else setReplaying(false)
    }
    replayFrame.current = requestAnimationFrame(tick)
  }, [reduced, redraw, ink])

  React.useEffect(() => () => cancelAnimationFrame(replayFrame.current), [])

  const undo = () => {
    stopReplay()
    commit(strokesRef.current.slice(0, -1))
  }
  const clear = () => {
    stopReplay()
    commit([])
  }

  React.useImperativeHandle(
    ref,
    (): SignaturePadHandle => ({
      get canvas() {
        return canvasRef.current
      },
      clear,
      undo,
      replay,
      isEmpty: () => strokesRef.current.length === 0,
      toDataURL: exportPNG,
      toSVG: (options = {}) => {
        const canvas = canvasRef.current
        return signatureToSVG(strokesRef.current, {
          width: canvas?.clientWidth ?? 0,
          height: canvas?.clientHeight ?? 0,
          color: options.color ?? ink,
          background: options.background,
        })
      },
    }),
  )

  /* Drawing */

  const pointFrom = (e: PointerEvent | React.PointerEvent, prev?: SignaturePoint) => {
    const box = canvasRef.current?.getBoundingClientRect()
    const x = e.clientX - (box?.left ?? 0)
    const y = e.clientY - (box?.top ?? 0)
    const t = e.timeStamp || performance.now()
    let w = maxWidth
    const live = current.current
    if (e.pointerType === 'pen' && e.pressure > 0) {
      w = minWidth + (maxWidth - minWidth) * e.pressure
    } else if (prev && live) {
      // Smoothed speed in pixels per millisecond, mapped so a slow hand draws thick.
      const dt = Math.max(1, t - prev.t)
      const speed = Math.hypot(x - prev.x, y - prev.y) / dt
      live.velocity = 0.7 * speed + 0.3 * live.velocity
      w = Math.max(minWidth, maxWidth / (live.velocity * 1.5 + 1))
      // Ease the width so it never jumps between two points.
      w = prev.w * 0.6 + w * 0.4
    }
    return { x, y, t, w }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled || (e.pointerType === 'mouse' && e.button !== 0)) return
    stopReplay()
    redraw()
    e.currentTarget.setPointerCapture(e.pointerId)
    current.current = { points: [], velocity: 0 }
    const p = pointFrom(e)
    p.w = (minWidth + maxWidth) / 2
    current.current.points.push(p)
    const ctx = e.currentTarget.getContext('2d')
    if (ctx) paint(ctx, [p], ink)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const live = current.current
    if (!live) return
    const ctx = e.currentTarget.getContext('2d')
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent]
    for (const ev of events.length ? events : [e.nativeEvent]) {
      const prev = live.points[live.points.length - 1]
      const p = pointFrom(ev, prev)
      // Points closer than a pixel add noise, not shape.
      if (prev && Math.hypot(p.x - prev.x, p.y - prev.y) < 1) continue
      live.points.push(p)
      if (!ctx) continue
      // Draw just the newest curve; the whole stroke is drawn again when it ends.
      paintLatest(ctx, live.points, ink)
    }
  }

  const finish = () => {
    const live = current.current
    current.current = null
    if (!live || live.points.length === 0) return
    commit([...strokesRef.current, live.points])
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: the shortcut is a convenience, the buttons do the same
    <div
      data-slot="signature-pad"
      data-disabled={disabled ? '' : undefined}
      data-empty={strokes.length === 0 ? '' : undefined}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        if (e.defaultPrevented || disabled) return
        if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
          e.preventDefault()
          undo()
        }
      }}
      className={cn('flex w-full flex-col gap-2 data-[disabled]:opacity-50', className)}
      {...props}
    >
      <div className="relative">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`${labels.pad}, ${
            strokes.length ? labels.strokes(strokes.length) : labels.empty
          }`}
          data-slot="signature-pad-canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finish}
          onPointerCancel={finish}
          onLostPointerCapture={finish}
          className={cn(
            'block h-40 w-full cursor-crosshair touch-none rounded-lg border border-input bg-transparent text-foreground shadow-xs dark:bg-input/30',
            disabled && 'cursor-not-allowed',
            canvasClassName,
          )}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-6 bottom-8 flex items-end gap-2 border-muted-foreground/30 border-b border-dashed pb-1 text-muted-foreground/60 text-xs"
        >
          <span className="text-base leading-none">×</span>
          <span
            data-hidden={strokes.length ? '' : undefined}
            className="transition-opacity duration-(--duration-fast,150ms) data-[hidden]:opacity-0 motion-reduce:transition-none"
          >
            {labels.placeholder}
          </span>
        </div>
      </div>
      {toolbar && (
        <div data-slot="signature-pad-toolbar" className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={undo}
            disabled={disabled || strokes.length === 0}
          >
            <Undo2Icon />
            {labels.undo}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clear}
            disabled={disabled || strokes.length === 0}
          >
            <Trash2Icon />
            {labels.clear}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={replay}
            disabled={disabled || strokes.length === 0 || replaying}
            className="ml-auto"
          >
            <PlayIcon />
            {labels.replay}
          </Button>
        </div>
      )}
      {name && <input ref={hiddenRef} type="hidden" name={name} defaultValue="" />}
    </div>
  )
}

export { SignaturePad }
