'use client'

import { PipetteIcon, PlusIcon } from 'lucide-react'
import { Slider as SliderPrimitive } from 'radix-ui'
import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover'

/* -------------------------------------------------------------------------------------------------
 * Color math. sRGB in, sRGB out, with OKLCH through OKLab. No library.
 * -----------------------------------------------------------------------------------------------*/

/** Channels 0 to 255, alpha 0 to 1. */
export interface RGBA {
  r: number
  g: number
  b: number
  a: number
}

/** Hue 0 to 360, saturation and value 0 to 1, alpha 0 to 1. */
interface HSVA {
  h: number
  s: number
  v: number
  a: number
}

export type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'oklch'

const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n))
const round = (n: number, digits = 0) => {
  const f = 10 ** digits
  return Math.round(n * f) / f
}

function parseNumber(token: string | undefined, percentOf: number): number | null {
  if (token === undefined) return null
  const n = Number.parseFloat(token)
  if (Number.isNaN(n)) return null
  return token.trim().endsWith('%') ? (n / 100) * percentOf : n
}

function parseHue(token: string | undefined): number | null {
  if (token === undefined) return null
  const n = Number.parseFloat(token)
  if (Number.isNaN(n)) return null
  if (token.endsWith('turn')) return n * 360
  if (token.endsWith('rad')) return (n * 180) / Math.PI
  return n
}

/** The format a color string is written in, or null when it is not one we read. */
export function detectColorFormat(input: string): ColorFormat | null {
  const s = input.trim().toLowerCase()
  if (/^#?[0-9a-f]{3,8}$/.test(s)) return 'hex'
  if (s.startsWith('rgb')) return 'rgb'
  if (s.startsWith('hsl')) return 'hsl'
  if (s.startsWith('oklch')) return 'oklch'
  return null
}

/** Read hex (3, 4, 6 or 8 digits), rgb(), hsl() or oklch(), in modern or legacy syntax. */
export function parseColor(input: string): RGBA | null {
  const s = input.trim().toLowerCase()
  const hex = s.match(/^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/)
  if (hex?.[1]) {
    let h = hex[1]
    if (h.length <= 4) h = [...h].map((c) => c + c).join('')
    const n = (i: number) => Number.parseInt(h.slice(i, i + 2), 16)
    return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? round(n(6) / 255, 3) : 1 }
  }
  const fn = s.match(/^(rgba?|hsla?|oklch)\(([^)]*)\)$/)
  if (!fn?.[1] || fn[2] === undefined) return null
  const args = fn[2].split(/[\s,/]+/).filter(Boolean)
  if (args.length < 3 || args.length > 4) return null
  const alpha = args[3] === undefined ? 1 : parseNumber(args[3], 1)
  if (alpha === null) return null
  const a = clamp(alpha)

  if (fn[1].startsWith('rgb')) {
    const [r, g, b] = args.slice(0, 3).map((t) => parseNumber(t, 255))
    if (r == null || g == null || b == null) return null
    return { r: clamp(r, 0, 255), g: clamp(g, 0, 255), b: clamp(b, 0, 255), a }
  }
  if (fn[1].startsWith('hsl')) {
    const h = parseHue(args[0])
    const sat = parseNumber(args[1], 1)
    const l = parseNumber(args[2], 1)
    if (h === null || sat === null || l === null) return null
    // Unitless saturation and lightness are percentages in hsl().
    const norm = (n: number, t?: string) => (t?.endsWith('%') ? n : n / 100)
    return { ...hslToRgb(h, clamp(norm(sat, args[1])), clamp(norm(l, args[2]))), a }
  }
  const l = parseNumber(args[0], 1)
  const c = parseNumber(args[1], 0.4)
  const h = parseHue(args[2])
  if (l === null || c === null || h === null) return null
  return { ...oklchToRgb(clamp(l), Math.max(0, c), h), a }
}

function hslToRgb(h: number, s: number, l: number) {
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
  return { r: f(0) * 255, g: f(8) * 255, b: f(4) * 255 }
}

