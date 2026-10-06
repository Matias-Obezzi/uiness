import { Gallery } from '@/components/ui/gallery'

const names = ['Dawn', 'Noon', 'Dusk', 'Night', 'Storm', 'Mist']

const images = names.map((name, i) => ({
  src: `/img/gallery-${i + 1}.png`,
  placeholder: `/img/gallery-${i + 1}-tiny.png`,
  alt: `${name} at the lake`,
  caption: `${name} at the lake`,
  width: 960,
  height: 640,
}))

/**
 * The same gallery twice, with the same `columns`. Columns follow the gallery's own width, so the
 * one in the narrow side column stacks while the wide one spreads out — on any screen.
 */
export default function GalleryResponsive() {
  return (
    <div className="grid w-full gap-6 sm:grid-cols-[1fr_12rem]">
      <section className="min-w-0">
        <h3 className="mb-2 font-medium text-sm">Main column</h3>
        <Gallery images={images} columns={{ base: 1, sm: 2, md: 3 }} aspect="3 / 2" />
      </section>
      <aside className="min-w-0 rounded-xl border p-3">
        <h3 className="mb-2 font-medium text-sm">Side column</h3>
        <Gallery images={images} columns={{ base: 1, sm: 2, md: 3 }} aspect="3 / 2" />
      </aside>
    </div>
  )
}
