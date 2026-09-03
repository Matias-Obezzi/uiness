import {
  type ComponentPropsWithoutRef,
  type CSSProperties,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { type Fit, isAnimated, renderEffects, ScratchPool, type Source, sourceSize } from './render'
import { type EffectInput, effectsKey } from './types'

export type FxStatus = 'loading' | 'ready' | 'error'

export interface FxProps extends Omit<ComponentPropsWithoutRef<'canvas'>, 'width' | 'height'> {
  /** Image URL or an already loaded image, canvas or video element. */
  src: string | Source
  /** Accessible name. The canvas gets `role="img"`. */
  alt?: string
  effects: EffectInput
  /** Display size in CSS px. Defaults to the source size scaled to the container width. */
  width?: number | string
  height?: number | string
  /**
   * Working resolution: max dimension in px. Lower is faster and chunkier.
   * 'display' (default) matches the on-screen size, 'native' uses the source size.
   */
  resolution?: number | 'display' | 'native'
  fit?: Fit
  /** Needed for cross origin images when effects read pixels. Default 'anonymous'. */
  crossOrigin?: 'anonymous' | 'use-credentials'
  /** Render continuously. Defaults to true when an effect is animated. */
  animate?: boolean
  /** Frames per second for animated renders. Default 30. */
  fps?: number
  /** Seed for noise and glitch. Default 1. */
  seed?: number
  /** Force smooth or pixelated upscaling. By default pixelated when the canvas is smaller than its box. */
  smooth?: boolean
  onStatusChange?: (status: FxStatus) => void
  /** Called after each render with the canvas. */
  onRender?: (canvas: HTMLCanvasElement) => void
}

export interface FxHandle {
  canvas: HTMLCanvasElement | null
  /** Render one frame now. */
  render: () => void
  /** PNG data URL of the current frame. */
  toDataURL: (type?: string, quality?: number) => string | undefined
}

const MAX_DISPLAY_RESOLUTION = 1600

function useSource(src: string | Source, crossOrigin: FxProps['crossOrigin']) {
  const [state, setState] = useState<{ source: Source | null; status: FxStatus }>({
    source: typeof src === 'string' ? null : src,
    status: typeof src === 'string' ? 'loading' : 'ready',
  })

  useEffect(() => {
    if (typeof src !== 'string') {
      setState({ source: src, status: 'ready' })
      return
    }
    let cancelled = false
    setState({ source: null, status: 'loading' })
    const image = new Image()
    image.crossOrigin = crossOrigin ?? 'anonymous'
    image.decoding = 'async'
    image.onload = () => {
      if (!cancelled) setState({ source: image, status: 'ready' })
    }
    image.onerror = () => {
      if (!cancelled) setState({ source: null, status: 'error' })
    }
    image.src = src
    return () => {
      cancelled = true
      image.onload = null
      image.onerror = null
    }
  }, [src, crossOrigin])

  return state
}

/**
 * Renders an image through a chain of effects on a canvas.
 *
 * @example
 * <Fx src="/photo.jpg" alt="Photo" effects={[pixelate(6), palette(palettes.gameboy)]} />
 */
export const Fx = forwardRef<FxHandle, FxProps>(function Fx(
  {
    src,
    alt = '',
    effects,
    width,
    height,
    resolution = 'display',
    fit = 'cover',
    crossOrigin,
    animate,
    fps = 30,
    seed = 1,
    smooth,
    onStatusChange,
    onRender,
    style,
    ...rest
  },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const poolRef = useRef<ScratchPool | null>(null)
  const { source, status } = useSource(src, crossOrigin)
  const key = effectsKey(effects)
  // biome-ignore lint/correctness/useExhaustiveDependencies: `key` captures the effect list identity
  const stableEffects = useMemo(() => effects, [key])
  const animated = animate ?? isAnimated(stableEffects)
  const [failed, setFailed] = useState<string | null>(null)

  const callbacks = useRef({ onStatusChange, onRender })
  callbacks.current = { onStatusChange, onRender }
  useEffect(() => {
    callbacks.current.onStatusChange?.(failed ? 'error' : status)
  }, [status, failed])

  const renderFrame = useRef<(time: number, frame: number) => void>(() => {})
  renderFrame.current = (time, frame) => {
    const canvas = canvasRef.current
    if (!canvas || !source) return
    const natural = sourceSize(source)
    const ratio = natural.width / natural.height
    let workWidth = natural.width
    if (typeof resolution === 'number') {
      workWidth = Math.min(natural.width, ratio >= 1 ? resolution : resolution * ratio)
    } else if (resolution === 'display') {
      const dpr = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1
      const displayed = (canvas.clientWidth || natural.width) * dpr
      workWidth = Math.min(natural.width, displayed, MAX_DISPLAY_RESOLUTION)
    }
    const workHeight = workWidth / ratio
    poolRef.current ??= new ScratchPool()
    try {
      renderEffects(source, stableEffects, {
        canvas,
        width: workWidth,
        height: workHeight,
        fit,
        time,
        frame,
        seed,
        scratch: poolRef.current,
      })
      if (failed) setFailed(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (!failed) {
        setFailed(message)
        console.error(
          `[@uiness/fx] Could not render effects. Pixel effects need a CORS clean image (same origin or served with Access-Control-Allow-Origin).\n${message}`,
        )
      }
      return
    }
    updateRendering(canvas)
    // Layout can still move after this effect (scrollbars, late fonts), so check once more.
    requestAnimationFrame(() => updateRendering(canvas))
    callbacks.current.onRender?.(canvas)
  }

  const updateRendering = (canvas: HTMLCanvasElement) => {
    const dpr = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1
    const pixelated = smooth === undefined ? canvas.width < canvas.clientWidth * dpr : !smooth
    canvas.style.imageRendering = pixelated ? 'pixelated' : 'auto'
  }

  // Static render, and animation loop when needed. Every render input is listed so a
  // change re-renders, even though the frame function reads them through a ref.
  // biome-ignore lint/correctness/useExhaustiveDependencies: inputs are triggers read via renderFrame
  useEffect(() => {
    if (!source) return
    if (!animated) {
      renderFrame.current(0, 0)
      return
    }
    // First frame right away, so the canvas is never blank while waiting for the loop.
    renderFrame.current(0, 0)
    let raf = 0
    let frame = 1
    let last = 0
    const start = performance.now()
    const interval = 1000 / fps
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      if (now - last < interval) return
      last = now
      renderFrame.current((now - start) / 1000, frame++)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [source, stableEffects, animated, fps, resolution, fit, seed, smooth])

  // Follow the displayed size: re-render when the resolution tracks it, and keep the
  // pixelated / smooth choice right in every case.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `smooth` changes what the observer applies
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || typeof ResizeObserver === 'undefined') return
    let lastWidth = canvas.clientWidth
    const observer = new ResizeObserver(() => {
      updateRendering(canvas)
      if (canvas.clientWidth === lastWidth) return
      lastWidth = canvas.clientWidth
      if (resolution === 'display' && !animated) renderFrame.current(0, 0)
    })
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [resolution, animated, smooth])

  useImperativeHandle(ref, () => ({
    get canvas() {
      return canvasRef.current
    },
    render: () => renderFrame.current(0, 0),
    toDataURL: (type, quality) => canvasRef.current?.toDataURL(type, quality),
  }))

  const natural = source ? sourceSize(source) : null
  const canvasStyle: CSSProperties = {
    display: 'block',
    width: width ?? '100%',
    height: height ?? 'auto',
    aspectRatio:
      height === undefined && natural ? `${natural.width} / ${natural.height}` : undefined,
    maxWidth: '100%',
    ...style,
  }

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={alt}
      data-uiness-fx=""
      data-status={failed ? 'error' : status}
      style={canvasStyle}
      {...rest}
    />
  )
})
