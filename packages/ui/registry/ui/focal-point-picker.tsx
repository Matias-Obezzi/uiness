'use client'

import * as React from 'react'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface FocalPoint {
  /** 0 at the left, 1 at the right. */
  x: number
  /** 0 at the top, 1 at the bottom. */
  y: number
}

export interface FocalPointCrop {
  /** Shown under the preview, like "16:9". */
  label: string
  /** Width over height. */
  ratio: number
}

export interface FocalPointPickerLabels {
  focalPoint: string
  /** The point read out, in whole percents. */
  position: (x: number, y: number) => string
  crops: string
}

export const defaultFocalPointPickerLabels: FocalPointPickerLabels = {
  focalPoint: 'Focal point',
  position: (x, y) => `${x}% across, ${y}% down`,
  crops: 'Crops',
}

const CROPS: FocalPointCrop[] = [
  { label: '16:9', ratio: 16 / 9 },
  { label: '1:1', ratio: 1 },
  { label: '4:5', ratio: 4 / 5 },
  { label: '9:16', ratio: 9 / 16 },
]

/**
 * The part of an image a crop of `ratio` keeps when it covers its box with the focal point as
 * its object position, as shares of the image: what `object-fit: cover` shows.
 */
export function cropRect(imageRatio: number, ratio: number, focal: FocalPoint) {
  const w = ratio < imageRatio ? ratio / imageRatio : 1
  const h = ratio < imageRatio ? 1 : imageRatio / ratio
  return { x: (1 - w) * focal.x, y: (1 - h) * focal.y, width: w, height: h }
}

const clamp = (n: number) => Math.max(0, Math.min(1, n))

export interface FocalPointPickerProps
  extends Omit<React.ComponentProps<'div'>, 'defaultValue' | 'onChange'> {
  src: string
  alt: string
  value?: FocalPoint
  /** Default the middle. */
  defaultValue?: FocalPoint
  onValueChange?: (value: FocalPoint) => void
  /** The crops to preview. Default 16:9, 1:1, 4:5 and 9:16. */
  crops?: FocalPointCrop[]
  labels?: Partial<FocalPointPickerLabels>
}

/**
 * Set where a photo's subject is and watch every crop follow it. Drag the point, or click
 * where it goes; the arrows nudge it. Hover a crop to see on the photo what it keeps.
 */
function FocalPointPicker({
  src,
  alt,
  value: valueProp,
  defaultValue = { x: 0.5, y: 0.5 },
  onValueChange,
  crops = CROPS,
  labels: labelsProp,
  className,
  ...props
}: FocalPointPickerProps) {
  const labels = useLabels('focal-point-picker', defaultFocalPointPickerLabels, labelsProp)
  const [inner, setInner] = React.useState(defaultValue)
  const value = valueProp ?? inner
  const [imageRatio, setImageRatio] = React.useState(3 / 2)
  const [hovered, setHovered] = React.useState<FocalPointCrop | null>(null)
  const frame = React.useRef<HTMLDivElement>(null)
  const dragging = React.useRef(false)

  const set = (next: FocalPoint) => {
    const point = { x: clamp(next.x), y: clamp(next.y) }
    setInner(point)
    onValueChange?.(point)
  }
  const at = (event: React.PointerEvent) => {
    const r = frame.current?.getBoundingClientRect()
    if (r) set({ x: (event.clientX - r.left) / r.width, y: (event.clientY - r.top) / r.height })
  }
  const shown = hovered && cropRect(imageRatio, hovered.ratio, value)
  const x = Math.round(value.x * 100)
  const y = Math.round(value.y * 100)

  return (
    <div
      data-slot="focal-point-picker"
      className={cn('flex w-full flex-col gap-4', className)}
      {...props}
    >
      <div
        ref={frame}
        className="relative cursor-crosshair touch-none select-none overflow-hidden rounded-lg"
        onPointerDown={(e) => {
          dragging.current = true
          e.currentTarget.setPointerCapture(e.pointerId)
          at(e)
        }}
        onPointerMove={(e) => dragging.current && at(e)}
        onPointerUp={() => {
          dragging.current = false
        }}
        onPointerCancel={() => {
          dragging.current = false
        }}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="block h-auto w-full"
          onLoad={(e) =>
            setImageRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight || 1.5)
          }
        />
        {shown && (
          // What the hovered crop keeps; the rest dims around it.
          <div
            className="pointer-events-none absolute rounded-sm shadow-[0_0_0_100vmax_rgb(0_0_0/0.55)] ring-2 ring-white transition-all duration-200"
            style={{
              left: `${shown.x * 100}%`,
              top: `${shown.y * 100}%`,
              width: `${shown.width * 100}%`,
              height: `${shown.height * 100}%`,
            }}
          />
        )}
        <div
          role="slider"
          tabIndex={0}
          aria-label={labels.focalPoint}
          aria-roledescription="2D slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={x}
          aria-valuetext={labels.position(x, y)}
          onKeyDown={(e) => {
            const step = e.shiftKey ? 0.1 : 0.02
            const move = {
              ArrowLeft: [-step, 0],
              ArrowRight: [step, 0],
              ArrowUp: [0, -step],
              ArrowDown: [0, step],
            }[e.key]
            if (!move) return
            e.preventDefault()
            set({ x: value.x + (move[0] ?? 0), y: value.y + (move[1] ?? 0) })
          }}
          className="absolute size-7 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-white bg-white/25 shadow-[0_0_0_1px_rgb(0_0_0/0.35),0_2px_8px_rgb(0_0_0/0.4)] outline-none backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:cursor-grabbing pointer-coarse:size-11"
          style={{ left: `${value.x * 100}%`, top: `${value.y * 100}%` }}
        >
          <span className="absolute inset-0 m-auto size-1.5 rounded-full bg-white" />
        </div>
      </div>
      <ul aria-label={labels.crops} className="flex items-end gap-3 overflow-x-auto pb-1">
        {crops.map((crop) => (
          <li
            key={crop.label}
            className="flex shrink-0 flex-col items-center gap-1"
            onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(crop)}
            onPointerLeave={() => setHovered(null)}
          >
            <img
              src={src}
              alt=""
              draggable={false}
              className="h-20 rounded-md object-cover"
              style={{
                aspectRatio: crop.ratio,
                objectPosition: `${value.x * 100}% ${value.y * 100}%`,
              }}
            />
            <span className="text-muted-foreground text-xs tabular-nums">{crop.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export { FocalPointPicker }
