import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})

// Radix primitives use these in jsdom.
if (typeof window !== 'undefined') {
  window.HTMLElement.prototype.scrollIntoView ??= () => {}
  window.HTMLElement.prototype.hasPointerCapture ??= () => false
  window.HTMLElement.prototype.releasePointerCapture ??= () => {}
  window.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}
