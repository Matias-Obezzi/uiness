import { Ambilight } from '@/components/ui/ambilight'

export default function AmbilightDemo() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <Ambilight blur={50} spread={1.12} intensity={0.8} saturation={1.6}>
        <img
          src="/img/gallery-1.png"
          alt="Golden hour landscape"
          className="aspect-video w-full max-w-md rounded-xl object-cover shadow-2xl"
        />
      </Ambilight>
      <p className="text-caption text-muted-foreground">
        Ambient backglow projected from content colors.
      </p>
    </div>
  )
}
