'use client'

import * as React from 'react'
import { useInView } from '@/hooks/use-in-view'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'
import { landPoints } from '@/lib/world-map'

export interface GlobeLabels {
  /** Accessible description of the interactive globe canvas. */
  globe: string
}

export const defaultGlobeLabels: GlobeLabels = {
  globe: 'Interactive 3D globe',
}

export interface GlobeMarker {
  lat: number
  lng: number
  size?: number
  color?: string
  label?: string
}

export interface GlobeArc {
  from: [number, number]
  to: [number, number]
  color?: string
}

export interface ProjectedPoint {
  x: number
  y: number
  z: number
  visible: boolean
}

/**
 * Projects a spherical coordinate [lat, lng] to 2D screen coordinates with orthographic projection.
 *
 * @param lat Latitude in degrees (-90 to 90)
 * @param lng Longitude in degrees (-180 to 180)
 * @param yaw Rotation around vertical axis in radians
 * @param tilt Rotation around horizontal axis in radians
 * @param radius Radius of the globe in pixels
 */
export function projectPoint(
  lat: number,
  lng: number,
  yaw: number,
  tilt: number,
  radius: number,
): ProjectedPoint {
  const latRad = (lat * Math.PI) / 180
  const lngRad = (lng * Math.PI) / 180

  // Unit sphere vector: x right, y up, z forward (towards viewer at lat=0, lng=0)
  const x0 = Math.cos(latRad) * Math.sin(lngRad)
  const y0 = Math.sin(latRad)
  const z0 = Math.cos(latRad) * Math.cos(lngRad)

  // Rotate around Y axis by yaw
  const cosYaw = Math.cos(yaw)
  const sinYaw = Math.sin(yaw)
  const x1 = x0 * cosYaw + z0 * sinYaw
  const y1 = y0
  const z1 = -x0 * sinYaw + z0 * cosYaw

  // Rotate around X axis by tilt
  const cosTilt = Math.cos(tilt)
  const sinTilt = Math.sin(tilt)
  const x2 = x1
  const y2 = y1 * cosTilt - z1 * sinTilt
  const z2 = y1 * sinTilt + z1 * cosTilt

  return {
    x: x2 * radius,
    y: -y2 * radius,
    z: z2,
    visible: z2 > 0,
  }
}

// Pre-calculate unit vectors for land points to avoid trigonometry in the render loop.
const LAND_POINTS = landPoints(2, { minLat: -60, maxLat: 84 })
const LAND_VECTORS = LAND_POINTS.map(([lat, lng]) => {
  const latRad = (lat * Math.PI) / 180
  const lngRad = (lng * Math.PI) / 180
  return {
    x0: Math.cos(latRad) * Math.sin(lngRad),
    y0: Math.sin(latRad),
    z0: Math.cos(latRad) * Math.cos(lngRad),
  }
})

export interface GlobeProps extends React.ComponentProps<'div'> {
  /** Rotation speed in radians per frame. Default 0.003. */
  speed?: number
  /** Fixed vertical tilt angle in radians. Default 0.25 (tilted slightly towards viewer). */
  tilt?: number
  /** Radius of land dots in pixels. Default 1.4. */
  dotSize?: number
  /** Color of land dots. Default 'currentColor'. */
  dotColor?: string
  /** Atmosphere glow around the globe. Default true. */
  glow?: boolean
  /** Markers placed on the globe. */
  markers?: GlobeMarker[]
  /** Arcs connecting pairs of coordinates. */
  arcs?: GlobeArc[]
  /** Initial rotation [yaw, tilt] in radians. Default [0, 0.25]. */
  initialRotation?: [number, number]
  /** Whether the user can drag to rotate the globe. Default true. */
  draggable?: boolean
}

/**
 * Pure 2D canvas globe with land dots, rotation and markers. No WebGL dependencies.
 */
