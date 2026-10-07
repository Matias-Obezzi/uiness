import { useEffect, useRef } from 'react'

export default function ThreeCoreDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let disposed = false
    let cleanup: (() => void) | undefined

    import('@uiness/three/core').then(({ createViewer }) => {
      if (disposed || !canvasRef.current) return
      const viewer = createViewer(canvas, {
        src: '/models/chair.glb',
        autoRotate: true,
        shadows: true,
      })
      cleanup = () => viewer.dispose()
    })

    return () => {
      disposed = true
      cleanup?.()
    }
  }, [])

  return (
    <div className="relative aspect-[4/3] w-full max-w-2xl overflow-hidden rounded-xl border bg-muted/20">
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        aria-label="3D Model Viewer using Core API"
      />
    </div>
  )
}
