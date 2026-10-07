import { NoiseTexture } from '@/components/ui/noise-texture'

export default function NoiseTextureDemo() {
  return (
    <div className="relative flex h-72 w-full items-center justify-center overflow-hidden rounded-2xl border bg-gradient-to-br from-indigo-950 via-slate-900 to-neutral-950 p-8 text-white">
      <NoiseTexture opacity={0.2} animated />
      <div className="relative text-center">
        <h3 className="font-bold text-2xl tracking-tight">Film Grain Texture</h3>
        <p className="mt-2 text-neutral-300 text-sm">
          Procedural SVG turbulence filter rendered without external image assets.
        </p>
      </div>
    </div>
  )
}
