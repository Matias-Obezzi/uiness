import { AnimatedTooltip } from '@/ui/animated-tooltip'

const people = [
  { id: 1, name: 'Ada Lovelace', title: 'Analyst', image: '/img/gallery-1.png' },
  { id: 2, name: 'Grace Hopper', title: 'Compiler', image: '/img/gallery-2.png' },
  { id: 3, name: 'Alan Turing', title: 'Logic', image: '/img/gallery-3.png' },
  { id: 4, name: 'Katherine Johnson', title: 'Orbits', image: '/img/gallery-4.png' },
  { id: 5, name: 'Margaret Hamilton', title: 'Apollo', image: '/img/gallery-5.png' },
]

export default function AnimatedTooltipDemo() {
  return <AnimatedTooltip items={people} />
}