function Globe({
  speed = 0.003,
  tilt = 0.25,
  dotSize = 1.4,
  dotColor,
  glow = true,
  markers = [],
  arcs = [],
  initialRotation = [0, 0.25],
  draggable = true,
  className,
  ...props
}: GlobeProps) {
  const labels = useLabels('globe', defaultGlobeLabels)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const inView = useInView(containerRef)
  const prefersReduced = useReducedMotion()

  const yawRef = React.useRef(initialRotation[0])
  const tiltRef = React.useRef(tilt ?? initialRotation[1])
  const velXRef = React.useRef(0)
  const velYRef = React.useRef(0)
  const draggingRef = React.useRef(false)
  const lastPointerRef = React.useRef({ x: 0, y: 0 })
  const timeRef = React.useRef(0)

  // Keep tilt prop in sync if passed
  React.useEffect(() => {
    if (tilt !== undefined) tiltRef.current = tilt
  }, [tilt])

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let isVisible = document.visibilityState === 'visible'

    const handleVisibility = () => {
      isVisible = document.visibilityState === 'visible'
      if (isVisible) loop()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    const renderFrame = () => {
      const rect = canvas.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return

      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const targetW = Math.round(rect.width * dpr)
      const targetH = Math.round(rect.height * dpr)

      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW
        canvas.height = targetH
      }

      ctx.save()
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, rect.width, rect.height)

      const cx = rect.width / 2
      const cy = rect.height / 2
      const radius = Math.min(rect.width, rect.height) * 0.44

      // Physics / inertia
      if (!draggingRef.current) {
        if (!prefersReduced) {
          yawRef.current += speed + velXRef.current
          tiltRef.current += velYRef.current
        }
        velXRef.current *= 0.94
        velYRef.current *= 0.94
      }

      // Clamp tilt to avoid flipping upside down
      tiltRef.current = Math.max(-1.2, Math.min(1.2, tiltRef.current))

      const currentYaw = yawRef.current
      const currentTilt = tiltRef.current
      timeRef.current += 1

      // 1. Atmosphere / Glow
      if (glow) {
        const glowGrad = ctx.createRadialGradient(cx, cy, radius * 0.85, cx, cy, radius * 1.15)
        glowGrad.addColorStop(0, 'rgba(100, 150, 255, 0.08)')
        glowGrad.addColorStop(0.7, 'rgba(100, 150, 255, 0.03)')
        glowGrad.addColorStop(1, 'rgba(100, 150, 255, 0)')
        ctx.fillStyle = glowGrad
        ctx.beginPath()
        ctx.arc(cx, cy, radius * 1.15, 0, Math.PI * 2)
        ctx.fill()
      }

      // Globe sphere background (subtle shaded disk)
      const sphereGrad = ctx.createRadialGradient(
        cx - radius * 0.3,
        cy - radius * 0.3,
        radius * 0.1,
        cx,
        cy,
        radius,
      )
      sphereGrad.addColorStop(0, 'rgba(255, 255, 255, 0.04)')
      sphereGrad.addColorStop(1, 'rgba(0, 0, 0, 0.08)')
      ctx.fillStyle = sphereGrad
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.fill()

      // Resolve dot color from CSS if not provided
      const resolvedColor = dotColor || getComputedStyle(canvas).color || 'rgba(120, 120, 120, 0.8)'

      // 2. Land Points
      ctx.fillStyle = resolvedColor
      ctx.beginPath()

      const cosYaw = Math.cos(currentYaw)
      const sinYaw = Math.sin(currentYaw)
      const cosTilt = Math.cos(currentTilt)
      const sinTilt = Math.sin(currentTilt)

      for (const v of LAND_VECTORS) {
        const x1 = v.x0 * cosYaw + v.z0 * sinYaw
        const z1 = -v.x0 * sinYaw + v.z0 * cosYaw
        const x2 = x1
        const y2 = v.y0 * cosTilt - z1 * sinTilt
        const z2 = v.y0 * sinTilt + z1 * cosTilt

        // Backface culled
        if (z2 <= 0) continue

        const px = cx + x2 * radius
        const py = cy - y2 * radius

        ctx.moveTo(px + dotSize, py)
        ctx.arc(px, py, dotSize, 0, Math.PI * 2)
      }
      ctx.fill()

      // 3. Arcs
      for (const arc of arcs) {
        const [lat1, lng1] = arc.from
        const [lat2, lng2] = arc.to
        const segments = 24
        const points: { x: number; y: number; z: number }[] = []

        for (let s = 0; s <= segments; s++) {
          const t = s / segments
          // Great-circle interpolation
          const lat = lat1 + (lat2 - lat1) * t
          const lng = lng1 + (lng2 - lng1) * t
          // Arc elevation peaking at t=0.5
          const elevation = 1 + Math.sin(t * Math.PI) * 0.16
          const p = projectPoint(lat, lng, currentYaw, currentTilt, radius * elevation)
          points.push({ x: cx + p.x, y: cy + p.y, z: p.z })
        }

        // Draw visible segments
        ctx.strokeStyle = arc.color || 'rgba(59, 130, 246, 0.7)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        let drawing = false

        for (const pt of points) {
          if (pt.z > -0.1) {
            if (!drawing) {
              ctx.moveTo(pt.x, pt.y)
              drawing = true
            } else {
              ctx.lineTo(pt.x, pt.y)
            }
          } else {
            drawing = false
          }
        }
        ctx.stroke()

        // Traveling pulse particle along arc
        if (!prefersReduced && points.length > 0) {
          const travel = (timeRef.current * 0.015) % 1
          const idx = Math.floor(travel * (points.length - 1))
          const pt = points[idx]
          if (pt && pt.z > 0) {
            ctx.fillStyle = arc.color || 'rgba(147, 197, 253, 0.9)'
            ctx.beginPath()
            ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }

      // 4. Markers
      for (const marker of markers) {
        const p = projectPoint(marker.lat, marker.lng, currentYaw, currentTilt, radius)
        if (p.z <= 0) continue

        const px = cx + p.x
        const py = cy + p.y
        const mColor = marker.color || '#3b82f6'
        const mSize = marker.size || 3.5

        // Core marker
        ctx.fillStyle = mColor
        ctx.beginPath()
        ctx.arc(px, py, mSize, 0, Math.PI * 2)
        ctx.fill()

        // Pulsing ring
        if (!prefersReduced) {
          const pulse = (timeRef.current * 0.03) % 1
          const ringRadius = mSize + pulse * 7
          const ringAlpha = (1 - pulse) * 0.8
          ctx.strokeStyle = mColor
          ctx.globalAlpha = ringAlpha
          ctx.lineWidth = 1.2
          ctx.beginPath()
          ctx.arc(px, py, ringRadius, 0, Math.PI * 2)
          ctx.stroke()
          ctx.globalAlpha = 1
        }

        // Marker label
        if (marker.label) {
          ctx.fillStyle = resolvedColor
          ctx.font = '10px ui-sans-serif, system-ui, sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(marker.label, px, py - mSize - 4)
        }
      }

      ctx.restore()
    }

    const loop = () => {
      if (!inView || !isVisible) return
      renderFrame()
      if (!prefersReduced || draggingRef.current || Math.abs(velXRef.current) > 0.0001) {
        animId = requestAnimationFrame(loop)
      }
    }

    loop()

    return () => {
      cancelAnimationFrame(animId)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [inView, prefersReduced, speed, dotSize, dotColor, glow, markers, arcs])

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggable) return
    draggingRef.current = true
    lastPointerRef.current = { x: e.clientX, y: e.clientY }
    velXRef.current = 0
    velYRef.current = 0
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current) return
    const dx = e.clientX - lastPointerRef.current.x
    const dy = e.clientY - lastPointerRef.current.y
    lastPointerRef.current = { x: e.clientX, y: e.clientY }

    // The surface follows the pointer: a larger tilt moves the facing side down the screen.
    yawRef.current += dx * 0.006
    tiltRef.current += dy * 0.006
    velXRef.current = dx * 0.006
    velYRef.current = dy * 0.006
  }

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current) return
    draggingRef.current = false
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}
  }

  return (
    <div
      ref={containerRef}
      data-slot="globe"
      className={cn(
        'relative flex aspect-square w-full items-center justify-center overflow-hidden',
        className,
      )}
      {...props}
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={props['aria-label'] || labels.globe}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={cn(
          'h-full w-full select-none touch-pan-y',
          draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-default',
        )}
      />
    </div>
  )
}

export { Globe }
