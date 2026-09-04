import { FileIcon, LayersIcon, PaletteIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/ui/button'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  useCommandShortcut,
} from '@/ui/command'

const pages = [
  { icon: <FileIcon />, label: 'Introduction' },
  { icon: <LayersIcon />, label: 'Components' },
  { icon: <PaletteIcon />, label: 'Theming' },
]

export default function CommandDialogDemo() {
  const [open, setOpen] = useState(false)
  const [last, setLast] = useState<string | null>(null)
  useCommandShortcut(() => setOpen((o) => !o))

  return (
    <div className="flex flex-col items-center gap-3">
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open the palette
        <kbd className="ml-1 rounded border bg-muted px-1.5 font-mono text-[10px]">⌘K</kbd>
      </Button>
      <p className="text-muted-foreground text-sm">
        {last ? `Went to ${last}.` : 'The shortcut works anywhere on the page.'}
      </p>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search the docs…" />
        <CommandList>
          <CommandEmpty>Nothing matches that.</CommandEmpty>
          <CommandGroup heading="Pages">
            {pages.map((page) => (
              <CommandItem
                key={page.label}
                onSelect={(value) => {
                  setLast(value)
                  setOpen(false)
                }}
              >
                {page.icon}
                {page.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  )
}
