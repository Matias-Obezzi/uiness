import { act, fireEvent, render, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Stage, Viewer } from './index'

const mockViewerController = {
  resetView: vi.fn(),
  zoom: vi.fn(),
  setView: vi.fn(),
  setAutoRotate: vi.fn(),
  setWireframe: vi.fn(),
  setBackground: vi.fn(),
  screenshot: vi.fn().mockResolvedValue(new Blob(['mock-png'], { type: 'image/png' })),
  on: vi.fn((event, handler) => {
    if (event === 'load') {
      setTimeout(() => handler({ isObject3D: true }), 0)
    }
    return vi.fn()
  }),
  dispose: vi.fn(),
}

const mockStageController = {
  THREE: {},
  scene: {},
  camera: {},
  renderer: {},
  canvas: {},
  invalidate: vi.fn(),
  onFrame: vi.fn(() => vi.fn()),
  dispose: vi.fn(),
}

vi.mock('./core', () => ({
  createViewer: vi.fn(() => mockViewerController),
  createStage: vi.fn(() => mockStageController),
}))

describe('<Viewer />', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.IntersectionObserver = class {
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
  })

  it('renders canvas with accessible role and aria-label in SSR (renderToString)', () => {
    const html = renderToString(
      <Viewer src="/models/chair.glb" alt="Lounge chair in 3D" poster="/models/chair.webp" />,
    )

    expect(html).toContain('role="img"')
    expect(html).toContain('aria-label="Lounge chair in 3D"')
    expect(html).toContain('src="/models/chair.webp"')
    expect(html).toContain('data-slot="viewer"')
  })

  it('does not load ./core until approaching the viewport', async () => {
    let intersectionCallback: ((entries: IntersectionObserverEntry[]) => void) | null = null

    window.IntersectionObserver = class {
      constructor(cb: (entries: IntersectionObserverEntry[]) => void) {
        intersectionCallback = cb
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof IntersectionObserver

    render(<Viewer src="/models/chair.glb" alt="Lounge chair" poster="/models/chair.webp" />)

    const core = await import('./core')
    expect(core.createViewer).not.toHaveBeenCalled()

    // Trigger intersection
    act(() => {
      if (intersectionCallback) {
        intersectionCallback([{ isIntersecting: true } as IntersectionObserverEntry])
      }
    })

    // Now it should initialize viewer
    await vi.waitFor(() => {
      expect(core.createViewer).toHaveBeenCalledTimes(1)
    })
  })

  it('forces autoRotate to false when reduced motion is preferred', async () => {
    // Mock reduced motion
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion: reduce'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    render(<Viewer src="/models/chair.glb" alt="Lounge chair" autoRotate={true} />)

    const core = await import('./core')
    await vi.waitFor(() => {
      expect(core.createViewer).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          autoRotate: false,
          reducedMotion: true,
        }),
      )
    })
  })

  it('handles keyboard shortcuts when viewer container is focused', async () => {
    render(<Viewer src="/models/chair.glb" alt="Lounge chair" />)

    const core = await import('./core')
    await vi.waitFor(() => {
      expect(core.createViewer).toHaveBeenCalled()
    })

    const viewer = screen.getByRole('img', { name: 'Lounge chair' }).parentElement
    expect(viewer).toBeTruthy()
    if (!viewer) return

    // Reset view (R)
    fireEvent.keyDown(viewer, { key: 'r' })
    expect(mockViewerController.resetView).toHaveBeenCalledTimes(1)

    // Zoom in (+)
    fireEvent.keyDown(viewer, { key: '+' })
    expect(mockViewerController.zoom).toHaveBeenCalledWith(1.2)

    // Zoom out (-)
    fireEvent.keyDown(viewer, { key: '-' })
    expect(mockViewerController.zoom).toHaveBeenCalledWith(0.8)

    // Presets 1-4
    fireEvent.keyDown(viewer, { key: '1' })
    expect(mockViewerController.setView).toHaveBeenCalledWith('front')

    fireEvent.keyDown(viewer, { key: '2' })
    expect(mockViewerController.setView).toHaveBeenCalledWith('right')

    fireEvent.keyDown(viewer, { key: '3' })
    expect(mockViewerController.setView).toHaveBeenCalledWith('top')

    fireEvent.keyDown(viewer, { key: '4' })
    expect(mockViewerController.setView).toHaveBeenCalledWith('iso')
  })
})

describe('<Stage />', () => {
  it('calls onSetup and cleans up on unmount', async () => {
    const onSetup = vi.fn(() => vi.fn())

    const { unmount } = render(<Stage onSetup={onSetup} />)

    const core = await import('./core')
    await vi.waitFor(() => {
      expect(core.createStage).toHaveBeenCalled()
      expect(onSetup).toHaveBeenCalled()
    })

    unmount()
    expect(mockStageController.dispose).toHaveBeenCalled()
  })
})
