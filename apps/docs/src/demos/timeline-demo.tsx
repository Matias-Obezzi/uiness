import { Timeline, TimelineItem } from '@/ui/timeline'

const entries = [
  {
    date: 'January 2026',
    title: 'Image and Island',
    body: 'The first two packages, a loading image and a Dynamic Island for the web.',
  },
  {
    date: 'March 2026',
    title: 'Fx and the registry',
    body: 'Canvas effects, and a component registry so the code lands in your project.',
  },
  {
    date: 'June 2026',
    title: 'Toast and motion',
    body: 'Notifications, then eighteen animated pieces with no animation library.',
  },
  {
    date: 'September 2026',
    title: 'Scroll',
    body: 'Scroll-linked primitives, and the components on this page.',
  },
]

export default function TimelineDemo() {
  return (
    <Timeline className="w-full">
      {entries.map((e) => (
        <TimelineItem key={e.title} date={e.date} title={e.title}>
          <p className="max-w-prose">{e.body}</p>
        </TimelineItem>
      ))}
    </Timeline>
  )
}
