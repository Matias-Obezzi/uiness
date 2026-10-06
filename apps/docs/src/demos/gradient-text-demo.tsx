import { GradientBorder, GradientText } from '@/components/ui/gradient-text'

export default function GradientTextDemo() {
  return (
    <div className="flex w-full flex-col items-center gap-5 text-center">
      <GradientBorder className="rounded-full bg-background px-3 py-1" speed={1.5}>
        <span className="text-eyebrow text-muted-foreground uppercase">Motion, now in color</span>
      </GradientBorder>
      <h2 className="max-w-xl text-balance text-display">
        Interfaces that feel <GradientText>alive</GradientText>
      </h2>
      <p className="max-w-md text-muted-foreground">
        One gradient flowing through the words,{' '}
        <GradientText colors={['#22d3ee', '#a3e635', '#22d3ee', '#818cf8']} speed={0.6}>
          any colors you like
        </GradientText>
        , at any speed.
      </p>
    </div>
  )
}
