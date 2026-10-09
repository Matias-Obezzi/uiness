import { StackScroll, StackScrollItem } from '@/components/ui/stack-scroll'

const steps = [
  { title: 'Plan', text: 'Write down what the page has to say, and for whom.' },
  { title: 'Design', text: 'Sketch the sections in the order a reader meets them.' },
  { title: 'Build', text: 'Compose the blocks, wire the data, ship a preview.' },
  { title: 'Launch', text: 'Share the link and watch the numbers come in.' },
]

export default function StackScrollDemo() {
  return (
    <div className="h-[28rem] w-full overflow-y-auto rounded-xl border bg-muted/30 px-6">
      <p className="py-10 text-center text-muted-foreground text-sm">Scroll inside this box</p>
      <StackScroll top={24} offset={14}>
        {steps.map((step, i) => (
          <StackScrollItem
            key={step.title}
            index={i}
            className="flex h-56 flex-col justify-between rounded-2xl border bg-card p-6 shadow-lg"
          >
            <span className="font-mono text-muted-foreground text-sm">0{i + 1}</span>
            <div>
              <p className="font-semibold text-2xl tracking-tight">{step.title}</p>
              <p className="mt-1 text-muted-foreground">{step.text}</p>
            </div>
          </StackScrollItem>
        ))}
      </StackScroll>
      <div className="h-64" />
    </div>
  )
}
