// Named imports, never `import * as THREE`: a namespace that escapes the module keeps all of
// three in the bundle, about a fifth more than the viewer uses.
import {
  ACESFilmicToneMapping,
  Box3,
  Color,
  DirectionalLight,
  Mesh,
  type Object3D,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  ShadowMaterial,
  Sphere,
  SRGBColorSpace,
  Texture,
  Vector3,
  WebGLRenderer,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import type { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export type ViewPreset = 'front' | 'back' | 'left' | 'right' | 'top' | 'iso'

export interface LoopState {
  isAutoRotating?: boolean
  isDamping?: boolean
  hasActiveFrame?: boolean
  inView?: boolean
  isVisible?: boolean
}

/**
 * Decides whether the animation frame loop should continue running.
 * The loop only runs continuously while something is actively changing and visible.
 */
export function shouldContinueLoop({
  isAutoRotating = false,
  isDamping = false,
  hasActiveFrame = false,
  inView = true,
  isVisible = true,
}: LoopState): boolean {
  if (!inView || !isVisible) return false
  return Boolean(isAutoRotating || isDamping || hasActiveFrame)
}

/**
 * Calculates the distance needed to fit a sphere of given radius into a perspective camera's view frustum.
 * Correctly accounts for aspect ratios less than 1 (portrait orientation) where horizontal FOV constrains framing.
 */
export function fitDistance(radius: number, fovDeg: number, aspect: number, margin = 1.25): number {
  if (radius <= 0) return 1
  const fovRad = (fovDeg * Math.PI) / 180
  const halfFovV = fovRad / 2
  // For aspect ratios < 1, the horizontal FOV is narrower and limits the view.
  const halfFovH = Math.atan(Math.tan(halfFovV) * Math.max(0.0001, aspect))
  const effectiveHalfFov = aspect < 1 ? halfFovH : halfFovV
  const sinHalf = Math.sin(effectiveHalfFov)
  return sinHalf > 0 ? (radius / sinHalf) * margin : radius * margin
}

const TEXTURE_PROPERTIES = [
  'map',
  'lightMap',
  'bumpMap',
  'normalMap',
  'specularMap',
  'envMap',
  'alphaMap',
  'aoMap',
  'displacementMap',
  'emissiveMap',
  'gradientMap',
  'metalnessMap',
  'roughnessMap',
  'clearcoatMap',
  'clearcoatRoughnessMap',
  'clearcoatNormalMap',
  'sheenColorMap',
  'sheenRoughnessMap',
  'transmissionMap',
  'thicknessMap',
  'specularIntensityMap',
  'specularColorMap',
  'iridescenceMap',
  'iridescenceThicknessMap',
] as const

/**
 * Traverses a 3D object and disposes of all geometries, materials, and associated textures.
 */
export function disposeObject(obj: Object3D): void {
  if (!obj) return

  obj.traverse((child) => {
    const mesh = child as unknown as {
      geometry?: { dispose?: () => void }
      material?: { dispose?: () => void } | ({ dispose?: () => void } | undefined)[]
      skeleton?: { dispose?: () => void }
    }

    if (mesh.geometry && typeof mesh.geometry.dispose === 'function') {
      mesh.geometry.dispose()
    }

    if (mesh.material) {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      for (const mat of materials) {
        if (!mat) continue
        const matRecord = mat as unknown as Record<string, unknown>
        for (const prop of TEXTURE_PROPERTIES) {
          const val = matRecord[prop] as { dispose?: () => void } | undefined
          if (val && typeof val.dispose === 'function') {
            val.dispose()
          }
        }
        if (typeof mat.dispose === 'function') {
          mat.dispose()
        }
      }
    }

    if (mesh.skeleton && typeof mesh.skeleton.dispose === 'function') {
      mesh.skeleton.dispose()
    }
  })
}

export type EventMap = {
  progress: [progress: number]
  load: [model: Object3D]
  error: [error: Error]
  change: []
}

export interface StageOptions {
  maxDpr?: number
  frameloop?: 'demand' | 'always'
  antialias?: boolean
  alpha?: boolean
  powerPreference?: WebGLPowerPreference
  camera?: PerspectiveCamera
  scene?: Scene
}

export interface StageContext {
  scene: Scene
  camera: PerspectiveCamera
  renderer: WebGLRenderer
  canvas: HTMLCanvasElement
  invalidate: () => void
}

export interface StageController {
  scene: Scene
  camera: PerspectiveCamera
  renderer: WebGLRenderer
  canvas: HTMLCanvasElement
  invalidate: () => void
  on: <K extends keyof EventMap>(event: K, handler: (...args: EventMap[K]) => void) => () => void
  emit: <K extends keyof EventMap>(event: K, ...args: EventMap[K]) => void
  onFrame: (callback: (ctx: StageContext, dt: number) => boolean | undefined) => () => void
  setFrameloop: (frameloop: 'demand' | 'always') => void
  render: () => void
  dispose: () => void
  isInView: () => boolean
}

/**
 * Creates a lightweight, demand-rendered Three.js stage controller without React.
 */
export function createStage(canvas: HTMLCanvasElement, options?: StageOptions): StageController {
  const maxDpr = options?.maxDpr ?? 2
  const initialDpr = Math.min(
    typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
    maxDpr,
  )
  // At two device pixels per CSS pixel the edges are already fine, and multisampling would
  // still cost four samples for each of four times the pixels.
  const antialias = options?.antialias ?? initialDpr < 2
  const alpha = options?.alpha ?? true
  // 'high-performance' wakes the discrete GPU on laptops that have two, for a product shot.
  const powerPreference = options?.powerPreference ?? 'default'
  let frameloop = options?.frameloop ?? 'demand'

  const renderer = new WebGLRenderer({
    canvas,
    antialias,
    alpha,
    powerPreference,
  })

  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.setPixelRatio(initialDpr)

  const scene = options?.scene ?? new Scene()
  const initialWidth = canvas.clientWidth || 300
  const initialHeight = canvas.clientHeight || 150
  const camera =
    options?.camera ??
    new PerspectiveCamera(45, initialWidth / Math.max(1, initialHeight), 0.1, 1000)

  renderer.setSize(initialWidth, initialHeight, false)

  let inView = true
  let isVisible = typeof document !== 'undefined' ? document.visibilityState !== 'hidden' : true
  let rafId: number | null = null
  let lastTime = performance.now()
  let isDisposed = false

  const listeners = new Map<keyof EventMap, Set<(...args: unknown[]) => void>>()
  const frameCallbacks = new Set<(ctx: StageContext, dt: number) => boolean | undefined>()

  function on<K extends keyof EventMap>(
    event: K,
    handler: (...args: EventMap[K]) => void,
  ): () => void {
    let set = listeners.get(event)
    if (!set) {
      set = new Set()
      listeners.set(event, set)
    }
    set.add(handler as (...args: unknown[]) => void)
    return () => {
      set?.delete(handler as (...args: unknown[]) => void)
    }
  }

  function emit<K extends keyof EventMap>(event: K, ...args: EventMap[K]): void {
    const set = listeners.get(event)
    if (set) {
      for (const fn of set) {
        fn(...args)
      }
    }
  }

  const stageCtx: StageContext = {
    scene,
    camera,
    renderer,
    canvas,
    invalidate,
  }

  function render(): void {
    if (isDisposed) return
    renderer.render(scene, camera)
  }

  function tick(now: number): void {
    rafId = null
    if (isDisposed) return

    const dt = Math.min((now - lastTime) / 1000, 0.1)
    lastTime = now

    let hasActiveFrame = false
    for (const cb of frameCallbacks) {
      if (cb(stageCtx, dt) === true) {
        hasActiveFrame = true
      }
    }

    render()

    const shouldContinue = shouldContinueLoop({
      hasActiveFrame: hasActiveFrame || frameloop === 'always',
      inView,
      isVisible,
    })

    if (shouldContinue) {
      rafId = requestAnimationFrame(tick)
    }
  }

  function invalidate(): void {
    if (isDisposed) return
    if (rafId === null) {
      lastTime = performance.now()
      rafId = requestAnimationFrame(tick)
    }
  }

  function onFrame(callback: (ctx: StageContext, dt: number) => boolean | undefined): () => void {
    frameCallbacks.add(callback)
    invalidate()
    return () => {
      frameCallbacks.delete(callback)
    }
  }

  function setFrameloop(mode: 'demand' | 'always'): void {
    frameloop = mode
    invalidate()
  }

  // Observers
  let resizeObserver: ResizeObserver | null = null
  let intersectionObserver: IntersectionObserver | null = null
  let removeVisibility: (() => void) | null = null

  if (typeof window !== 'undefined') {
    const handleResize = (entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width > 0 && height > 0) {
          renderer.setSize(width, height, false)
          camera.aspect = width / height
          camera.updateProjectionMatrix()
          invalidate()
          emit('change')
        }
      }
    }

    // The canvas itself: its parent's box also holds padding and overlays like the toolbar.
    resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(canvas)

    if ('IntersectionObserver' in window) {
      intersectionObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          inView = entry.isIntersecting
          if (inView) {
            invalidate()
          }
        }
      })
      intersectionObserver.observe(canvas)
    }

    const handleVisibility = () => {
      isVisible = document.visibilityState !== 'hidden'
      if (isVisible) {
        invalidate()
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)

    removeVisibility = () => {
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }

  function dispose(): void {
    if (isDisposed) return
    isDisposed = true

    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }

    resizeObserver?.disconnect()
    intersectionObserver?.disconnect()
    removeVisibility?.()

    frameCallbacks.clear()
    listeners.clear()

    disposeObject(scene)
    renderer.dispose()
  }

  // Initial schedule
  invalidate()

  return {
    scene,
    camera,
    renderer,
    canvas,
    invalidate,
    on,
    emit,
    onFrame,
    setFrameloop,
    render,
    dispose,
    isInView: () => inView,
  }
}

