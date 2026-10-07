import { fireEvent, render, screen } from '@testing-library/react'
import type * as React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LabelsProvider } from '@/lib/labels'
import { es } from '@/lib/labels-es'
import { ThreeViewer, ViewerToolbar } from './three-viewer'

const mockActions = {
  resetView: vi.fn(),
  zoom: vi.fn(),
  setView: vi.fn(),
  toggleAutoRotate: vi.fn(),
  toggleWireframe: vi.fn(),
  setBackground: vi.fn(),
  toggleFullscreen: vi.fn().mockResolvedValue(undefined),
  screenshot: vi.fn().mockResolvedValue(new Blob(['mock-png'], { type: 'image/png' })),
}

const mockState = {
  status: 'ready' as const,
  progress: 1,
  autoRotate: false,
  wireframe: false,
  fullscreen: false,
  view: 'iso' as const,
}

vi.mock('@uiness/three', () => ({
  Viewer: ({ children, className, ...props }: React.ComponentProps<'div'>) => (
    <div data-slot="viewer" className={className} {...props}>
      <canvas role="img" aria-label="3D model" />
      {children}
    </div>
  ),
  useViewer: () => ({
    viewer: {},
    state: mockState,
    actions: mockActions,
  }),
}))

describe('ThreeViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockState.autoRotate = false
    mockState.wireframe = false
    mockState.fullscreen = false
  })

  it('renders viewer with canvas and floating toolbar', () => {
    render(<ThreeViewer src="/models/chair.glb" alt="3D Chair" />)

    expect(screen.getByRole('toolbar', { name: '3D Viewer Controls' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Reset view' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Auto-rotate' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Camera views' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Toggle wireframe' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Toggle background' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Capture screenshot' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Toggle fullscreen' })).toBeTruthy()
  })

  it('triggers resetView when reset button is clicked', () => {
    render(<ThreeViewer src="/models/chair.glb" />)
    fireEvent.click(screen.getByRole('button', { name: 'Reset view' }))
    expect(mockActions.resetView).toHaveBeenCalledTimes(1)
  })

  it('triggers zoom in and zoom out actions', () => {
    render(<ThreeViewer src="/models/chair.glb" />)
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }))
    expect(mockActions.zoom).toHaveBeenCalledWith(1.2)

    fireEvent.click(screen.getByRole('button', { name: 'Zoom out' }))
    expect(mockActions.zoom).toHaveBeenCalledWith(0.8)
  })

  it('toggles autoRotate and wireframe modes', () => {
    render(<ThreeViewer src="/models/chair.glb" />)
    fireEvent.click(screen.getByRole('button', { name: 'Auto-rotate' }))
    expect(mockActions.toggleAutoRotate).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Toggle wireframe' }))
    expect(mockActions.toggleWireframe).toHaveBeenCalledTimes(1)
  })

  it('cycles background colors across clicks', () => {
    render(<ThreeViewer src="/models/chair.glb" />)
    const bgBtn = screen.getByRole('button', { name: 'Toggle background' })

    // First click -> light background
    fireEvent.click(bgBtn)
    expect(mockActions.setBackground).toHaveBeenCalledWith('#f8fafc')

    // Second click -> dark background
    fireEvent.click(bgBtn)
    expect(mockActions.setBackground).toHaveBeenCalledWith('#09090b')

    // Third click -> transparent (null)
    fireEvent.click(bgBtn)
    expect(mockActions.setBackground).toHaveBeenCalledWith(null)
  })

  it('triggers screenshot capture', async () => {
    render(<ThreeViewer src="/models/chair.glb" />)
    fireEvent.click(screen.getByRole('button', { name: 'Capture screenshot' }))
    expect(mockActions.screenshot).toHaveBeenCalledTimes(1)
  })

  it('triggers fullscreen toggle', () => {
    render(<ThreeViewer src="/models/chair.glb" />)
    fireEvent.click(screen.getByRole('button', { name: 'Toggle fullscreen' }))
    expect(mockActions.toggleFullscreen).toHaveBeenCalledTimes(1)
  })

  it('filters actions displayed using toolbarActions prop', () => {
    render(<ThreeViewer src="/models/chair.glb" toolbarActions={['reset', 'zoomIn', 'zoomOut']} />)

    expect(screen.getByRole('button', { name: 'Reset view' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Auto-rotate' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Toggle wireframe' })).toBeNull()
  })

  it('applies localized labels with LabelsProvider', () => {
    render(
      <LabelsProvider labels={es} locale="es">
        <ThreeViewer src="/models/chair.glb" />
      </LabelsProvider>,
    )

    expect(screen.getByRole('button', { name: 'Restablecer vista' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Acercar' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Alejar' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Rotación automática' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Alternar malla' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Cambiar fondo' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Capturar pantalla' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Pantalla completa' })).toBeTruthy()
  })

  it('can render standalone ViewerToolbar', () => {
    render(<ViewerToolbar position="top" />)
    const toolbar = screen.getByRole('toolbar')
    expect(toolbar.parentElement?.className).toContain('top-4')
  })
})
