import { FlipWords } from '@/ui/flip-words'

export default function FlipWordsDemo() {
  return (
    <p className="font-semibold text-3xl tracking-tight">
      Ship{' '}
      <FlipWords words={['beautiful', 'accessible', 'fast', 'yours']} className="text-primary" />{' '}
      interfaces.
    </p>
  )
}
