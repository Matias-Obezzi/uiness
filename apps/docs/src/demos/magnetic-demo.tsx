import { ArrowRight, Bookmark, Heart, MessageCircle, Share2 } from 'lucide-react'
import { Button } from '@/ui/button'
import { Magnetic, MagneticInner } from '@/ui/magnetic'

const actions = [
  { label: 'Like', icon: Heart },
  { label: 'Comment', icon: MessageCircle },
  { label: 'Save', icon: Bookmark },
  { label: 'Share', icon: Share2 },
]

export default function MagneticDemo() {
  return (
    <div className="flex flex-col items-center gap-12 py-6">
      <Magnetic strength={0.3} radius={80}>
        <Button size="lg" className="h-14 rounded-full px-8 text-base shadow-lg">
          <MagneticInner factor={0.4}>
            Get started
            <ArrowRight />
          </MagneticInner>
        </Button>
      </Magnetic>
      <div className="flex items-center gap-6">
        {actions.map(({ label, icon: Icon }) => (
          <Magnetic key={label} strength={0.35} radius={28} max={10}>
            <Button
              variant="outline"
              size="icon"
              aria-label={label}
              className="size-12 rounded-full"
            >
              <MagneticInner factor={0.6}>
                <Icon className="size-5" />
              </MagneticInner>
            </Button>
          </Magnetic>
        ))}
      </div>
      <p className="text-caption text-muted-foreground">Bring the pointer close, then move away.</p>
    </div>
  )
}
