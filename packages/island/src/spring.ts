export interface SpringConfig {
  /** Spring stiffness. Higher is snappier. Default 380. */
  stiffness?: number
  /** Damping. Lower values overshoot more. Default 28. */
  damping?: number
  /** Mass of the moving object. Default 1. */
  mass?: number
}

export type SpringPreset = 'smooth' | 'bouncy' | 'stiff'

export const springPresets: Record<SpringPreset, Required<SpringConfig>> = {
  smooth: { stiffness: 300, damping: 32, mass: 1 },
  bouncy: { stiffness: 420, damping: 22, mass: 1 },
  stiff: { stiffness: 700, damping: 45, mass: 1 },
}

export interface SpringEasing {
  /** CSS easing: `linear(...)` sampled from the spring, or a cubic-bezier fallback. */
  easing: string
  /** Duration in ms until the spring settles. */
  duration: number
}

export function resolveSpring(spring?: SpringConfig | SpringPreset): Required<SpringConfig> {
  if (!spring) return { stiffness: 380, damping: 28, mass: 1 }
  if (typeof spring === 'string') return springPresets[spring]
  return { stiffness: 380, damping: 28, mass: 1, ...spring }
}

let linearSupport: boolean | null = null
function supportsLinear(): boolean {
  if (linearSupport !== null) return linearSupport
  linearSupport =
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('animation-timing-function', 'linear(0, 1)')
  return linearSupport
}

const cache = new Map<string, SpringEasing>()

/**
 * Simulates a damped spring from 0 to 1 and converts the trajectory into a CSS
 * `linear()` easing so the Web Animations API can play a real spring, overshoot included.
 */
export function springEasing(config?: SpringConfig | SpringPreset): SpringEasing {
  const { stiffness, damping, mass } = resolveSpring(config)
  const key = `${stiffness}/${damping}/${mass}/${supportsLinear() ? 'l' : 'b'}`
  const cached = cache.get(key)
  if (cached) return cached

  // Semi-implicit Euler at 1ms steps until the spring rests.
  const step = 0.001
  const maxTime = 3
  const restDistance = 0.001
  const restVelocity = 0.01
  const trajectory: number[] = []
  let x = 0
  let v = 0
  let t = 0
  let restFrames = 0
  while (t < maxTime) {
    const acceleration = (-stiffness * (x - 1) - damping * v) / mass
    v += acceleration * step
    x += v * step
    t += step
    trajectory.push(x)
    if (Math.abs(x - 1) < restDistance && Math.abs(v) < restVelocity) {
      restFrames++
      if (restFrames > 16) break
    } else {
      restFrames = 0
    }
  }
  const duration = Math.max(16, Math.round(trajectory.length))

  let easing: string
  if (supportsLinear()) {
    const samples = Math.min(120, Math.max(24, Math.round(duration / 12)))
    const points: string[] = []
    for (let i = 0; i <= samples; i++) {
      const index = Math.min(
        trajectory.length - 1,
        Math.round((i / samples) * (trajectory.length - 1)),
      )
      const value = i === samples ? 1 : (trajectory[index] ?? 1)
      points.push(String(Math.round(value * 10000) / 10000))
    }
    easing = `linear(${points.join(', ')})`
  } else {
    easing = 'cubic-bezier(0.22, 1, 0.36, 1)'
  }

  const result = { easing, duration }
  cache.set(key, result)
  return result
}

/** Simulated spring position at a given time, for tests and custom renderers. */
export function springValue(config: SpringConfig | SpringPreset | undefined, time: number): number {
  const { stiffness, damping, mass } = resolveSpring(config)
  const step = 0.001
  let x = 0
  let v = 0
  for (let t = 0; t < time; t += step) {
    const acceleration = (-stiffness * (x - 1) - damping * v) / mass
    v += acceleration * step
    x += v * step
  }
  return x
}
