import { Quote } from 'lucide-react'
import { CardStack } from '@/components/ui/card-stack'

const testimonials = [
  {
    quote: 'We replaced three animation libraries with a handful of components we actually own.',
    name: 'Sofia Brandt',
    role: 'Staff Engineer, Kiln',
    image: '/img/gallery-1.png',
  },
  {
    quote: 'The docs read like someone cared. Installed, tweaked the classes, shipped by lunch.',
    name: 'Marcus Webb',
    role: 'Founder, Tallow & Pine',
    image: '/img/gallery-2.png',
  },
  {
    quote: 'Reduced motion is handled everywhere. That alone saved us a week of review comments.',
    name: 'Amina Diallo',
    role: 'Accessibility Lead, Lattice',
    image: '/img/gallery-3.png',
  },
  {
    quote: 'Swipe it, click it, arrow-key it. Our landing page finally feels alive.',
    name: 'Jakob Horvat',
    role: 'Design Director, Pilotlight',
    image: '/img/gallery-4.png',
  },
]

export default function CardStackDemo() {
  return (
    <CardStack aria-label="Testimonials" className="w-full max-w-sm">
      {testimonials.map((t) => (
        <figure
          key={t.name}
          className="flex h-56 flex-col justify-between rounded-2xl border bg-card p-6 shadow-lg"
        >
          <div>
            <Quote className="size-5 text-muted-foreground/60" />
            <blockquote className="mt-3 text-balance font-medium leading-snug">
              {t.quote}
            </blockquote>
          </div>
          <figcaption className="flex items-center gap-3">
            <img
              src={t.image}
              alt=""
              draggable={false}
              className="size-9 rounded-full object-cover"
            />
            <div className="text-sm">
              <p className="font-semibold">{t.name}</p>
              <p className="text-muted-foreground">{t.role}</p>
            </div>
          </figcaption>
        </figure>
      ))}
    </CardStack>
  )
}
