import { Meteors } from '@/ui/meteors'

export default function MeteorsDemo() {
  return (
    <div className="relative flex h-72 w-full items-center justify-center overflow-hidden rounded-xl border bg-neutral-950 text-white">
      <Meteors count={24} color="#fff" />
      <div className="relative text-center">
        <h2 className="font-bold text-3xl tracking-tight">Shooting stars</h2>
        <p className="mt-2 text-neutral-400">Each one has its own speed and delay.</p>
      </div>
    </div>
  )
}
