'use client'

import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface PhotoStraightenLabels {
  straighten: string
  /** The angle read out. */
  degrees: (angle: string) => string
  reset: string
}

export const defaultPhotoStraightenLabels: PhotoStraightenLabels = {
  straighten: 'Straighten',
  degrees: (angle) => `${angle} degrees`,
  reset: 'Reset',
}

/** Pixels of ruler per degree. */
const PX_PER_DEG = 12

/**
 * How much a `width` by `height` photo turned by `angle` degrees has to grow to cover its own
 * box with no corners showing.
 */
export function coverScale(angle: number, width: number, height: number) {
  const a = Math.abs((angle * Math.PI) / 180)
  return Math.cos(a) + Math.sin(a) * Math.max(width / height, height / width)
}

export interface PhotoStraightenProps
  extends Omit<React.ComponentProps<'div'>, 'defaultValue' | 'onChange'> {
  src: string
  alt: string
  /** The angle in degrees, clockwise. */
  value?: number
  defaultValue?: number
  onValueChange?: (angle: number) => void
  /** The furthest it turns either way. Default 45. */
  max?: number
  labels?: Partial<PhotoStraightenLabels>
}

/**
 * Level a crooked photo on a ruler. Drag the ruler, or flick it and it coasts; the photo grows
 * just enough to hide its corners, and a grid shows while you adjust. A slider for the
 * keyboard: the arrows turn it half a degree, Page Up and Down five.
 */
function PhotoStraighten({
  src,
  alt,
  value: valueProp,
  defaultValue = 0,
  onValueChange,
  max = 45,
  labels: labelsProp,
  className,
  ...props
}: PhotoStraightenProps) {
  const labels = useLabels('photo-straighten', defaultPhotoStraightenLabels, labelsProp)
  const reduced = useReducedMotion()
  const [inner, setInner] = React.useState(defaultValue)
  const angle = valueProp ?? inner
  const [adjusting, setAdjusting] = React.useState(false)
  const [size, setSize] = React.useState({ width: 3, height: 2 })
  const drag = React.useRef<{ x: number; from: number; samples: [number, number][] } | null>(null)
  const coast = React.useRef(0)

  const set = React.useCallback(
    (next: number) => {
      const a = Math.round(Math.max(-max, Math.min(max, next)) * 10) / 10
      setInner(a)
      onValueChange?.(a)
    },
    [max, onValueChange],
  )
  React.useEffect(() => () => cancelAnimationFrame(coast.current), [])

  const fling = (from: number, speed: number) => {
    // Degrees per millisecond, slowing like a wheel on its bearing.
    let v = speed
    let a = from
    let last = performance.now()
    const tick = (now: number) => {
      const dt = now - last
      last = now
      v *= 0.94 ** (dt / 16)
      a += v * dt
      set(a)
      if (Math.abs(v) > 0.002 && Math.abs(a) < max) coast.current = requestAnimationFrame(tick)
      else setAdjusting(false)
    }
    coast.current = requestAnimationFrame(tick)
  }

  const shown = angle.toFixed(1).replace(/\.0$/, '').replace(/^-0$/, '0')
  const ticks = Array.from({ length: max * 2 + 1 }, (_, i) => i - max)

  return (
    <div
      data-slot="photo-straighten"
      className={cn('flex w-full flex-col gap-3', className)}
      {...props}
    >
      <div className="relative overflow-hidden rounded-lg bg-muted">
        <img
          src={src}
          alt={alt}
          draggable={false}
          onLoad={(e) =>
            setSize({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight })
          }
          className="block h-auto w-full select-none"
          style={{
            transform: `rotate(${angle}deg) scale(${coverScale(angle, size.width, size.height)})`,
          }}
        />
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgb(255_255_255/0.5)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.5)_1px,transparent_1px)] bg-size-[calc(100%/6)_calc(100%/4)] opacity-0 transition-opacity duration-300',
            adjusting && 'opacity-100',
          )}
        />
      </div>
      <div className="flex items-center justify-center gap-2 text-sm tabular-nums">
        <span aria-hidden="true">{shown}°</span>
        {angle !== 0 && (
          <button
            type="button"
            onClick={() => set(0)}
            className="rounded-md px-2 py-0.5 text-muted-foreground text-xs hover:bg-muted hover:text-foreground pointer-coarse:py-2"
          >
            {labels.reset}
          </button>
        )}
      </div>
      <div
        role="slider"
        tabIndex={0}
        aria-label={labels.straighten}
        aria-valuemin={-max}
        aria-valuemax={max}
        aria-valuenow={angle}
        aria-valuetext={labels.degrees(shown)}
        onKeyDown={(e) => {
          const step = {
            ArrowLeft: -0.5,
            ArrowDown: -0.5,
            ArrowRight: 0.5,
            ArrowUp: 0.5,
            PageDown: -5,
            PageUp: 5,
          }[e.key]
          if (e.key === 'Home') set(-max)
          else if (e.key === 'End') set(max)
          else if (step !== undefined) set(angle + step)
          else return
          e.preventDefault()
        }}
        onPointerDown={(e) => {
          cancelAnimationFrame(coast.current)
          e.currentTarget.setPointerCapture(e.pointerId)
          drag.current = { x: e.clientX, from: angle, samples: [[e.timeStamp, e.clientX]] }
          setAdjusting(true)
        }}
        onPointerMove={(e) => {
          const d = drag.current
          if (!d) return
          d.samples = [...d.samples.slice(-4), [e.timeStamp, e.clientX]]
          // Dragging the ruler left brings the ticks to the right under the needle.
          set(d.from - (e.clientX - d.x) / PX_PER_DEG)
        }}
        onPointerUp={(e) => {
          const d = drag.current
          drag.current = null
          const first = d?.samples[0]
          const ms = first ? e.timeStamp - first[0] : 0
          const speed = first && ms > 0 ? -(e.clientX - first[1]) / ms / PX_PER_DEG : 0
          if (!reduced && Math.abs(speed) > 0.01) fling(angle, speed)
          else setAdjusting(false)
        }}
        onPointerCancel={() => {
          drag.current = null
          setAdjusting(false)
        }}
        onDoubleClick={() => set(0)}
        className="relative h-12 cursor-grab touch-pan-y select-none overflow-hidden rounded-md outline-none [mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)] focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
      >
        <div
          aria-hidden="true"
          className="absolute top-0 left-1/2 flex h-full"
          style={{ transform: `translateX(${-(angle + max) * PX_PER_DEG}px)` }}
        >
          {ticks.map((t) => (
            <div key={t} className="relative h-full shrink-0" style={{ width: PX_PER_DEG }}>
              <span
                className={cn(
                  'absolute top-1 left-0 w-px -translate-x-1/2 bg-muted-foreground/60',
                  t % 5 === 0 ? 'h-4 bg-foreground/80' : 'h-2.5',
                )}
              />
              {t % 10 === 0 && (
                <span className="absolute bottom-1 left-0 -translate-x-1/2 text-[10px] text-muted-foreground tabular-nums">
                  {t}
                </span>
              )}
            </div>
          ))}
        </div>
        <span
          aria-hidden="true"
          className="absolute top-0 left-1/2 h-6 w-0.5 -translate-x-1/2 rounded-full bg-primary"
        />
      </div>
    </div>
  )
}

export { PhotoStraighten }
