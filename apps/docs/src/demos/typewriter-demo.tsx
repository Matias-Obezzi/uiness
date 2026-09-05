import { Typewriter } from '@/ui/typewriter'

export default function TypewriterDemo() {
  return (
    <p className="font-semibold text-3xl tracking-tight">
      Build{' '}
      <Typewriter
        words={['faster.', 'with less.', 'something you own.']}
        className="text-primary"
      />
    </p>
  )
}
