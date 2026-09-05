import { Button } from '@/ui/button'
import { TiltCard, TiltCardItem } from '@/ui/tilt-card'

export default function TiltCardDemo() {
  return (
    <TiltCard className="w-80 p-6">
      <TiltCardItem depth={60}>
        <h3 className="font-semibold text-xl">Tilt me</h3>
      </TiltCardItem>
      <TiltCardItem depth={40}>
        <p className="mt-2 text-muted-foreground text-sm">
          Layers at different depths move at different rates, which is what sells the 3D.
        </p>
      </TiltCardItem>
      <TiltCardItem depth={80} className="mt-6">
        <img
          src="/img/gallery-2.png"
          alt=""
          className="aspect-video w-full rounded-lg object-cover"
        />
      </TiltCardItem>
      <TiltCardItem depth={50} className="mt-6 flex justify-end">
        <Button size="sm">Try it</Button>
      </TiltCardItem>
    </TiltCard>
  )
}
