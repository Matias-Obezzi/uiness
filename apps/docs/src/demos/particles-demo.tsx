import { Particles } from '@/components/ui/particles'

export default function ParticlesDemo() {
  return (
    <div className="relative flex h-80 w-full items-center justify-center overflow-hidden rounded-2xl border bg-neutral-950 p-8 text-white">
      <Particles quantity={80} color="#fff" mode="repel" connect={80} className="opacity-75" />
      <div className="relative text-center">
        <h3 className="font-bold text-2xl tracking-tight">Interactive Particles</h3>
        <p className="mt-2 text-neutral-400 text-sm">
          Move your cursor to repel particles and observe dynamic connections.
        </p>
      </div>
    </div>
  )
}
