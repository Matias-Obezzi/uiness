import {
  ArrowDownAZIcon,
  CopyIcon,
  FileTextIcon,
  FolderIcon,
  FolderOpenIcon,
  LockIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react'
import { useState } from 'react'
import {
  type ContextMenuAction,
  ContextMenuArea,
  ContextMenuProvider,
  type ContextMenuTarget,
  defineContextMenus,
} from '@/components/ui/context-menu'
import { toast } from '@/components/ui/toast'

interface Entry {
  id: string
  name: string
  kind: 'file' | 'folder'
}

const initial: Entry[] = [
  { id: '1', name: 'Designs', kind: 'folder' },
  { id: '2', name: 'Invoices', kind: 'folder' },
  { id: '3', name: 'roadmap.md', kind: 'file' },
  { id: '4', name: 'notes.txt', kind: 'file' },
  { id: '5', name: 'README.md', kind: 'file' },
]

let next = 6

export default function ContextMenuDemo() {
  const [entries, setEntries] = useState(initial)
  const [starred, setStarred] = useState(() => new Set(['3']))

  const add = (kind: Entry['kind']) =>
    setEntries((list) => [
      ...list,
      { id: String(next++), name: kind === 'file' ? 'untitled.md' : 'New folder', kind },
    ])
  const remove = (entry: Entry) => {
    setEntries((list) => list.filter((e) => e.id !== entry.id))
    toast(`Deleted ${entry.name}`)
  }
  const newItems: ContextMenuAction[] = [
    { label: 'File', icon: <FileTextIcon />, onSelect: () => add('file') },
    { label: 'Folder', icon: <FolderIcon />, onSelect: () => add('folder') },
  ]

  // Declared once: every file, folder and the empty space pick one of these by name.
  const menus = defineContextMenus({
    file: ({ data }: ContextMenuTarget<Entry>) => [
      { type: 'label', label: data.name },
      {
        label: 'Open',
        icon: <FolderOpenIcon />,
        shortcut: '⏎',
        onSelect: () => toast(`Opened ${data.name}`),
      },
      {
        label: 'Duplicate',
        icon: <CopyIcon />,
        shortcut: '⌘D',
        onSelect: () =>
          setEntries((list) => [
            ...list,
            { ...data, id: String(next++), name: `${data.name} copy` },
          ]),
      },
      {
        type: 'checkbox',
        label: 'Starred',
        checked: starred.has(data.id),
        onCheckedChange: (on) =>
          setStarred((set) => {
            const copy = new Set(set)
            if (on) copy.add(data.id)
            else copy.delete(data.id)
            return copy
          }),
      },
      'separator',
      {
        id: 'delete',
        label: 'Delete',
        icon: <Trash2Icon />,
        shortcut: '⌫',
        variant: 'destructive',
        onSelect: () => remove(data),
      },
    ],
    folder: ({ data }: ContextMenuTarget<Entry>) => [
      { label: 'Open', icon: <FolderOpenIcon />, onSelect: () => toast(`Opened ${data.name}`) },
      { type: 'sub', label: 'New', icon: <PlusIcon />, actions: newItems },
      {
        label: 'Rename',
        icon: <PencilIcon />,
        onSelect: () => toast(`Renaming ${data.name}`),
      },
      'separator',
      {
        label: 'Delete',
        icon: <Trash2Icon />,
        variant: 'destructive',
        onSelect: () => remove(data),
      },
    ],
    desktop: () => [
      { type: 'sub', label: 'New', icon: <PlusIcon />, actions: newItems },
      {
        label: 'Sort by name',
        icon: <ArrowDownAZIcon />,
        onSelect: () =>
          setEntries((list) => [...list].sort((a, b) => a.name.localeCompare(b.name))),
      },
    ],
  })

  return (
    <ContextMenuProvider menus={menus}>
      <div className="w-full space-y-3">
        <ContextMenuArea
          context="desktop"
          className="grid min-h-64 w-full grid-cols-3 content-start gap-2 rounded-xl border border-dashed p-4 sm:grid-cols-5"
        >
          {entries.map((entry) => {
            const Icon = entry.kind === 'folder' ? FolderIcon : FileTextIcon
            const locked = entry.name === 'README.md'
            return (
              <ContextMenuArea
                key={entry.id}
                asChild
                context={entry.kind}
                data={entry}
                // This one file cannot be deleted: same menu, minus an entry, plus a note.
                extend={
                  locked
                    ? (actions) => [
                        ...actions.filter((a) => !(a && a !== 'separator' && a.id === 'delete')),
                        { type: 'label', label: 'Protected' },
                      ]
                    : undefined
                }
              >
                <button
                  type="button"
                  className="flex flex-col items-center gap-1.5 rounded-lg p-3 text-center text-xs outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <span className="relative">
                    <Icon className="size-8 text-muted-foreground" strokeWidth={1.5} />
                    {locked && <LockIcon className="absolute -right-1 -bottom-1 size-3.5" />}
                    {starred.has(entry.id) && (
                      <span className="absolute -top-1 -right-1 text-[10px]">★</span>
                    )}
                  </span>
                  <span className="w-full truncate">{entry.name}</span>
                </button>
              </ContextMenuArea>
            )
          })}
        </ContextMenuArea>
        <p className="text-center text-caption text-muted-foreground">
          Right click a file, a folder or the empty space. On a phone, press and hold. With the
          keyboard, focus one and press Shift+F10.
        </p>
      </div>
    </ContextMenuProvider>
  )
}
