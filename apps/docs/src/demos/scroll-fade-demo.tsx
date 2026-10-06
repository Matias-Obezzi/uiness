import { ScrollFade } from '@/components/ui/scroll-fade'

const releases = [
  ['v2.4.0', 'Scroll fades on every edge'],
  ['v2.3.2', 'Sticky headers keep their place'],
  ['v2.3.1', 'Faster first paint in Safari'],
  ['v2.3.0', 'Right to left layouts'],
  ['v2.2.4', 'Keyboard focus stays visible'],
  ['v2.2.3', 'Smaller bundle for charts'],
  ['v2.2.2', 'Dark mode borders, softer'],
  ['v2.2.1', 'Fixed a flicker on resize'],
  ['v2.2.0', 'Drawers snap to points'],
  ['v2.1.3', 'Better screen reader labels'],
  ['v2.1.2', 'Dates in any time zone'],
  ['v2.1.1', 'Quieter console in tests'],
  ['v2.1.0', 'A new command palette'],
  ['v2.0.1', 'Upgrade notes, clearer'],
  ['v2.0.0', 'Tailwind v4 throughout'],
]

export default function ScrollFadeDemo() {
  return (
    <div className="w-full max-w-xs rounded-xl border bg-card">
      <p className="border-b px-4 py-3 font-medium text-sm">Releases</p>
      <ScrollFade className="h-64" size={48}>
        <ul className="divide-y px-4">
          {releases.map(([version, note]) => (
            <li key={version} className="flex items-baseline gap-3 py-2.5 text-sm">
              <span className="w-12 shrink-0 font-mono text-muted-foreground text-xs">
                {version}
              </span>
              {note}
            </li>
          ))}
        </ul>
      </ScrollFade>
    </div>
  )
}
