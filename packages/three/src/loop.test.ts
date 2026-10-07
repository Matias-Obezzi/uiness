import { afterEach, describe, expect, it, vi } from 'vitest'

// jsdom has no WebGL: the stage gets a renderer that only has the parts it touches.
vi.mock('three', async (importOriginal) => {
  const three = await importOriginal<typeof import('three')>()
  class WebGLRenderer {
    domElement = document.createElement('canvas')
    shadowMap = { enabled: false, type: 0, autoUpdate: true, needsUpdate: false }
    outputColorSpace = ''
    toneMapping = 0
    setClearColor() {}
    setSize() {}
    setViewport() {}
    render() {}
    dispose() {}
    forceContextLoss() {}
  }
  return { ...three, WebGLRenderer }
})

const { createStage } = await import('./core')

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('the frame loop', () => {
  it('keeps one frame in flight when a frame callback invalidates, as moving controls do', () => {
    const queue: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => queue.push(cb))
    vi.stubGlobal('cancelAnimationFrame', () => {})

    const stage = createStage(document.createElement('canvas'))
    stage.onFrame((ctx) => {
      ctx.invalidate()
      return true
    })

    const inFlight: number[] = []
    for (let frame = 0; frame < 10; frame++) {
      inFlight.push(queue.length)
      for (const cb of queue.splice(0)) cb(performance.now())
    }
    stage.dispose()
    // It doubled every frame before: 1, 2, 4, 8...
    expect(inFlight).toEqual(Array(10).fill(1))
  })

  it('stops once nothing moves', () => {
    const queue: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => queue.push(cb))
    vi.stubGlobal('cancelAnimationFrame', () => {})

    const stage = createStage(document.createElement('canvas'))
    let moving = 3
    stage.onFrame(() => moving-- > 0)
    for (let frame = 0; frame < 10 && queue.length; frame++) {
      for (const cb of queue.splice(0)) cb(performance.now())
    }
    stage.dispose()
    expect(queue).toHaveLength(0)
  })
})
