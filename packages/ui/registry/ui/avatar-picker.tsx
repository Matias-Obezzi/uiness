'use client'

import { ShuffleIcon } from 'lucide-react'
import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface AvatarPickerLabels {
  name: string
  flip: string
  shuffle: string
}

export const defaultAvatarPickerLabels: AvatarPickerLabels = {
  name: 'Name',
  flip: 'Flip to the other avatar',
  shuffle: 'Shuffle',
}

export interface AvatarChoice {
  name: string
  /** Which of the name's avatars, any whole number. */
  seed: number
}

/** A small seeded random generator: the same name and seed always give the same avatar. */
export function avatarRandom(name: string, seed: number) {
  let h = 2166136261 ^ seed
  for (const ch of name.trim().toLowerCase()) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  let a = h >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

/**
 * An avatar drawn from a name: a soft mesh of colour and the initials. Its blobs glide to their
 * new places when the name changes, so it morphs as you type.
 */
function GeneratedAvatar({
  name,
  seed = 0,
  className,
  ...props
}: { name: string; seed?: number } & React.ComponentProps<'svg'>) {
  const id = React.useId()
  const random = avatarRandom(name, seed)
  const hue = Math.floor(random() * 360)
  const blobs = Array.from({ length: 3 }, (_, i) => ({
    x: 10 + random() * 44,
    y: 10 + random() * 44,
    color: `oklch(0.72 0.17 ${(hue + 50 + i * 70 + random() * 40) % 360})`,
  }))
  const transition = { transition: 'transform 0.6s cubic-bezier(0.2,0.8,0.2,1), fill 0.6s' }
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label={name}
      className={cn('size-full', className)}
      {...props}
    >
      <defs>
        <filter id={`${id}-blur`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>
      <rect width="64" height="64" style={{ fill: `oklch(0.55 0.15 ${hue})`, ...transition }} />
      <g filter={`url(#${id}-blur)`}>
        {blobs.map((b, i) => (
          <circle
            // biome-ignore lint/suspicious/noArrayIndexKey: blob n glides to its new place
            key={i}
            r="18"
            style={{ transform: `translate(${b.x}px, ${b.y}px)`, fill: b.color, ...transition }}
          />
        ))}
      </g>
      <text
        x="32"
        y="33"
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize="22"
        fontWeight="600"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        style={{ paintOrder: 'stroke', stroke: 'rgb(0 0 0 / 0.18)', strokeWidth: 2 }}
      >
        {initials(name)}
      </text>
    </svg>
  )
}

export interface AvatarPickerProps
  extends Omit<React.ComponentProps<'div'>, 'defaultValue' | 'onChange'> {
  value?: AvatarChoice
  defaultValue?: AvatarChoice
  onValueChange?: (value: AvatarChoice) => void
  labels?: Partial<AvatarPickerLabels>
}

/**
 * Pick an avatar made from a name. It sits on a coin: flick it to spin, tap to flip to the
 * other side, or shuffle for a new one. Each side is another avatar for the same name.
 */
function AvatarPicker({
  value: valueProp,
  defaultValue = { name: 'Ada Lovelace', seed: 0 },
  onValueChange,
  labels: labelsProp,
  className,
  ...props
}: AvatarPickerProps) {
  const labels = useLabels('avatar-picker', defaultAvatarPickerLabels, labelsProp)
  const reduced = useReducedMotion()
  const [inner, setInner] = React.useState(defaultValue)
  const value = valueProp ?? inner
  // The coin's turn in degrees; it rests on a multiple of 180, one avatar per half turn.
  const [angle, setAngle] = React.useState(value.seed * 180)
  const [spin, setSpin] = React.useState<'none' | 'settle' | 'shuffle'>('none')
  const drag = React.useRef<{
    x: number
    from: number
    moved: boolean
    samples: [number, number][]
  } | null>(null)
  const dragged = React.useRef(false)
  const pending = React.useRef<number | null>(null)
  const inputId = React.useId()

  const set = (next: AvatarChoice) => {
    setInner(next)
    onValueChange?.(next)
  }
  const land = (seed: number, how: 'settle' | 'shuffle') => {
    setSpin(reduced ? 'none' : how)
    setAngle(seed * 180)
    pending.current = null
    if (seed === value.seed) return
    // A single flip shows the side already waiting, and takes the new seed once it is down, so
    // no face changes in sight. A longer spin takes it at once, while the coin is a blur.
    pending.current = Math.abs(seed - value.seed) === 1 && !reduced ? seed : null
    if (pending.current === null) set({ ...value, seed })
  }
  // The side facing away always shows the next avatar, so a flip reveals a new one.
  const front = value.seed % 2 === 0 ? value.seed : value.seed + 1
  const back = value.seed % 2 === 0 ? value.seed + 1 : value.seed

  return (
    <div
      data-slot="avatar-picker"
      className={cn('flex w-64 flex-col items-center gap-5', className)}
      {...props}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={labels.flip}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            drag.current = {
              x: e.clientX,
              from: angle,
              moved: false,
              samples: [[e.timeStamp, e.clientX]],
            }
            setSpin('none')
          }}
          onPointerMove={(e) => {
            const d = drag.current
            if (!d) return
            if (Math.abs(e.clientX - d.x) > 6) d.moved = true
            d.samples = [...d.samples.slice(-4), [e.timeStamp, e.clientX]]
            setAngle(d.from + (e.clientX - d.x) * 0.9)
          }}
          onPointerUp={(e) => {
            const d = drag.current
            drag.current = null
            if (!d?.moved) return
            dragged.current = true
            const first = d.samples[0] as [number, number]
            const speed = (e.clientX - first[1]) / Math.max(16, e.timeStamp - first[0])
            // Where a flick would carry it, to the nearest side.
            land(Math.round((angle + speed * 0.9 * 260) / 180), 'settle')
          }}
          onClick={(e) => {
            // A tap, or the keyboard: flip once. A drag lands on its own.
            if (dragged.current && e.detail !== 0) {
              dragged.current = false
              return
            }
            land((pending.current ?? value.seed) + 1, 'settle')
          }}
          className="relative size-36 shrink-0 cursor-grab touch-pan-y rounded-full outline-none [perspective:600px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 active:cursor-grabbing"
        >
          <span
            className={cn(
              'absolute inset-0 rounded-full [transform-style:preserve-3d]',
              spin === 'settle' &&
                'transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
              spin === 'shuffle' &&
                'transition-transform duration-[1400ms] ease-[cubic-bezier(0.15,0.7,0.2,1)]',
            )}
            style={{ transform: `rotateY(${angle}deg)` }}
            onTransitionEnd={() => {
              if (pending.current === null) return
              set({ ...value, seed: pending.current })
              pending.current = null
            }}
          >
            {[front, back].map((seed, side) => (
              <span
                key={side ? 'back' : 'front'}
                className="absolute inset-0 overflow-hidden rounded-full shadow-[inset_0_0_0_4px_rgb(255_255_255/0.35),0_8px_24px_rgb(0_0_0/0.25)] [backface-visibility:hidden]"
                style={side ? { transform: 'rotateY(180deg)' } : undefined}
              >
                <GeneratedAvatar name={value.name} seed={seed} aria-hidden="true" />
              </span>
            ))}
          </span>
        </button>
      </div>
      <div className="flex w-full items-end gap-2">
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor={inputId} className="font-medium text-sm">
            {labels.name}
          </label>
          <input
            id={inputId}
            value={value.name}
            maxLength={40}
            autoComplete="name"
            onChange={(e) => set({ ...value, name: e.target.value })}
            className="h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:h-11"
          />
        </div>
        <button
          type="button"
          aria-label={labels.shuffle}
          onClick={() => land(value.seed + 6 + Math.floor(Math.random() * 6), 'shuffle')}
          className="flex size-9 shrink-0 items-center justify-center rounded-md border outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:size-11"
        >
          <ShuffleIcon className="size-4" />
        </button>
      </div>
    </div>
  )
}

export { AvatarPicker, GeneratedAvatar }