export interface ViewerOptions extends StageOptions {
  src?: string | Object3D
  autoRotate?: boolean
  environment?: 'room' | 'none' | Texture
  shadows?: boolean
  dracoPath?: string
  fov?: number
  margin?: number
  reducedMotion?: boolean
  backgroundColor?: string | number | null
}

export interface ViewerController extends StageController {
  controls: OrbitControls
  load: (src: string | Object3D) => Promise<Object3D>
  fit: () => void
  resetView: () => void
  setView: (preset: ViewPreset) => void
  zoom: (factor: number) => void
  setAutoRotate: (enabled: boolean) => void
  setWireframe: (enabled: boolean) => void
  setBackground: (color: string | number | null) => void
  screenshot: (options?: { scale?: number; type?: string }) => Promise<Blob>
  getModel: () => Object3D | null
  getBounds: () => { center: Vector3; radius: number; min: Vector3; max: Vector3 }
}

/** Easing function for smooth viewpoint transitions: easeOutCubic. */
const easeOut = (t: number) => 1 - (1 - t) ** 3

/**
 * Creates an interactive 3D model viewer with orbit controls, lighting, contact shadow,
 * model fitting, and view transitions.
 */
export function createViewer(
  canvas: HTMLCanvasElement,
  options: ViewerOptions = {},
): ViewerController {
  const reducedMotion = options.reducedMotion ?? false
  const stage = createStage(canvas, options)
  const { scene, camera, renderer, invalidate, emit } = stage

  camera.fov = options.fov ?? 45
  camera.updateProjectionMatrix()

  const controls = new OrbitControls(camera, canvas)
  controls.enableDamping = !reducedMotion
  controls.dampingFactor = 0.05
  controls.autoRotate = Boolean(options.autoRotate && !reducedMotion)
  controls.autoRotateSpeed = 2.0

  controls.addEventListener('change', () => {
    invalidate()
    emit('change')
  })

  // Environment lighting
  let roomEnv: RoomEnvironment | null = null
  let pmremGenerator: PMREMGenerator | null = null
  let envTexture: Texture | null = null

  if (options.environment === 'none') {
    scene.environment = null
  } else if (options.environment instanceof Texture) {
    scene.environment = options.environment
  } else {
    // Default 'room' environment with PMREMGenerator
    pmremGenerator = new PMREMGenerator(renderer)
    roomEnv = new RoomEnvironment()
    envTexture = pmremGenerator.fromScene(roomEnv).texture
    scene.environment = envTexture
  }

  // Background
  if (options.backgroundColor !== undefined && options.backgroundColor !== null) {
    scene.background = new Color(options.backgroundColor)
  }

  // Directional Light & Contact Shadow
  const enableShadows = options.shadows !== false
  let dirLight: DirectionalLight | null = null
  let shadowPlane: Mesh | null = null

  if (enableShadows) {
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = PCFSoftShadowMap
    // The light and the model stay put while the camera orbits, so the shadow is drawn once
    // per model instead of once per frame.
    renderer.shadowMap.autoUpdate = false

    dirLight = new DirectionalLight(0xffffff, 2.5)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.width = 1024
    dirLight.shadow.mapSize.height = 1024
    dirLight.shadow.bias = -0.0001
    scene.add(dirLight)
    scene.add(dirLight.target)

    const shadowGeo = new PlaneGeometry(1, 1)
    shadowGeo.rotateX(-Math.PI / 2)
    const shadowMat = new ShadowMaterial({ opacity: 0.25 })
    shadowPlane = new Mesh(shadowGeo, shadowMat)
    shadowPlane.receiveShadow = true
    scene.add(shadowPlane)
  }

  // Model bounds
  let currentModel: Object3D | null = null
  const bounds = {
    center: new Vector3(0, 0, 0),
    radius: 1,
    min: new Vector3(-0.5, -0.5, -0.5),
    max: new Vector3(0.5, 0.5, 0.5),
  }

  // Initial camera pose for resetView
  const initialPose = {
    position: new Vector3(0, 0, 3),
    target: new Vector3(0, 0, 0),
  }

  // View transition tweening state
  let tween: {
    startTime: number
    duration: number
    startPos: Vector3
    endPos: Vector3
    startTarget: Vector3
    endTarget: Vector3
  } | null = null

  // Register frame loop to drive controls damping and view transitions
  const unsubscribeFrame = stage.onFrame((_, _dt) => {
    let active = false

    // Animate view transition
    if (tween) {
      active = true
      const elapsed = performance.now() - tween.startTime
      const progress = Math.min(elapsed / tween.duration, 1)
      const t = easeOut(progress)

      camera.position.lerpVectors(tween.startPos, tween.endPos, t)
      controls.target.lerpVectors(tween.startTarget, tween.endTarget, t)

      if (progress >= 1) {
        tween = null
      }
    }

    // Update controls (auto-rotate and damping)
    const dampingActive = controls.update()
    if (controls.autoRotate || dampingActive) {
      active = true
    }

    return active
  })

  function fit(): void {
    const margin = options.margin ?? 1.25
    const dist = fitDistance(bounds.radius, camera.fov, camera.aspect, margin)

    // Position camera along isometric angle relative to model center
    const isoDir = new Vector3(Math.SQRT1_2, 0.5, Math.SQRT1_2).normalize()
    camera.position.copy(bounds.center).addScaledVector(isoDir, dist)
    controls.target.copy(bounds.center)

    camera.near = Math.max(dist * 0.01, 0.01)
    camera.far = Math.max(dist * 20, 100)
    camera.updateProjectionMatrix()

    controls.minDistance = Math.max(bounds.radius * 0.3, 0.05)
    controls.maxDistance = Math.max(bounds.radius * 12, 10)
    controls.update()

    initialPose.position.copy(camera.position)
    initialPose.target.copy(controls.target)

    invalidate()
  }

  function setView(preset: ViewPreset): void {
    const dist =
      camera.position.distanceTo(controls.target) ||
      fitDistance(bounds.radius, camera.fov, camera.aspect, 1.25)
    const target = bounds.center.clone()
    const pos = target.clone()

    switch (preset) {
      case 'front':
        pos.z += dist
        break
      case 'back':
        pos.z -= dist
        break
      case 'left':
        pos.x -= dist
        break
      case 'right':
        pos.x += dist
        break
      case 'top':
        pos.y += dist
        // Add tiny offset to prevent singularity with camera lookAt
        pos.z += 0.0001
        break
      case 'iso': {
        const isoDir = new Vector3(Math.SQRT1_2, 0.5, Math.SQRT1_2).normalize()
        pos.addScaledVector(isoDir, dist)
        break
      }
    }

    if (reducedMotion) {
      camera.position.copy(pos)
      controls.target.copy(target)
      controls.update()
      invalidate()
      emit('change')
    } else {
      tween = {
        startTime: performance.now(),
        duration: 450,
        startPos: camera.position.clone(),
        endPos: pos,
        startTarget: controls.target.clone(),
        endTarget: target,
      }
      invalidate()
    }
  }

  function resetView(): void {
    if (reducedMotion) {
      camera.position.copy(initialPose.position)
      controls.target.copy(initialPose.target)
      controls.update()
      invalidate()
      emit('change')
    } else {
      tween = {
        startTime: performance.now(),
        duration: 450,
        startPos: camera.position.clone(),
        endPos: initialPose.position.clone(),
        startTarget: controls.target.clone(),
        endTarget: initialPose.target.clone(),
      }
      invalidate()
    }
  }

  function zoom(factor: number): void {
    // factor > 1 zooms in (closer to target), factor < 1 zooms out
    const offset = camera.position.clone().sub(controls.target)
    const currentDist = offset.length()
    const newDist = Math.max(
      controls.minDistance,
      Math.min(controls.maxDistance, currentDist / factor),
    )
    offset.setLength(newDist)
    camera.position.copy(controls.target).add(offset)
    controls.update()
    invalidate()
    emit('change')
  }

  function setAutoRotate(enabled: boolean): void {
    controls.autoRotate = Boolean(enabled && !reducedMotion)
    invalidate()
  }

  function setWireframe(enabled: boolean): void {
    if (!currentModel) return
    currentModel.traverse((node) => {
      const mesh = node as unknown as {
        isMesh?: boolean
        material?: { wireframe?: boolean } | { wireframe?: boolean }[]
      }
      if (mesh.isMesh && mesh.material) {
        if (Array.isArray(mesh.material)) {
          for (const m of mesh.material) {
            if (m) m.wireframe = enabled
          }
        } else {
          mesh.material.wireframe = enabled
        }
      }
    })
    invalidate()
  }

  function setBackground(color: string | number | null): void {
    if (color === null || color === undefined) {
      scene.background = null
    } else {
      scene.background = new Color(color)
    }
    invalidate()
  }

  function screenshot(screenshotOpts?: { scale?: number; type?: string }): Promise<Blob> {
    stage.render()
    const type = screenshotOpts?.type ?? 'image/png'
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to capture canvas screenshot'))
        }
      }, type)
    })
  }

  function setupLoadedModel(model: Object3D): void {
    if (currentModel) {
      scene.remove(currentModel)
      disposeObject(currentModel)
      currentModel = null
    }

    currentModel = model
    scene.add(model)

    // Enable shadows on model meshes
    if (enableShadows) {
      model.traverse((node) => {
        const mesh = node as unknown as {
          isMesh?: boolean
          castShadow?: boolean
          receiveShadow?: boolean
        }
        if (mesh.isMesh) {
          mesh.castShadow = true
          mesh.receiveShadow = true
        }
      })
    }

    // Compute bounding box and sphere
    const box = new Box3().setFromObject(model)
    box.getCenter(bounds.center)
    const sphere = box.getBoundingSphere(new Sphere())
    bounds.radius = sphere.radius || 1
    bounds.min.copy(box.min)
    bounds.max.copy(box.max)

    // Position contact shadow plane and light
    if (enableShadows && shadowPlane && dirLight) {
      shadowPlane.position.set(bounds.center.x, box.min.y - 0.001, bounds.center.z)
      const planeScale = bounds.radius * 6
      shadowPlane.scale.set(planeScale, planeScale, 1)

      const lightDist = bounds.radius * 3
      dirLight.position.set(
        bounds.center.x + lightDist * 0.5,
        bounds.center.y + lightDist,
        bounds.center.z + lightDist * 0.7,
      )
      dirLight.target.position.copy(bounds.center)

      dirLight.shadow.camera.left = -bounds.radius * 2
      dirLight.shadow.camera.right = bounds.radius * 2
      dirLight.shadow.camera.top = bounds.radius * 2
      dirLight.shadow.camera.bottom = -bounds.radius * 2
      dirLight.shadow.camera.near = 0.1
      dirLight.shadow.camera.far = lightDist * 4
      dirLight.shadow.camera.updateProjectionMatrix()
      renderer.shadowMap.needsUpdate = true
    }

    // biome-ignore lint/suspicious/noFocusedTests: internal method to auto-frame camera to model bounds
    fit()
    emit('load', model)
  }

  let dracoLoader: DRACOLoader | null = null

  async function load(src: string | Object3D): Promise<Object3D> {
    if (typeof src !== 'string') {
      setupLoadedModel(src)
      return src
    }

    // Only models compressed with Draco need its loader, so only they download it.
    if (options.dracoPath && !dracoLoader) {
      const { DRACOLoader } = await import('three/examples/jsm/loaders/DRACOLoader.js')
      dracoLoader = new DRACOLoader()
      dracoLoader.setDecoderPath(options.dracoPath)
    }

    return new Promise<Object3D>((resolve, reject) => {
      const loader = new GLTFLoader()
      loader.setMeshoptDecoder(MeshoptDecoder)
      if (dracoLoader) loader.setDRACOLoader(dracoLoader)

      loader.load(
        src,
        (gltf) => {
          setupLoadedModel(gltf.scene)
          resolve(gltf.scene)
        },
        (xhr) => {
          if (xhr.lengthComputable && xhr.total > 0) {
            emit('progress', xhr.loaded / xhr.total)
          }
        },
        (err) => {
          const error = err instanceof Error ? err : new Error(String(err))
          emit('error', error)
          reject(error)
        },
      )
    })
  }

  // Auto-load initial src if provided
  if (options.src) {
    load(options.src).catch(() => {})
  }

  const originalDispose = stage.dispose
  function disposeViewer(): void {
    unsubscribeFrame()
    controls.dispose()
    if (dracoLoader) {
      dracoLoader.dispose()
      dracoLoader = null
    }
    if (currentModel) {
      disposeObject(currentModel)
      currentModel = null
    }
    if (shadowPlane) {
      disposeObject(shadowPlane)
    }
    if (envTexture) {
      envTexture.dispose()
    }
    if (roomEnv) {
      disposeObject(roomEnv)
    }
    if (pmremGenerator) {
      pmremGenerator.dispose()
    }
    originalDispose()
  }

  return {
    ...stage,
    controls,
    load,
    fit,
    resetView,
    setView,
    zoom,
    setAutoRotate,
    setWireframe,
    setBackground,
    screenshot,
    getModel: () => currentModel,
    getBounds: () => bounds,
    dispose: disposeViewer,
  }
}
