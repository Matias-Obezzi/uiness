'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/** Pixels of depth the letters are extruded. */
const DEPTH = 7

/** The stacked shadows that give the letters their depth, and one soft shadow under them. */
function extrusion(depth: number) {
  const layers = Array.from(
    { length: depth },
    (_, i) => `${(i + 1) * 0.6}px ${i + 1}px 0 oklch(${0.45 - i * 0.025} 0.005 260)`,
  )
  return [...layers, `${depth}px ${depth * 2}px ${depth * 2}px rgb(0 0 0 / 0.35)`].join(', ')
}

export interface SwooshTextProps extends Omit<React.ComponentProps<'span'>, 'children'> {
  text: string
}

/**
 * Zinc letters extruded in 3D and lit by the pointer: the light on their faces follows it, and
 * each letter presses in like a keycap under it. The text reads as plain words to screen
 * readers.
 */
function SwooshText({ text, className, ...props }: SwooshTextProps) {
  const box = React.useRef<HTMLSpanElement>(null)
  const [pressed, setPressed] = React.useState<number | null>(null)
  const chars = [...text]

  return (
    <span
      ref={box}
      data-slot="swoosh-text"
      className={cn('inline-block font-black tracking-tight', className)}
      onPointerMove={(event) => {
        const r = box.current?.getBoundingClientRect()
        if (!r) return
        // The light comes from where the pointer is, as an angle across the faces.
        const angle =
          (Math.atan2(
            event.clientY - (r.top + r.height / 2),
            event.clientX - (r.left + r.width / 2),
          ) *
            180) /
          Math.PI
        box.current?.style.setProperty('--swoosh-angle', `${(angle + 90).toFixed(0)}deg`)
      }}
      onPointerLeave={() => {
        box.current?.style.removeProperty('--swoosh-angle')
        setPressed(null)
      }}
      {...props}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="inline-flex">
        {chars.map((char, i) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: letters are positional
            key={i}
            onPointerEnter={() => setPressed(i)}
            className="relative inline-block whitespace-pre transition-transform duration-(--duration-fast,150ms) motion-reduce:transition-none"
            style={{
              transform:
                pressed === i ? `translate(${DEPTH * 0.3}px, ${DEPTH * 0.5}px)` : undefined,
            }}
          >
            {/* The depth, behind the face. */}
            <span
              className="absolute inset-0 text-transparent"
              style={{ textShadow: extrusion(pressed === i ? Math.ceil(DEPTH / 2) : DEPTH) }}
            >
              {char}
            </span>
            {/* The face, a brushed metal gradient turned toward the light. */}
            <span className="relative bg-[linear-gradient(var(--swoosh-angle,160deg),oklch(0.97_0.003_260),oklch(0.78_0.008_260)_40%,oklch(0.6_0.01_260)_60%,oklch(0.9_0.005_260))] bg-clip-text text-transparent">
              {char}
            </span>
          </span>
        ))}
      </span>
    </span>
  )
}

export { SwooshText }
