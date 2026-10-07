'use client'

import { useViewer, Viewer, type ViewerProps } from '@uiness/three'
import {
  BoxIcon,
  CameraIcon,
  Grid3X3Icon,
  Maximize2Icon,
  Minimize2Icon,
  OrbitIcon,
  RotateCcwIcon,
  SunMoonIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from 'lucide-react'
import {
  DropdownMenu as DropdownMenuPrimitive,
  Toolbar as ToolbarPrimitive,
  Tooltip as TooltipPrimitive,
} from 'radix-ui'
import * as React from 'react'
// Peer dependency for 3D engine: import('three')
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface ThreeViewerLabels {
  /** Accessible label for the reset view action. */
  reset: string
  /** Accessible label for the zoom in action. */
  zoomIn: string
  /** Accessible label for the zoom out action. */
  zoomOut: string
  /** Accessible label for toggling automatic rotation. */
  autoRotate: string
  /** Accessible label for the camera views menu. */
  views: string
  /** Accessible label for the front camera view. */
  viewFront: string
  /** Accessible label for the back camera view. */
  viewBack: string
  /** Accessible label for the left camera view. */
  viewLeft: string
  /** Accessible label for the right camera view. */
  viewRight: string
  /** Accessible label for the top camera view. */
  viewTop: string
  /** Accessible label for the isometric camera view. */
  viewIso: string
  /** Accessible label for toggling mesh wireframe mode. */
  wireframe: string
  /** Accessible label for cycling background color. */
  background: string
  /** Accessible label for capturing and downloading a screenshot. */
  screenshot: string
  /** Accessible label for toggling fullscreen mode. */
  fullscreen: string
}

export const defaultThreeViewerLabels: ThreeViewerLabels = {
  reset: 'Reset view',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  autoRotate: 'Auto-rotate',
  views: 'Camera views',
  viewFront: 'Front view',
  viewBack: 'Back view',
  viewLeft: 'Left view',
  viewRight: 'Right view',
  viewTop: 'Top view',
  viewIso: 'Isometric view',
  wireframe: 'Toggle wireframe',
  background: 'Toggle background',
  screenshot: 'Capture screenshot',
  fullscreen: 'Toggle fullscreen',
}

export type ViewerToolbarAction =
  | 'reset'
  | 'zoomIn'
  | 'zoomOut'
  | 'autoRotate'
  | 'views'
  | 'wireframe'
  | 'background'
  | 'screenshot'
  | 'fullscreen'

export interface ViewerToolbarProps extends React.ComponentProps<'div'> {
  /** Screen edge where the toolbar floats. Default 'bottom'. */
  position?: 'bottom' | 'top' | 'left' | 'right'
  /** List of actions to display and their order. Defaults to all available actions. */
  actions?: ViewerToolbarAction[]
  /** Whether the toolbar automatically hides after 2.5s of inactivity. Default false. */
  autoHide?: boolean
  /** Custom label overrides for screen readers and tooltips. */
  labels?: Partial<ThreeViewerLabels>
}

const subscribeNever = () => () => {}
const canFullscreen = () =>
  typeof document !== 'undefined' ? document.fullscreenEnabled !== false : true

/**
 * Floating toolbar providing controls for zooming, viewpoint presets, wireframe mode,
 * background toggle, screenshot capture, and fullscreen for a `<Viewer />`.
 */
export function ViewerToolbar({
  position = 'bottom',
  actions = [
    'reset',
    'zoomIn',
    'zoomOut',
    'autoRotate',
    'views',
    'wireframe',
    'background',
    'screenshot',
    'fullscreen',
  ],
  autoHide = false,
  labels: labelsOverride,
  className,
  ...props
}: ViewerToolbarProps) {
  const { state, actions: viewerActions } = useViewer()
  const t = useLabels('three-viewer', defaultThreeViewerLabels, labelsOverride)

  const [bgMode, setBgMode] = React.useState<'transparent' | 'light' | 'dark'>('transparent')
  const fullscreenAvailable = React.useSyncExternalStore(subscribeNever, canFullscreen, () => true)
  const [hidden, setHidden] = React.useState(false)
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const toolbarRef = React.useRef<HTMLDivElement>(null)

  // Auto-hide behavior: resets on pointer movement, fades after 2.5s when not focused
  React.useEffect(() => {
    if (!autoHide) return

    const resetTimer = () => {
      setHidden(false)
      if (timerRef.current) clearTimeout(timerRef.current)

      timerRef.current = setTimeout(() => {
        // Never hide while an element inside the toolbar retains focus
        const hasFocus = toolbarRef.current?.contains(document.activeElement)
        if (!hasFocus) {
          setHidden(true)
        }
      }, 2500)
    }

    const handlePointerMove = () => resetTimer()
    const handleFocus = () => {
      setHidden(false)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    const handleBlur = () => resetTimer()

    window.addEventListener('pointermove', handlePointerMove)
    const el = toolbarRef.current
    el?.addEventListener('focusin', handleFocus)
    el?.addEventListener('focusout', handleBlur)

    // Schedule initial hide timer without synchronous setState
    timerRef.current = setTimeout(() => {
      const hasFocus = toolbarRef.current?.contains(document.activeElement)
      if (!hasFocus) {
        setHidden(true)
      }
    }, 2500)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      window.removeEventListener('pointermove', handlePointerMove)
      el?.removeEventListener('focusin', handleFocus)
      el?.removeEventListener('focusout', handleBlur)
    }
  }, [autoHide])

  const visible = !autoHide || !hidden

  const handleCycleBackground = () => {
    if (bgMode === 'transparent') {
      setBgMode('light')
      viewerActions.setBackground('#f8fafc')
    } else if (bgMode === 'light') {
      setBgMode('dark')
      viewerActions.setBackground('#09090b')
    } else {
      setBgMode('transparent')
      viewerActions.setBackground(null)
    }
  }

  const handleScreenshot = async () => {
    try {
      const blob = await viewerActions.screenshot({ scale: 2, type: 'image/png' })
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'model-screenshot.png'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // Ignore screenshot errors on disposed canvases
    }
  }

  const positionClasses = {
    bottom: 'bottom-4 left-1/2 -translate-x-1/2 flex-row',
    top: 'top-4 left-1/2 -translate-x-1/2 flex-row',
    left: 'left-4 top-1/2 -translate-y-1/2 flex-col',
    right: 'right-4 top-1/2 -translate-y-1/2 flex-col',
  }

  const renderTooltipButton = (
    key: string,
    label: string,
    icon: React.ReactNode,
    onClick: () => void,
    active = false,
  ) => (
    <TooltipPrimitive.Provider key={key} delayDuration={300}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          <ToolbarPrimitive.Button
            type="button"
            aria-label={label}
            data-active={active ? '' : undefined}
            onClick={onClick}
            className={cn(
              'inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-active:bg-accent data-active:text-foreground',
            )}
          >
            {icon}
          </ToolbarPrimitive.Button>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={position === 'top' ? 'bottom' : 'top'}
            sideOffset={8}
            className="z-50 animate-in fade-in-0 zoom-in-95 rounded-md bg-foreground px-2 py-1 text-xs text-background shadow-md"
          >
            {label}
            <TooltipPrimitive.Arrow className="fill-foreground" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )

  return (
    <div
      ref={toolbarRef}
      data-slot="viewer-toolbar"
      aria-hidden={!visible}
      className={cn(
        'absolute z-20 transition-opacity duration-300',
        positionClasses[position],
        visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        className,
      )}
      {...props}
    >
      <ToolbarPrimitive.Root
        aria-label="3D Viewer Controls"
        className={cn(
          'flex items-center gap-1 rounded-full border border-border/80 bg-background/85 p-1 text-foreground shadow-lg backdrop-blur-md',
          (position === 'left' || position === 'right') && 'flex-col',
        )}
      >
        {actions.map((action) => {
          switch (action) {
            case 'reset':
              return renderTooltipButton(
                'reset',
                t.reset,
                <RotateCcwIcon className="size-4" />,
                () => viewerActions.resetView(),
              )

            case 'zoomIn':
              return renderTooltipButton(
                'zoomIn',
                t.zoomIn,
                <ZoomInIcon className="size-4" />,
                () => viewerActions.zoom(1.2),
              )

            case 'zoomOut':
              return renderTooltipButton(
                'zoomOut',
                t.zoomOut,
                <ZoomOutIcon className="size-4" />,
                () => viewerActions.zoom(0.8),
              )

            case 'autoRotate':
              return renderTooltipButton(
                'autoRotate',
                t.autoRotate,
                <OrbitIcon className="size-4" />,
                () => viewerActions.toggleAutoRotate(),
                state.autoRotate,
              )

            case 'views':
              return (
                <DropdownMenuPrimitive.Root key="views">
                  <TooltipPrimitive.Provider delayDuration={300}>
                    <TooltipPrimitive.Root>
                      <TooltipPrimitive.Trigger asChild>
                        <DropdownMenuPrimitive.Trigger asChild>
                          <ToolbarPrimitive.Button
                            type="button"
                            aria-label={t.views}
                            className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <BoxIcon className="size-4" />
                          </ToolbarPrimitive.Button>
                        </DropdownMenuPrimitive.Trigger>
                      </TooltipPrimitive.Trigger>
                      <TooltipPrimitive.Portal>
                        <TooltipPrimitive.Content
                          side={position === 'top' ? 'bottom' : 'top'}
                          sideOffset={8}
                          className="z-50 animate-in fade-in-0 zoom-in-95 rounded-md bg-foreground px-2 py-1 text-xs text-background shadow-md"
                        >
                          {t.views}
                          <TooltipPrimitive.Arrow className="fill-foreground" />
                        </TooltipPrimitive.Content>
                      </TooltipPrimitive.Portal>
                    </TooltipPrimitive.Root>
                  </TooltipPrimitive.Provider>

                  <DropdownMenuPrimitive.Portal>
                    <DropdownMenuPrimitive.Content
                      side={position === 'top' ? 'bottom' : 'top'}
                      sideOffset={8}
                      className="z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 text-xs"
                    >
                      <DropdownMenuPrimitive.Item
                        className="flex cursor-pointer select-none items-center justify-between rounded px-2 py-1.5 outline-hidden hover:bg-accent hover:text-accent-foreground"
                        onClick={() => viewerActions.setView('front')}
                      >
                        {t.viewFront} <span className="text-muted-foreground">1</span>
                      </DropdownMenuPrimitive.Item>
                      <DropdownMenuPrimitive.Item
                        className="flex cursor-pointer select-none items-center justify-between rounded px-2 py-1.5 outline-hidden hover:bg-accent hover:text-accent-foreground"
                        onClick={() => viewerActions.setView('right')}
                      >
                        {t.viewRight} <span className="text-muted-foreground">2</span>
                      </DropdownMenuPrimitive.Item>
                      <DropdownMenuPrimitive.Item
                        className="flex cursor-pointer select-none items-center justify-between rounded px-2 py-1.5 outline-hidden hover:bg-accent hover:text-accent-foreground"
                        onClick={() => viewerActions.setView('top')}
                      >
                        {t.viewTop} <span className="text-muted-foreground">3</span>
                      </DropdownMenuPrimitive.Item>
                      <DropdownMenuPrimitive.Item
                        className="flex cursor-pointer select-none items-center justify-between rounded px-2 py-1.5 outline-hidden hover:bg-accent hover:text-accent-foreground"
                        onClick={() => viewerActions.setView('iso')}
                      >
                        {t.viewIso} <span className="text-muted-foreground">4</span>
                      </DropdownMenuPrimitive.Item>
                      <DropdownMenuPrimitive.Item
                        className="flex cursor-pointer select-none items-center rounded px-2 py-1.5 outline-hidden hover:bg-accent hover:text-accent-foreground"
                        onClick={() => viewerActions.setView('back')}
                      >
                        {t.viewBack}
                      </DropdownMenuPrimitive.Item>
                      <DropdownMenuPrimitive.Item
                        className="flex cursor-pointer select-none items-center rounded px-2 py-1.5 outline-hidden hover:bg-accent hover:text-accent-foreground"
                        onClick={() => viewerActions.setView('left')}
                      >
                        {t.viewLeft}
                      </DropdownMenuPrimitive.Item>
                    </DropdownMenuPrimitive.Content>
                  </DropdownMenuPrimitive.Portal>
                </DropdownMenuPrimitive.Root>
              )

            case 'wireframe':
              return renderTooltipButton(
                'wireframe',
                t.wireframe,
                <Grid3X3Icon className="size-4" />,
                () => viewerActions.toggleWireframe(),
                state.wireframe,
              )

            case 'background':
              return renderTooltipButton(
                'background',
                t.background,
                <SunMoonIcon className="size-4" />,
                handleCycleBackground,
                bgMode !== 'transparent',
              )

            case 'screenshot':
              return renderTooltipButton(
                'screenshot',
                t.screenshot,
                <CameraIcon className="size-4" />,
                handleScreenshot,
              )

            case 'fullscreen':
              if (!fullscreenAvailable) return null
              return renderTooltipButton(
                'fullscreen',
                t.fullscreen,
                state.fullscreen ? (
                  <Minimize2Icon className="size-4" />
                ) : (
                  <Maximize2Icon className="size-4" />
                ),
                () => {
                  viewerActions.toggleFullscreen().catch(() => {})
                },
                state.fullscreen,
              )

            default:
              return null
          }
        })}
      </ToolbarPrimitive.Root>
    </div>
  )
}

export interface ThreeViewerProps extends ViewerProps {
  /** Edge where the floating toolbar is anchored: 'bottom' | 'top' | 'left' | 'right'. Default 'bottom'. */
  toolbarPosition?: 'bottom' | 'top' | 'left' | 'right'
  /** Subset and ordering of actions displayed in the toolbar. */
  toolbarActions?: ViewerToolbarAction[]
  /** Whether the toolbar automatically hides after 2.5s of inactivity. Default false. */
  autoHideToolbar?: boolean
  /** Localized text labels for toolbar buttons and camera presets. */
  labels?: Partial<ThreeViewerLabels>
}

/**
 * All-in-one 3D model viewer pairing `<Viewer />` with an interactive `<ViewerToolbar />`.
 *
 * Keyboard shortcuts when focused, all remappable through `shortcuts`:
 * - `R`: Reset camera viewpoint
 * - `+` / `-`: Zoom in / Zoom out
 * - `Space`: Toggle automatic rotation
 * - `F`: Toggle fullscreen
 * - `1`–`4`: Switch to Front, Right, Top, or Isometric camera presets
 *
 * The wheel zooms with Ctrl or ⌘ held, or a trackpad pinch, and scrolls the page otherwise;
 * set `wheelZoom` to change it.
 */
export function ThreeViewer({
  toolbarPosition = 'bottom',
  toolbarActions,
  autoHideToolbar = false,
  labels,
  className,
  children,
  ...props
}: ThreeViewerProps) {
  return (
    <Viewer
      data-slot="three-viewer"
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border bg-muted/20',
        className,
      )}
      {...props}
    >
      <ViewerToolbar
        position={toolbarPosition}
        actions={toolbarActions}
        autoHide={autoHideToolbar}
        labels={labels}
      />
      {children}
    </Viewer>
  )
}
