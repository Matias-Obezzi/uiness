import { Gallery } from '@/ui/gallery'

const names = ['Dawn', 'Noon', 'Dusk', 'Night']

const images = names.map((name, i) => ({
  src: `/img/gallery-${i + 1}.png`,
  placeholder: `/img/gallery-${i + 1}-tiny.png`,
  alt: `${name} at the lake`,
  width: 960,
  height: 640,
}))

/** Pictures only: no lightbox, a wider gap, square corners and a stronger zoom. */
export default function GalleryStatic() {
  return (
    <Gallery
      images={images}
      columns={{ base: 2, md: 4 }}
      openOnClick={false}
      gap="1rem"
      radius="0"
      zoom={1.08}
      aspect="4 / 5"
      className="max-w-2xl"
    />
  )
}
