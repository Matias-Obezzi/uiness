import { Stories, type StoryGroup } from '@/components/ui/stories'

const groups: StoryGroup[] = [
  {
    id: 'ines',
    name: 'Ines Duarte',
    avatar: '/img/gallery-1.png',
    stories: [
      { id: 'i1', src: '/img/gallery-1.png', alt: 'Hills at dusk', time: '2h' },
      { id: 'i2', src: '/img/gallery-2.png', alt: 'A quiet lake', time: '1h' },
    ],
  },
  {
    id: 'kofi',
    name: 'Kofi Mensah',
    avatar: '/img/gallery-3.png',
    stories: [
      { id: 'k1', src: '/video/text-video-background.webm', type: 'video', time: '5h' },
      {
        id: 'k2',
        time: '4h',
        content: (
          <div className="flex size-full items-center justify-center bg-linear-to-br from-indigo-500 to-fuchsia-600 p-8 text-center font-semibold text-3xl">
            Shipping the new editor today
          </div>
        ),
      },
    ],
  },
  {
    id: 'hana',
    name: 'Hana Sato',
    stories: [{ id: 'h1', src: '/img/gallery-4.png', alt: 'City lights', time: '8h' }],
  },
  {
    id: 'leo',
    name: 'Leo Park',
    stories: [{ id: 'l1', src: '/img/gallery-5.png', alt: 'Morning fog', time: '12h' }],
  },
  {
    id: 'mia',
    name: 'Mia Rossi',
    avatar: '/img/gallery-6.png',
    stories: [{ id: 'm1', src: '/img/gallery-6.png', alt: 'Desert road', time: '20h' }],
  },
]

export default function StoriesDemo() {
  return <Stories groups={groups} defaultSeen={['l1', 'm1']} className="w-full max-w-md" />
}
