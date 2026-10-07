import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  cleanup()
})

if (typeof window !== 'undefined') {
  window.matchMedia ??= vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))

  window.WebGLRenderingContext ??= class {} as unknown as typeof WebGLRenderingContext
  window.WebGL2RenderingContext ??= class {} as unknown as typeof WebGL2RenderingContext

  window.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  window.IntersectionObserver ??= class {
    constructor(callback: IntersectionObserverCallback) {
      setTimeout(() => {
        callback(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver,
        )
      }, 0)
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver

  // Mock basic WebGL context in jsdom
  const originalGetContext = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = function (
    this: HTMLCanvasElement,
    contextId: string,
    ...args: unknown[]
  ) {
    if (contextId === 'webgl' || contextId === 'webgl2' || contextId === 'experimental-webgl') {
      return {} as unknown as RenderingContext
    }
    return originalGetContext
      ? (Reflect.apply(originalGetContext, this, [contextId, ...args]) as RenderingContext | null)
      : null
  } as typeof HTMLCanvasElement.prototype.getContext
}
