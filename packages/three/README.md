<div align="center">

<img src="https://raw.githubusercontent.com/Matias-Obezzi/uiness/main/assets/logo.png" alt="" width="72" height="72" />

</div>

# @uiness/three

Headless Three.js viewer and stage for React. Lazy-loads Three.js only when entering the viewport, renders on demand to save battery, handles lighting and contact shadows, and provides orbit controls with animated views.

[Documentation](https://uiness.vercel.app/docs/three) · [Registry](https://uiness.vercel.app/docs/installation) · [GitHub](https://github.com/Matias-Obezzi/uiness)

```bash
pnpm add @uiness/three three
```

## Viewer

```tsx
import { Viewer } from '@uiness/three'

<Viewer
  src="/models/chair.glb"
  alt="Lounge chair"
  poster="/models/chair.webp"
  autoRotate
/>
```

Three.js is never imported on the server and only loads in the browser when the viewer approaches the viewport (`IntersectionObserver` with a 200px margin). While loading, the poster is displayed with a progress bar, then fades out smoothly once ready.

## Custom scenes with Stage

```tsx
import { Stage } from '@uiness/three'

<Stage
  onSetup={({ THREE, scene }) => {
    const geo = new THREE.TorusKnotGeometry(1, 0.3, 100, 16)
    const mat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.2 })
    const mesh = new THREE.Mesh(geo, mat)
    scene.add(mesh)
    return () => {
      geo.dispose()
      mat.dispose()
    }
  }}
  onFrame={({ scene }, dt) => {
    scene.rotation.y += dt * 0.5
    return true
  }}
/>
```

The setup callback receives `{ THREE, scene, camera, renderer, invalidate }`, so your application does not need a static import of `three` either.

## Without React

```ts
import { createViewer } from '@uiness/three/core'

const viewer = await createViewer(canvas, {
  src: '/models/chair.glb',
  autoRotate: true,
})
```

## Performance & Rendering

- **Render on demand:** The frame loop only runs while animating (auto-rotation, active damping, animated viewpoint transitions, or an active `onFrame` callback).
- **Off-screen pause:** Pauses immediately when outside the viewport or when the browser tab is hidden.
- **DPR cap:** Automatically scales up to `devicePixelRatio` capped at 2 (configurable via `maxDpr`).
- **Resource cleanup:** `dispose()` systematically traverses geometries, materials, and textures.

## With the uiness registry

Install `three-viewer` to get the ready-to-use component with a floating Radix toolbar, view switching, screenshot capture, fullscreen mode, and keyboard shortcuts:

```bash
npx shadcn@latest add @uiness/three-viewer
```