function rgbToHsl({ r, g, b }: RGBA) {
  const [rr, gg, bb] = [r / 255, g / 255, b / 255]
  const max = Math.max(rr, gg, bb)
  const min = Math.min(rr, gg, bb)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return { h: 0, s: 0, l }
  const s = d / (1 - Math.abs(2 * l - 1))
  let h = max === rr ? ((gg - bb) / d) % 6 : max === gg ? (bb - rr) / d + 2 : (rr - gg) / d + 4
  h *= 60
  if (h < 0) h += 360
  return { h, s, l }
}

function hsvToRgb({ h, s, v, a }: HSVA): RGBA {
  const f = (n: number) => {
    const k = (n + h / 60) % 6
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1))
  }
  return { r: f(5) * 255, g: f(3) * 255, b: f(1) * 255, a }
}

function rgbToHsv({ r, g, b, a }: RGBA): HSVA {
  const [rr, gg, bb] = [r / 255, g / 255, b / 255]
  const max = Math.max(rr, gg, bb)
  const d = max - Math.min(rr, gg, bb)
  let h = 0
  if (d !== 0) {
    if (max === rr) h = ((gg - bb) / d) % 6
    else if (max === gg) h = (bb - rr) / d + 2
    else h = (rr - gg) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: max === 0 ? 0 : d / max, v: max, a }
}

const toLinear = (c: number) => {
  const x = c / 255
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
}
const fromLinear = (x: number) =>
  clamp(x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055) * 255

function rgbToOklch({ r, g, b }: RGBA) {
  const [lr, lg, lb] = [toLinear(r), toLinear(g), toLinear(b)]
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  const C = Math.sqrt(A * A + B * B)
  let H = (Math.atan2(B, A) * 180) / Math.PI
  if (H < 0) H += 360
  return { l: L, c: C, h: C < 1e-4 ? 0 : H }
}

/** Out of gamut colors are clipped per channel, which is what a browser does too. */
function oklchToRgb(L: number, C: number, H: number) {
  const hr = (H * Math.PI) / 180
  const A = C * Math.cos(hr)
  const B = C * Math.sin(hr)
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3
  return {
    r: fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  }
}

/** Write a color in one of the four formats. Alpha is only written when it is below 1. */
export function formatColor(color: RGBA, format: ColorFormat): string {
  const a = round(color.a, 2)
  const slash = a < 1 ? ` / ${a}` : ''
  switch (format) {
    case 'hex': {
      const h = (n: number) =>
        Math.round(clamp(n, 0, 255))
          .toString(16)
          .padStart(2, '0')
      return `#${h(color.r)}${h(color.g)}${h(color.b)}${a < 1 ? h(a * 255) : ''}`
    }
    case 'rgb':
      return `rgb(${Math.round(color.r)} ${Math.round(color.g)} ${Math.round(color.b)}${slash})`
    case 'hsl': {
      const { h, s, l } = rgbToHsl(color)
      return `hsl(${round(h)} ${round(s * 100)}% ${round(l * 100)}%${slash})`
    }
    case 'oklch': {
      const { l, c, h } = rgbToOklch(color)
      return `oklch(${round(l, 3)} ${round(c, 3)} ${round(h, 2)}${slash})`
    }
  }
}

