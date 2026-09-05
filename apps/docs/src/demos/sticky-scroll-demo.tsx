import { StickyScroll } from '@/ui/sticky-scroll'

const panel = (label: string, className: string) => (
  <div
    className={`flex size-full items-center justify-center rounded-xl text-2xl font-semibold text-white ${className}`}
  >
    {label}
  </div>
)

const items = [
  {
    title: 'Write the sections',
    description:
      'Each one is plain text, as long or short as you need. The panel on the right follows.',
    content: panel('One', 'bg-linear-to-br from-cyan-500 to-emerald-500'),
  },
  {
    title: 'The panel swaps',
    description:
      'When a section crosses the middle of the screen its content fades into the panel.',
    content: panel('Two', 'bg-linear-to-br from-pink-500 to-indigo-500'),
  },
  {
    title: 'Nothing to wire',
    description: 'The active section comes from @uiness/scroll, measured once per frame.',
    content: panel('Three', 'bg-linear-to-br from-orange-500 to-yellow-500'),
  },
]

export default function StickyScrollDemo() {
  return <StickyScroll items={items} className="w-full" sectionClassName="min-h-[50vh]" />
}
