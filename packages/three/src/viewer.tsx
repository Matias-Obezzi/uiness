'use client'

import * as React from 'react'
import type * as THREE from 'three'
import type {
  StageContext as CoreStageContext,
  LoopState,
  StageController,
  StageOptions,
  ViewerController,
  ViewerOptions,
  ViewPreset,
} from './core'

export type {
  LoopState,
  StageController,
  StageOptions,
  ViewerController,
  ViewerOptions,
  ViewPreset,
}

/** What `<Stage>` hands its callbacks: the stage, plus three itself so scenes need no import of it. */
export type StageContext = CoreStageContext & { THREE: typeof THREE }

export type ViewerStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface ViewerState {
  status: ViewerStatus
  progress: number
  autoRotate: boolean
  wireframe: boolean
  fullscreen: boolean
  view: ViewPreset
}

export interface ViewerActions {
  resetView: () => void
  zoom: (factor: number) => void
  setView: (preset: ViewPreset) => void
  toggleAutoRotate: () => void
  toggleWireframe: () => void
  setBackground: (color: string | number | null) => void
  toggleFullscreen: () => Promise<void>
  screenshot: (options?: { scale?: number; type?: string }) => Promise<Blob | null>
}

export interface ViewerContextValue {
  viewer: ViewerController | null
  state: ViewerState
  actions: ViewerActions
}

const ViewerContext = React.createContext<ViewerContextValue | null>(null)

export function useViewer(): ViewerContextValue {
  const context = React.useContext(ViewerContext)
  if (!context) {
    throw new Error('useViewer must be used within a <Viewer /> component')
  }
  return context
}

export interface ViewerProps
  extends Omit<React.ComponentProps<'div'>, 'onError' | 'onProgress' | 'onLoad'> {
  /** URL of the 3D model (.glb) or a pre-assembled Object3D. */
  src?: string | THREE.Object3D
  /** Accessible text for the canvas image representation. */
  alt?: string
  /** Poster image URL displayed before the 3D asset is loaded. */
  poster?: string
  /** Whether the model continually rotates around its vertical axis. Default false. */
  autoRotate?: boolean
  /** Environment lighting: 'room' (default, procedural), 'none', or a custom Texture. */
  environment?: 'room' | 'none' | THREE.Texture
  /** Whether directional light and contact shadow plane are active. Default true. */
  shadows?: boolean
  /** Maximum device pixel ratio cap to conserve GPU battery. Default 2. */
  maxDpr?: number
  /** Optional directory path containing Draco decoders. */
  dracoPath?: string
  /** Callback fired when the 3D model has fully loaded. */
  onLoad?: (model: THREE.Object3D) => void
  /** Callback fired if asset loading or WebGL initialization fails. */
  onError?: (error: Error) => void
  /** Real-time progress callback from 0 to 1 during asset download. */
  onProgress?: (progress: number) => void
  /** Fallback content rendered if WebGL is unavailable or loading fails. */
  fallback?: React.ReactNode
}

/**
 * Headless 3D model viewer. Defers loading Three.js until approaching the viewport,
 * renders on demand, and provides camera, lighting, and shadow management.
 */
