import { Pattern } from '@/ui/pattern'

export default function PatternDemo() {
  return (
    <div className="grid w-full gap-4 sm:grid-cols-2">
      <div className="relative flex h-56 items-center justify-center overflow-hidden rounded-xl border">
        <Pattern />
        <span className="relative font-medium">grid</span>
      </div>
      <div className="relative flex h-56 items-center justify-center overflow-hidden rounded-xl border">
        <Pattern variant="dots" size={20} fadeAt="top left" />
        <span className="relative font-medium">dots</span>
      </div>
    </div>
  )
}
