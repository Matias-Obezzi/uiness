import { AnimatedTooltip } from '@/ui/animated-tooltip'

const people = [
  { id: 1, name: 'Ines Duarte', title: 'Design', image: '/img/gallery-1.png' },
  { id: 2, name: 'Kofi Mensah', title: 'Engineering', image: '/img/gallery-2.png' },
  { id: 3, name: 'Hana Sato', title: 'Research', image: '/img/gallery-3.png' },
  { id: 4, name: 'Mateo Ruiz', title: 'Product', image: '/img/gallery-4.png' },
  { id: 5, name: 'Elif Yilmaz', title: 'Support', image: '/img/gallery-5.png' },
]

export default function AnimatedTooltipDemo() {
  return <AnimatedTooltip items={people} />
}
