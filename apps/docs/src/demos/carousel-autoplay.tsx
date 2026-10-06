import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
  CarouselPlayPause,
  CarouselPrevious,
} from '@/components/ui/carousel'

const photos = [
  { src: '/img/gallery-1.png', alt: 'Dawn at the lake' },
  { src: '/img/gallery-2.png', alt: 'Noon at the lake' },
  { src: '/img/gallery-3.png', alt: 'Dusk in the forest' },
  { src: '/img/gallery-4.png', alt: 'Night over the hills' },
  { src: '/img/gallery-5.png', alt: 'A storm coming in' },
]

export default function CarouselAutoplay() {
  return (
    <Carousel
      label="Photos"
      autoplay
      interval={4000}
      loop
      controls="overlay"
      className="w-full max-w-2xl"
    >
      <CarouselContent gap="0" className="rounded-2xl">
        {photos.map((photo) => (
          <CarouselItem key={photo.src} className="w-full">
            <img src={photo.src} alt={photo.alt} className="aspect-3/2 w-full object-cover" />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
      <CarouselDots />
      <CarouselPlayPause />
    </Carousel>
  )
}
