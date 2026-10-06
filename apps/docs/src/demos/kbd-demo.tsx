import { Kbd, KbdGroup } from '@/components/ui/kbd'

const shortcuts = [
  { label: 'Search', keys: 'mod+k' },
  { label: 'Command palette', keys: 'mod+shift+p' },
  { label: 'Send', keys: 'mod+enter' },
  { label: 'Zoom in', keys: 'mod++' },
]

export default function KbdDemo() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-6">
      <ul className="grid gap-3 text-sm">
        {shortcuts.map((s) => (
          <li key={s.keys} className="flex items-center justify-between gap-4">
            {s.label}
            <KbdGroup keys={s.keys} />
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground text-sm">
        Press <Kbd>Esc</Kbd> to close, or <KbdGroup keys="up" /> <KbdGroup keys="down" /> to move.
      </p>
    </div>
  )
}
