import { Stage } from '@uiness/three'
import { useRef } from 'react'
import type { Mesh } from 'three'

export default function ThreeStageDemo() {
  const knot = useRef<Mesh | null>(null)
  return (
    <div className="relative aspect-[4/3] w-full max-w-2xl overflow-hidden rounded-xl border bg-muted/20">
      <Stage
        frameloop="demand"
        onSetup={(ctx) => {
          const { THREE, scene, camera } = ctx
          camera.position.set(0, 0, 4)

          const geometry = new THREE.TorusKnotGeometry(0.9, 0.3, 128, 32)
          const material = new THREE.MeshStandardMaterial({
            color: 0x6366f1,
            roughness: 0.2,
            metalness: 0.8,
          })
          const mesh = new THREE.Mesh(geometry, material)
          knot.current = mesh
          scene.add(mesh)

          const light1 = new THREE.DirectionalLight(0xffffff, 2.5)
          light1.position.set(3, 4, 3)
          scene.add(light1)

          const light2 = new THREE.AmbientLight(0xffffff, 0.8)
          scene.add(light2)

          return () => {
            geometry.dispose()
            material.dispose()
            scene.remove(mesh)
            scene.remove(light1)
            scene.remove(light2)
          }
        }}
        onFrame={(_, delta) => {
          if (!knot.current) return
          knot.current.rotation.x += delta * 0.4
          knot.current.rotation.y += delta * 0.6
          return true
        }}
      />
    </div>
  )
}
