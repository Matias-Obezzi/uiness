import { describe, expect, it, vi } from 'vitest'
import { disposeObject, fitDistance, shouldContinueLoop, zoomsOnWheel } from './core'

describe('fitDistance', () => {
  it('calculates the correct distance for a square aspect ratio', () => {
    const radius = 2
    const fov = 60
    const aspect = 1
    const margin = 1.0

    // For 60 deg, half FOV is 30 deg. sin(30 deg) = 0.5.
    // Distance should be radius / sin(30 deg) * margin = 2 / 0.5 * 1.0 = 4.
    const dist = fitDistance(radius, fov, aspect, margin)
    expect(dist).toBeCloseTo(4, 4)
  })

  it('keeps vertical framing for landscape viewports (aspect > 1)', () => {
    const radius = 2
    const fov = 60
    const margin = 1.25

    const distSquare = fitDistance(radius, fov, 1.0, margin)
    const distLandscape = fitDistance(radius, fov, 16 / 9, margin)

    // In Three.js, vertical FOV stays constant in landscape mode
    expect(distLandscape).toBeCloseTo(distSquare, 4)
  })

  it('pulls camera further back for portrait viewports (aspect < 1)', () => {
    const radius = 2
    const fov = 60
    const margin = 1.0

    const distSquare = fitDistance(radius, fov, 1.0, margin)
    const distPortrait = fitDistance(radius, fov, 0.5, margin)

    // Portrait mode narrows the horizontal FOV, so camera must back up
    expect(distPortrait).toBeGreaterThan(distSquare)
  })

  it('scales distance proportionally with margin', () => {
    const radius = 3
    const fov = 45
    const aspect = 1.5

    const distMargin1 = fitDistance(radius, fov, aspect, 1.0)
    const distMargin2 = fitDistance(radius, fov, aspect, 2.0)

    expect(distMargin2).toBeCloseTo(distMargin1 * 2, 4)
  })

  it('returns safe distance for zero or negative radius', () => {
    expect(fitDistance(0, 45, 1)).toBeGreaterThanOrEqual(1)
    expect(fitDistance(-5, 45, 1)).toBeGreaterThanOrEqual(1)
  })
})

describe('shouldContinueLoop', () => {
  it('stops loop when element is offscreen (not inView)', () => {
    expect(
      shouldContinueLoop({
        inView: false,
        isVisible: true,
        isAutoRotating: true,
        isDamping: true,
        hasActiveFrame: true,
      }),
    ).toBe(false)
  })

  it('stops loop when document is hidden (tab inactive)', () => {
    expect(
      shouldContinueLoop({
        inView: true,
        isVisible: false,
        isAutoRotating: true,
        isDamping: true,
        hasActiveFrame: true,
      }),
    ).toBe(false)
  })

  it('continues loop while auto-rotating in view', () => {
    expect(
      shouldContinueLoop({
        inView: true,
        isVisible: true,
        isAutoRotating: true,
      }),
    ).toBe(true)
  })

  it('continues loop while control damping is active', () => {
    expect(
      shouldContinueLoop({
        inView: true,
        isVisible: true,
        isDamping: true,
      }),
    ).toBe(true)
  })

  it('continues loop when an onFrame callback requests continuous frames', () => {
    expect(
      shouldContinueLoop({
        inView: true,
        isVisible: true,
        hasActiveFrame: true,
      }),
    ).toBe(true)
  })

  it('pauses loop when nothing is actively animating', () => {
    expect(
      shouldContinueLoop({
        inView: true,
        isVisible: true,
        isAutoRotating: false,
        isDamping: false,
        hasActiveFrame: false,
      }),
    ).toBe(false)
  })
})

describe('disposeObject', () => {
  it('disposes geometries, materials, and textures across node hierarchies', () => {
    const geo1Dispose = vi.fn()
    const geo2Dispose = vi.fn()
    const map1Dispose = vi.fn()
    const normalMapDispose = vi.fn()
    const mat1Dispose = vi.fn()
    const mat2Dispose = vi.fn()
    const mat3Dispose = vi.fn()

    const mockRoot = {
      traverse: (cb: (node: unknown) => void) => {
        // Root node
        cb(mockRoot)
        // Child 1 with single material and textures
        cb({
          geometry: { dispose: geo1Dispose },
          material: {
            dispose: mat1Dispose,
            map: { dispose: map1Dispose },
            normalMap: { dispose: normalMapDispose },
          },
        })
        // Child 2 with array of materials
        cb({
          geometry: { dispose: geo2Dispose },
          material: [{ dispose: mat2Dispose }, { dispose: mat3Dispose }],
        })
      },
    } as unknown as import('three').Object3D

    disposeObject(mockRoot)

    expect(geo1Dispose).toHaveBeenCalledTimes(1)
    expect(geo2Dispose).toHaveBeenCalledTimes(1)
    expect(map1Dispose).toHaveBeenCalledTimes(1)
    expect(normalMapDispose).toHaveBeenCalledTimes(1)
    expect(mat1Dispose).toHaveBeenCalledTimes(1)
    expect(mat2Dispose).toHaveBeenCalledTimes(1)
    expect(mat3Dispose).toHaveBeenCalledTimes(1)
  })

  it('safely handles null, undefined, or empty objects without errors', () => {
    expect(() => disposeObject(null as unknown as import('three').Object3D)).not.toThrow()
    expect(() =>
      disposeObject({ traverse: () => {} } as unknown as import('three').Object3D),
    ).not.toThrow()
  })
})

describe('zoomsOnWheel', () => {
  const plain = { ctrlKey: false, metaKey: false }
  it('leaves a plain wheel to the page unless told to always zoom', () => {
    expect(zoomsOnWheel('modifier', plain)).toBe(false)
    expect(zoomsOnWheel('never', plain)).toBe(false)
    expect(zoomsOnWheel('always', plain)).toBe(true)
  })

  it('zooms with Ctrl, ⌘ or a pinch, which arrives with Ctrl', () => {
    expect(zoomsOnWheel('modifier', { ctrlKey: true, metaKey: false })).toBe(true)
    expect(zoomsOnWheel('modifier', { ctrlKey: false, metaKey: true })).toBe(true)
    expect(zoomsOnWheel('never', { ctrlKey: true, metaKey: false })).toBe(false)
  })
})
