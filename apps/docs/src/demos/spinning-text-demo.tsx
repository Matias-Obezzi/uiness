import { SparklesIcon } from 'lucide-react'
import { SpinningText } from '@/components/ui/spinning-text'

export default function SpinningTextDemo() {
  return (
    <div className="flex min-h-60 w-full items-center justify-center p-8">
      <SpinningText
        radius={4.5}
        duration={12}
        pauseOnHover
        center={<SparklesIcon className="size-6 text-primary" />}
        className="font-mono text-xs uppercase tracking-widest"
      >
        uiness • modern motion components •
      </SpinningText>
    </div>
  )
}
