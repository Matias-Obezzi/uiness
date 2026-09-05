import { Sparkles } from '@/ui/sparkles'

export default function SparklesDemo() {
  return (
    <div className="relative flex h-72 w-full items-center justify-center overflow-hidden rounded-xl border bg-neutral-950 text-white">
      <Sparkles color="#fff" density={2} />
      <h2 className="relative font-bold text-4xl tracking-tight">Sparkles</h2>
    </div>
  )
}
