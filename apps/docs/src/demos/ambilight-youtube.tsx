import { Ambilight } from '@/components/ui/ambilight'

const id = 'PWgvGjAhvIw'

export default function AmbilightYoutube() {
  return (
    // Fills the preview frame and clips there, so the glow stays inside it.
    <div className="-m-8 flex flex-1 items-center justify-center self-stretch overflow-hidden rounded-lg p-16">
      <Ambilight className="w-full max-w-xl" intensity={0.8}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}`}
          title="Outkast - Hey Ya! (Official HD Video)"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          loading="lazy"
          className="aspect-video w-full rounded-xl"
        />
      </Ambilight>
    </div>
  )
}