export function Viewer({
  src,
  alt = '3D model',
  poster,
  autoRotate = false,
  environment = 'room',
  shadows = true,
  maxDpr = 2,
  dracoPath,
  onLoad,
  onError,
  onProgress,
  fallback,
  className,
  children,
  ...props
}: ViewerProps) {
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const viewerRef = React.useRef<ViewerController | null>(null)

  const [status, setStatus] = React.useState<ViewerStatus>('idle')
  const [progress, setProgress] = React.useState(0)
  const [isRotating, setIsRotating] = React.useState(autoRotate)
  const [wireframe, setWireframe] = React.useState(false)
  const [fullscreen, setFullscreen] = React.useState(false)
  const [currentView, setCurrentView] = React.useState<ViewPreset>('iso')
  const [nearViewport, setNearViewport] = React.useState(false)

  // A new `autoRotate` prop turns the rotation on or off, without building the viewer again.
  const [autoRotateProp, setAutoRotateProp] = React.useState(autoRotate)
  if (autoRotate !== autoRotateProp) {
    setAutoRotateProp(autoRotate)
    setIsRotating(autoRotate)
  }

  // Callbacks and the rotation are read when needed, not depended on: an inline callback is a new
  // function on every render, and building the viewer again means a new WebGL context, a new
  // download of the model and new shaders.
  const latest = React.useRef({ onLoad, onError, onProgress, isRotating })
  React.useEffect(() => {
    latest.current = { onLoad, onError, onProgress, isRotating }
  })

  // Track reduced motion preference
  const [reducedMotion, setReducedMotion] = React.useState(false)
  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(media.matches)
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    media.addEventListener?.('change', listener)
    return () => media.removeEventListener?.('change', listener)
  }, [])

  // Observe proximity to viewport (rootMargin: 200px)
  React.useEffect(() => {
    const el = wrapperRef.current
    if (!el || typeof window === 'undefined') return

    if (!('IntersectionObserver' in window)) {
      setNearViewport(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setNearViewport(true)
            observer.disconnect()
            break
          }
        }
      },
      { rootMargin: '200px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Fullscreen change listener
  React.useEffect(() => {
    if (typeof document === 'undefined') return
    const onFullscreenChange = () => {
      setFullscreen(
        Boolean(document.fullscreenElement && document.fullscreenElement === wrapperRef.current),
      )
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  // Lazy-load core and initialize viewer when approaching viewport
  React.useEffect(() => {
    if (!nearViewport || !canvasRef.current) return

    let isCancelled = false
    setStatus('loading')

    // Dynamic import to satisfy zero-weight initial bundle rule
    import('./core')
      .then((core) => {
        if (isCancelled || !canvasRef.current) return

        // Creating the renderer is the test for WebGL: it throws without it, and probing first
        // would spend a context of the few a page gets.
        const viewer = core.createViewer(canvasRef.current, {
          src,
          autoRotate: latest.current.isRotating && !reducedMotion,
          environment,
          shadows,
          maxDpr,
          dracoPath,
          reducedMotion,
        })

        viewerRef.current = viewer

        viewer.on('progress', (p) => {
          if (!isCancelled) {
            setProgress(p)
            latest.current.onProgress?.(p)
          }
        })

        viewer.on('load', (model) => {
          if (!isCancelled) {
            setStatus('ready')
            latest.current.onLoad?.(model)
          }
        })

        viewer.on('error', (err) => {
          if (!isCancelled) {
            setStatus('error')
            latest.current.onError?.(err)
          }
        })
      })
      .catch((err) => {
        if (!isCancelled) {
          setStatus('error')
          latest.current.onError?.(err instanceof Error ? err : new Error(String(err)))
        }
      })

    return () => {
      isCancelled = true
      if (viewerRef.current) {
        viewerRef.current.dispose()
        viewerRef.current = null
      }
    }
  }, [nearViewport, src, environment, shadows, maxDpr, dracoPath, reducedMotion])

  React.useEffect(() => {
    viewerRef.current?.setAutoRotate(isRotating && !reducedMotion)
  }, [isRotating, reducedMotion])

  const actions = React.useMemo<ViewerActions>(
    () => ({
      resetView: () => {
        viewerRef.current?.resetView()
        setCurrentView('iso')
      },
      zoom: (factor: number) => {
        viewerRef.current?.zoom(factor)
      },
      setView: (preset: ViewPreset) => {
        viewerRef.current?.setView(preset)
        setCurrentView(preset)
      },
      toggleAutoRotate: () => {
        if (reducedMotion) return
        setIsRotating((prev) => !prev)
      },
      toggleWireframe: () => {
        setWireframe((prev) => {
          const next = !prev
          viewerRef.current?.setWireframe(next)
          return next
        })
      },
      setBackground: (color: string | number | null) => {
        viewerRef.current?.setBackground(color)
      },
      toggleFullscreen: async () => {
        const el = wrapperRef.current
        if (!el || typeof document === 'undefined') return
        if (!document.fullscreenElement) {
          if (el.requestFullscreen) {
            await el.requestFullscreen()
          }
        } else {
          if (document.exitFullscreen) {
            await document.exitFullscreen()
          }
        }
      },
      screenshot: async (opts?: { scale?: number; type?: string }) => {
        if (!viewerRef.current) return null
        return viewerRef.current.screenshot(opts)
      },
    }),
    [reducedMotion],
  )

  const contextValue = React.useMemo<ViewerContextValue>(
    () => ({
      viewer: viewerRef.current,
      state: {
        status,
        progress,
        autoRotate: isRotating,
        wireframe,
        fullscreen,
        view: currentView,
      },
      actions,
    }),
    [status, progress, isRotating, wireframe, fullscreen, currentView, actions],
  )

  // Keyboard shortcut handler on focused wrapper
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return
    }

    switch (e.key) {
      case 'r':
      case 'R':
        e.preventDefault()
        actions.resetView()
        break
      case '+':
      case '=':
        e.preventDefault()
        actions.zoom(1.2)
        break
      case '-':
      case '_':
        e.preventDefault()
        actions.zoom(0.8)
        break
      case 'f':
      case 'F':
        e.preventDefault()
        actions.toggleFullscreen().catch(() => {})
        break
      case ' ':
        e.preventDefault()
        actions.toggleAutoRotate()
        break
      case '1':
        e.preventDefault()
        actions.setView('front')
        break
      case '2':
        e.preventDefault()
        actions.setView('right')
        break
      case '3':
        e.preventDefault()
        actions.setView('top')
        break
      case '4':
        e.preventDefault()
        actions.setView('iso')
        break
    }
  }

  return (
    <ViewerContext.Provider value={contextValue}>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: keyboard shortcuts for 3D viewer interaction */}
      <div
        ref={wrapperRef}
        data-slot="viewer"
        data-status={status}
        data-fullscreen={fullscreen ? '' : undefined}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: the viewer container takes focus so keyboard shortcuts can navigate it
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className={className}
        style={{ position: 'relative', outline: 'none', ...props.style }}
        {...props}
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={alt}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />

        {/* Poster image shown during initial render and loading */}
        {poster && status !== 'ready' && (
          <div
            data-slot="viewer-poster"
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'inherit',
              transition: 'opacity 0.35s ease',
              pointerEvents: 'auto',
            }}
          >
            <img
              src={poster}
              alt=""
              aria-hidden="true"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
            {status === 'loading' && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 24,
                  left: 24,
                  right: 24,
                  height: 4,
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.round(progress * 100)}%`,
                    backgroundColor: 'currentColor',
                    transition: 'width 0.15s ease',
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Fallback view when WebGL fails or loading errors */}
        {status === 'error' && (
          <div
            data-slot="viewer-fallback"
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
              textAlign: 'center',
            }}
          >
            {fallback ?? (
              <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.8 }}>
                3D viewer could not be loaded.
              </p>
            )}
          </div>
        )}

        {/* Overlays / Children (e.g. ViewerToolbar) */}
        {children}
      </div>
    </ViewerContext.Provider>
  )
}

export interface StageContextValue {
  stage: StageController | null
}

const StageContextInstance = React.createContext<StageContextValue | null>(null)

export function useStage(): StageContextValue {
  const context = React.useContext(StageContextInstance)
  if (!context) {
    throw new Error('useStage must be used within a <Stage /> component')
  }
  return context
}

export interface StageProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** Setup callback that receives `{ THREE, scene, camera, renderer, invalidate }`. May return a cleanup callback. */
  onSetup?: (ctx: StageContext) => (() => void) | undefined
  /** Frame loop callback that receives `(ctx, dt)`. Return `true` to keep rendering continuously. */
  onFrame?: (ctx: StageContext, dt: number) => boolean | undefined
  /** Render loop strategy: 'demand' (default) or 'always'. */
  frameloop?: 'demand' | 'always'
  /** Maximum device pixel ratio cap. Default 2. */
  maxDpr?: number
  className?: string
  children?: React.ReactNode
}

/**
 * Headless Three.js stage for custom procedural scenes.
 * Defers loading Three.js until entering view, and injects `THREE` into setup.
 */
export function Stage({
  onSetup,
  onFrame,
  frameloop = 'demand',
  maxDpr = 2,
  className,
  children,
  ...props
}: StageProps) {
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const stageRef = React.useRef<StageController | null>(null)
  const [inView, setInView] = React.useState(false)

  // Inline callbacks are new on every render; reading them through a ref keeps one stage alive.
  const latest = React.useRef({ onSetup, onFrame })
  React.useEffect(() => {
    latest.current = { onSetup, onFrame }
  })

  React.useEffect(() => {
    const el = wrapperRef.current
    if (!el || typeof window === 'undefined') return

    if (!('IntersectionObserver' in window)) {
      setInView(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true)
            observer.disconnect()
            break
          }
        }
      },
      { rootMargin: '200px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  React.useEffect(() => {
    if (!inView || !canvasRef.current) return

    let cleanupSetup: (() => void) | undefined
    let unmountCleanup: (() => void) | undefined
    let isCancelled = false

    // All of three comes only with a custom scene, which may use any of it.
    Promise.all([import('./core'), import('three')]).then(([core, THREE]) => {
      if (isCancelled || !canvasRef.current) return

      const stage = core.createStage(canvasRef.current, {
        frameloop,
        maxDpr,
      })

      stageRef.current = stage

      const ctx: StageContext = {
        THREE,
        scene: stage.scene,
        camera: stage.camera,
        renderer: stage.renderer,
        canvas: stage.canvas,
        invalidate: stage.invalidate,
      }
      cleanupSetup = latest.current.onSetup?.(ctx)
      unmountCleanup = stage.onFrame((_, dt) => latest.current.onFrame?.(ctx, dt))
    })

    return () => {
      isCancelled = true
      if (typeof cleanupSetup === 'function') {
        cleanupSetup()
      }
      if (typeof unmountCleanup === 'function') {
        unmountCleanup()
      }
      if (stageRef.current) {
        stageRef.current.dispose()
        stageRef.current = null
      }
    }
  }, [inView, frameloop, maxDpr])

  return (
    <StageContextInstance.Provider value={{ stage: stageRef.current }}>
      <div
        ref={wrapperRef}
        data-slot="stage"
        className={className}
        style={{ position: 'relative', ...props.style }}
        {...props}
      >
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        {children}
      </div>
    </StageContextInstance.Provider>
  )
}
