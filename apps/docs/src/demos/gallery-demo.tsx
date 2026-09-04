import { Gallery } from '@/ui/gallery'

const names = ['Dawn', 'Noon', 'Dusk', 'Night', 'Storm', 'Mist']

const images = names.map((name, i) => ({
  src: `/img/gallery-${i + 1}.png`,
  placeholder: `/img/gallery-${i + 1}-tiny.png`,
  alt: `${name} at the lake`,
  caption: `${name} at the lake`,
  width: 960,
  height: 640,
}))

export default function GalleryDemo() {
  return <Gallery images={images} columns={3} aspect="3 / 2" className="w-full max-w-2xl" />
}
