import { ArrowRightIcon, SparklesIcon, ZapIcon } from 'lucide-react'
import { GradientButton } from '@/components/ui/gradient-button'

export default function GradientButtonDemo() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <GradientButton variant="emerald">
        <ZapIcon aria-hidden="true" />
        Deploy
      </GradientButton>
      <GradientButton variant="purple">
        <SparklesIcon aria-hidden="true" />
        Upgrade to Pro
      </GradientButton>
      <GradientButton variant="orange">
        Get started
        <ArrowRightIcon aria-hidden="true" />
      </GradientButton>
    </div>
  )
}