/** WCAG relative luminance. */
function luminance({ r, g, b }: RGBA) {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

/**
 * WCAG 2 contrast ratio between two colors, 1 to 21. A see-through foreground is first
 * laid over the background, which is what the eye ends up comparing.
 */
export function contrastRatio(foreground: RGBA, background: RGBA): number {
  const a = foreground.a
  const over = {
    r: foreground.r * a + background.r * (1 - a),
    g: foreground.g * a + background.g * (1 - a),
    b: foreground.b * a + background.b * (1 - a),
    a: 1,
  }
  const l1 = luminance(over)
  const l2 = luminance(background)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

/* -------------------------------------------------------------------------------------------------
 * Props
 * -----------------------------------------------------------------------------------------------*/

export interface ColorPickerLabels {
  area: string
  hue: string
  alpha: string
  format: string
  input: string
  eyeDropper: string
  swatches: string
  addSwatch: string
  contrast: string
}

const DEFAULT_LABELS: ColorPickerLabels = {
  area: 'Saturation and brightness',
  hue: 'Hue',
  alpha: 'Opacity',
  format: 'Color format',
  input: 'Color value',
  eyeDropper: 'Pick a color from the screen',
  swatches: 'Saved colors',
  addSwatch: 'Save this color',
  contrast: 'Contrast',
}

const FORMATS: ColorFormat[] = ['hex', 'rgb', 'hsl', 'oklch']

// Drawn under anything see-through so its opacity is visible.
const CHECKER = 'repeating-conic-gradient(#d4d4d4 0% 25%, #fafafa 0% 50%) 50% / 8px 8px'

export interface ColorPickerProps
  extends Omit<React.ComponentProps<'button'>, 'value' | 'defaultValue' | 'onChange' | 'children'> {
  /** The color as a hex, rgb(), hsl() or oklch() string. Controlled. */
  value?: string
  /** The starting color when uncontrolled. Default black. */
  defaultValue?: string
  /** Called with the color written in the current format. */
  onValueChange?: (value: string) => void
  /** The format the value is written in. Controlled. */
  format?: ColorFormat
  /** The starting format. Default the format of the starting value, or hex. */
  defaultFormat?: ColorFormat
  onFormatChange?: (format: ColorFormat) => void
  /** Show the opacity slider and write alpha. Default true. */
  alpha?: boolean
  /** Saved colors shown under the picker. Controlled. */
  swatches?: string[]
  /** The starting saved colors when uncontrolled. */
  defaultSwatches?: string[]
  /** Called when a color is saved with the plus button or removed with Delete. */
  onSwatchesChange?: (swatches: string[]) => void
  /** A background to check against. Shows the WCAG contrast ratio and whether it passes AA and AAA. */
  contrastWith?: string
  /** Show the value next to the swatch in the button. Default true. */
  showValue?: boolean
  /** With a name, a hidden input carries the value in a form. */
  name?: string
  /** Accessible names, for other languages. */
  labels?: Partial<ColorPickerLabels>
  /** Classes for the popover panel. */
  contentClassName?: string
}

/* -------------------------------------------------------------------------------------------------
 * ColorPicker
 * -----------------------------------------------------------------------------------------------*/

/**
 * A swatch that opens a picker: a saturation and brightness area, hue and opacity sliders,
 * a text field in hex, rgb, hsl or oklch, the system eye dropper where there is one, saved
 * colors and a contrast check. Every part works from the keyboard.
 */
function ColorPicker({
  value: valueProp,
  defaultValue = '#000000',
  onValueChange,
  format: formatProp,
  defaultFormat,
  onFormatChange,
  alpha = true,
  swatches: swatchesProp,
  defaultSwatches = [],
  onSwatchesChange,
  contrastWith,
  showValue = true,
  name,
  labels: labelsProp,
  className,
  contentClassName,
  disabled,
  ...props
}: ColorPickerProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp }
  const initial = valueProp ?? defaultValue

  const [formatState, setFormatState] = React.useState<ColorFormat>(
    () => defaultFormat ?? detectColorFormat(initial) ?? 'hex',
  )
  const format = formatProp ?? formatState

  // HSV is the state, not the string: a grey has no hue in any string format, and dragging
  // through one should not snap the hue slider back to red.
  const [hsva, setHsva] = React.useState<HSVA>(() =>
    rgbToHsv(parseColor(initial) ?? { r: 0, g: 0, b: 0, a: 1 }),
  )
  const rgba = hsvToRgb(hsva)
  const value = formatColor(alpha ? rgba : { ...rgba, a: 1 }, format)

  // An outside change to a controlled value moves the picker. Our own echo does not.
  const [seen, setSeen] = React.useState(valueProp)
  if (valueProp !== undefined && valueProp !== seen) {
    setSeen(valueProp)
    const parsed = parseColor(valueProp)
    if (parsed && valueProp !== value) {
      const next = rgbToHsv(parsed)
      setHsva(next.s === 0 || next.v === 0 ? { ...next, h: hsva.h } : next)
    }
  }

  const emit = (next: HSVA, nextFormat = format) => {
    const c = hsvToRgb(next)
    const str = formatColor(alpha ? c : { ...c, a: 1 }, nextFormat)
    if (str === value && nextFormat === format) return
    if (valueProp !== undefined) setSeen(str)
    onValueChange?.(str)
  }

  const update = (patch: Partial<HSVA>) => {
    const next = { ...hsva, ...patch }
    setHsva(next)
    emit(next)
  }

  const setFromRgba = (c: RGBA) => {
    const next = rgbToHsv(c)
    update(next.s === 0 || next.v === 0 ? { ...next, h: hsva.h } : next)
  }

  const changeFormat = (next: ColorFormat) => {
    if (formatProp === undefined) setFormatState(next)
    onFormatChange?.(next)
    emit(hsva, next)
  }

  const [savedState, setSavedState] = React.useState(defaultSwatches)
  const saved = swatchesProp ?? savedState
  const setSaved = (next: string[]) => {
    if (swatchesProp === undefined) setSavedState(next)
    onSwatchesChange?.(next)
  }

  const [dropper, setDropper] = React.useState(false)
  React.useEffect(() => setDropper(typeof window !== 'undefined' && 'EyeDropper' in window), [])

  const pickFromScreen = async () => {
    const Ctor = (
      window as unknown as { EyeDropper?: new () => { open(): Promise<{ sRGBHex: string }> } }
    ).EyeDropper
    if (!Ctor) return
    try {
      const { sRGBHex } = await new Ctor().open()
      const parsed = parseColor(sRGBHex)
      if (parsed) setFromRgba({ ...parsed, a: hsva.a })
    } catch {
      // Escape closes the dropper with a rejection, which is not an error.
    }
  }

  const opaque = formatColor({ ...rgba, a: 1 }, 'hex')
  const swatchesId = React.useId()

  return (
    <Popover>
      {name && <input type="hidden" name={name} value={value} />}
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'justify-start gap-2 px-2 font-normal',
            !showValue && 'size-9 justify-center px-0',
            className,
          )}
          {...props}
          data-slot="color-picker-trigger"
        >
          <span
            aria-hidden
            className="relative size-5 shrink-0 overflow-hidden rounded-sm ring-1 ring-foreground/15 ring-inset"
            style={{ background: CHECKER }}
          >
            <span
              className="absolute inset-0 rounded-[inherit] ring-1 ring-foreground/15 ring-inset"
              style={{ background: value }}
            />
          </span>
          {showValue ? (
            <span className="truncate font-mono text-xs">{value}</span>
          ) : (
            <span className="sr-only">{value}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        data-slot="color-picker-content"
        className={cn('flex w-64 flex-col gap-3 p-3 motion-reduce:animate-none', contentClassName)}
      >
        <SaturationArea hsva={hsva} onChange={update} label={labels.area} />

        <div className="flex items-center gap-3">
          <div className="flex flex-1 flex-col gap-3">
            <ColorSlider
              label={labels.hue}
              value={hsva.h}
              max={360}
              onChange={(h) => update({ h })}
              track="linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)"
              thumb={`hsl(${hsva.h} 100% 50%)`}
              valueText={`${Math.round(hsva.h)}°`}
            />
            {alpha && (
              <ColorSlider
                label={labels.alpha}
                value={Math.round(hsva.a * 100)}
                max={100}
                onChange={(a) => update({ a: a / 100 })}
                track={`linear-gradient(to right, transparent, ${opaque}), ${CHECKER}`}
                thumb={value}
                valueText={`${Math.round(hsva.a * 100)}%`}
              />
            )}
          </div>
          {dropper && (
            <Button
              variant="outline"
              size="icon"
              aria-label={labels.eyeDropper}
              onClick={pickFromScreen}
              className="size-8"
            >
              <PipetteIcon />
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {/* biome-ignore lint/a11y/useSemanticElements: a fieldset would bring its own box model */}
          <div role="group" aria-label={labels.format} className="flex rounded-md bg-muted p-0.5">
            {FORMATS.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={f === format}
                onClick={() => changeFormat(f)}
                className="flex-1 rounded-sm px-1.5 py-1 font-medium text-muted-foreground text-xs uppercase outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-xs"
              >
                {f}
              </button>
            ))}
          </div>
          <ColorText value={value} label={labels.input} onCommit={setFromRgba} alpha={alpha} />
        </div>

        <div className="flex flex-col gap-2">
          <div id={swatchesId} className="font-medium text-muted-foreground text-xs">
            {labels.swatches}
          </div>
          {/* biome-ignore lint/a11y/useSemanticElements: a fieldset would bring its own box model */}
          <div role="group" aria-labelledby={swatchesId} className="flex flex-wrap gap-1.5">
            {saved.map((swatch) => (
              <button
                key={swatch}
                type="button"
                aria-label={swatch}
                title={swatch}
                data-slot="color-picker-swatch"
                onClick={() => {
                  const parsed = parseColor(swatch)
                  if (parsed) setFromRgba(parsed)
                }}
                onKeyDown={(e) => {
                  if (e.key !== 'Delete' && e.key !== 'Backspace') return
                  e.preventDefault()
                  const index = saved.indexOf(swatch)
                  const buttons = Array.from(
                    e.currentTarget.parentElement?.querySelectorAll('button') ?? [],
                  )
                  setSaved(saved.filter((s) => s !== swatch))
                  // Keep focus in the row, on the swatch that slid into this place.
                  ;(buttons[index + 1] ?? buttons[index - 1])?.focus()
                }}
                className="relative size-6 overflow-hidden rounded-md ring-1 ring-foreground/15 ring-inset outline-none transition-transform hover:scale-110 focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none motion-reduce:hover:scale-100"
                style={{ background: CHECKER }}
              >
                <span
                  className="absolute inset-0 rounded-[inherit] ring-1 ring-foreground/15 ring-inset"
                  style={{ background: swatch }}
                />
              </button>
            ))}
            <button
              type="button"
              aria-label={labels.addSwatch}
              title={labels.addSwatch}
              disabled={saved.includes(value)}
              onClick={() => setSaved([...saved, value])}
              className="inline-flex size-6 items-center justify-center rounded-md border border-dashed text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-40 [&_svg]:size-3.5"
            >
              <PlusIcon />
            </button>
          </div>
        </div>

        {contrastWith && (
          <ContrastReadout color={rgba} against={contrastWith} label={labels.contrast} />
        )}
      </PopoverContent>
    </Popover>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Parts
 * -----------------------------------------------------------------------------------------------*/

function SaturationArea({
  hsva,
  onChange,
  label,
}: {
  hsva: HSVA
  onChange: (patch: Partial<HSVA>) => void
  label: string
}) {
  const ref = React.useRef<HTMLDivElement>(null)

  const fromPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const box = ref.current?.getBoundingClientRect()
    if (!box || box.width === 0 || box.height === 0) return
    onChange({
      s: clamp((e.clientX - box.left) / box.width),
      v: clamp(1 - (e.clientY - box.top) / box.height),
    })
  }

  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 0.1 : 0.01
    const moves: Record<string, Partial<HSVA>> = {
      ArrowLeft: { s: clamp(hsva.s - step) },
      ArrowRight: { s: clamp(hsva.s + step) },
      ArrowUp: { v: clamp(hsva.v + step) },
      ArrowDown: { v: clamp(hsva.v - step) },
      PageUp: { v: clamp(hsva.v + 0.1) },
      PageDown: { v: clamp(hsva.v - 0.1) },
      Home: { s: 0 },
      End: { s: 1 },
    }
    const patch = moves[e.key]
    if (!patch) return
    e.preventDefault()
    onChange(patch)
  }

  const s = Math.round(hsva.s * 100)
  const v = Math.round(hsva.v * 100)

  return (
    <div
      ref={ref}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-roledescription="2D slider"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={s}
      aria-valuetext={`Saturation ${s}%, brightness ${v}%`}
      data-slot="color-picker-area"
      onKeyDown={handleKey}
      onPointerDown={(e) => {
        if (e.button !== 0) return
        e.currentTarget.setPointerCapture(e.pointerId)
        e.currentTarget.focus()
        fromPointer(e)
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) fromPointer(e)
      }}
      className="relative h-36 w-full shrink-0 cursor-crosshair touch-none rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      style={{
        background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent), hsl(${hsva.h} 100% 50%)`,
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/0.3),0_1px_3px_rgb(0_0_0/0.3)]"
        style={{
          left: `${hsva.s * 100}%`,
          top: `${(1 - hsva.v) * 100}%`,
          background: formatColor({ ...hsvToRgb(hsva), a: 1 }, 'hex'),
        }}
      />
    </div>
  )
}

function ColorSlider({
  label,
  value,
  max,
  onChange,
  track,
  thumb,
  valueText,
}: {
  label: string
  value: number
  max: number
  onChange: (value: number) => void
  track: string
  thumb: string
  valueText: string
}) {
  return (
    <SliderPrimitive.Root
      value={[value]}
      max={max}
      step={1}
      onValueChange={([v]) => v !== undefined && onChange(v)}
      className="relative flex h-4 w-full touch-none select-none items-center"
    >
      <SliderPrimitive.Track
        className="relative h-3 w-full grow overflow-hidden rounded-full ring-1 ring-foreground/15 ring-inset"
        style={{ background: track }}
      />
      <SliderPrimitive.Thumb
        aria-label={label}
        aria-valuetext={valueText}
        className="relative block size-4 overflow-hidden rounded-full border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/0.3),0_1px_3px_rgb(0_0_0/0.3)] outline-none transition-shadow focus-visible:ring-[3px] focus-visible:ring-ring/50"
        style={{ background: CHECKER }}
      >
        <span className="absolute inset-0" style={{ background: thumb }} />
      </SliderPrimitive.Thumb>
    </SliderPrimitive.Root>
  )
}

function ColorText({
  value,
  label,
  onCommit,
  alpha,
}: {
  value: string
  label: string
  onCommit: (color: RGBA) => void
  alpha: boolean
}) {
  const [draft, setDraft] = React.useState<string | null>(null)
  const text = draft ?? value
  const invalid = draft !== null && parseColor(draft) === null

  return (
    <input
      aria-label={label}
      aria-invalid={invalid || undefined}
      data-slot="color-picker-input"
      spellCheck={false}
      autoComplete="off"
      autoCapitalize="off"
      value={text}
      onChange={(e) => {
        setDraft(e.target.value)
        // Apply as soon as it reads as a color, without rewriting what is being typed.
        const parsed = parseColor(e.target.value)
        if (parsed) onCommit(alpha ? parsed : { ...parsed, a: 1 })
      }}
      onBlur={() => setDraft(null)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          setDraft(null)
        }
      }}
      className="h-8 w-full min-w-0 rounded-md border border-input bg-transparent px-2 font-mono text-xs shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30"
    />
  )
}

function ContrastReadout({
  color,
  against,
  label,
}: {
  color: RGBA
  against: string
  label: string
}) {
  const bg = parseColor(against)
  if (!bg) return null
  const ratio = contrastRatio(color, { ...bg, a: 1 })
  const checks = [
    { name: 'AA', pass: ratio >= 4.5 },
    { name: 'AAA', pass: ratio >= 7 },
    { name: 'AA Large', pass: ratio >= 3 },
  ]
  return (
    <div data-slot="color-picker-contrast" className="flex items-center gap-2 border-t pt-3">
      <span
        aria-hidden
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-md font-semibold text-sm ring-1 ring-foreground/15 ring-inset"
        style={{ background: against, color: formatColor(color, 'rgb') }}
      >
        Aa
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="text-muted-foreground text-xs">{label}</span>
        <span className="font-medium text-sm tabular-nums">{ratio.toFixed(2)}:1</span>
      </div>
      <ul className="ml-auto flex flex-wrap justify-end gap-1">
        {checks.map((c) => (
          <li
            key={c.name}
            data-pass={c.pass ? '' : undefined}
            className="rounded-sm bg-muted px-1.5 py-0.5 font-medium text-[0.65rem] text-muted-foreground line-through data-[pass]:bg-primary data-[pass]:text-primary-foreground data-[pass]:no-underline"
          >
            <span className="sr-only">{c.pass ? 'Passes ' : 'Fails '}</span>
            {c.name}
          </li>
        ))}
      </ul>
    </div>
  )
}

export { ColorPicker }
