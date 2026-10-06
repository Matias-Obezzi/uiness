import { AvatarGroup } from '@/components/ui/avatar-group'

const team = [
  { name: 'Ada Lovelace', src: '/img/gallery-1-tiny.png', description: 'Analyst' },
  { name: 'Grace Hopper', src: '/img/gallery-2-tiny.png', description: 'Compilers' },
  { name: 'Alan Turing', description: 'Logic' },
  { name: 'Katherine Johnson', src: '/img/gallery-4-tiny.png', description: 'Orbits' },
  { name: 'Margaret Hamilton', src: '/img/gallery-5-tiny.png', description: 'Apollo' },
  { name: 'Ken Thompson', description: 'Unix' },
  { name: 'Barbara Liskov', src: '/img/gallery-6-tiny.png', description: 'Abstraction' },
  { name: 'Dennis Ritchie', description: 'C' },
]

export default function AvatarGroupDemo() {
  return (
    <div className="grid justify-items-center gap-6">
      <AvatarGroup items={team} size="sm" />
      <AvatarGroup items={team} />
      <AvatarGroup items={team} size="lg" max={5} total={128} />
    </div>
  )
}
