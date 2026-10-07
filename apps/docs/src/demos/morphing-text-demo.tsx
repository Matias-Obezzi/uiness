import { MorphingText } from '@/components/ui/morphing-text'

const words = ['Design', 'Develop', 'Animate', 'Deliver', 'Delight']

export default function MorphingTextDemo() {
  return (
    <div className="flex min-h-60 w-full items-center justify-center p-8">
      <h2 className="font-bold text-4xl tracking-tight sm:text-6xl">
        We <MorphingText texts={words} className="font-black text-primary" />
      </h2>
    </div>
  )
}
