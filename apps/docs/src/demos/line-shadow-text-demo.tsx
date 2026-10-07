import { LineShadowText } from '@/components/ui/line-shadow-text'

export default function LineShadowTextDemo() {
  return (
    <div className="flex min-h-60 w-full items-center justify-center p-8">
      <h2 className="font-extrabold text-5xl tracking-tight sm:text-7xl">
        Ship{' '}
        <LineShadowText shadowColor="var(--primary)" className="italic">
          Fast
        </LineShadowText>
      </h2>
    </div>
  )
}
