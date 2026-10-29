import { ScrollIndex } from '@/components/ui/scroll-index'

const sections = ['Overview', 'Install', 'Configure', 'Deploy', 'Monitor', 'Scale', 'Secure', 'FAQ']

export default function ScrollIndexDemo() {
  return (
    <div className="relative flex w-full gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        {sections.map((s, i) => (
          <section key={s} className="flex flex-col gap-2">
            <h3 id={`demo-${s.toLowerCase()}`} className="scroll-mt-24 font-semibold">
              {i + 1}. {s}
            </h3>
            <p className="text-muted-foreground text-sm">
              A section of a long page. Hover the rail at the side to see the headings, click one,
              or drag along the rail to scrub the page.
            </p>
          </section>
        ))}
      </div>
      <div className="w-10 shrink-0">
        <ScrollIndex
          className="sticky top-1/3"
          sections={sections.map((s) => ({ id: `demo-${s.toLowerCase()}`, label: s }))}
        />
      </div>
    </div>
  )
}
