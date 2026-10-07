import { Ambilight } from '@/components/ui/ambilight'

const id = 'PWgvGjAhvIw'

export default function AmbilightYoutube() {
  return (
    <div className="flex w-full justify-center py-8">
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
