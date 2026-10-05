import { FileCodeIcon, FileIcon, FileTextIcon, FolderIcon, FolderOpenIcon } from 'lucide-react'
import { useState } from 'react'
import { type TreeNode, TreeView } from '@/ui/tree-view'

const files: TreeNode[] = [
  {
    id: 'app',
    label: 'app',
    children: [
      { id: 'app/layout.tsx', label: 'layout.tsx' },
      { id: 'app/page.tsx', label: 'page.tsx' },
      {
        id: 'app/settings',
        label: 'settings',
        children: [
          { id: 'app/settings/page.tsx', label: 'page.tsx' },
          { id: 'app/settings/billing.tsx', label: 'billing.tsx' },
        ],
      },
    ],
  },
  {
    id: 'components',
    label: 'components',
    children: [
      { id: 'components/button.tsx', label: 'button.tsx' },
      { id: 'components/card.tsx', label: 'card.tsx' },
      { id: 'components/tree-view.tsx', label: 'tree-view.tsx' },
    ],
  },
  { id: 'public', label: 'public', children: [{ id: 'public/logo.svg', label: 'logo.svg' }] },
  { id: 'package.json', label: 'package.json' },
  { id: 'README.md', label: 'README.md' },
]

function icon(node: TreeNode, { expanded, branch }: { expanded: boolean; branch: boolean }) {
  if (branch) return expanded ? <FolderOpenIcon /> : <FolderIcon />
  if (node.id.endsWith('.tsx')) return <FileCodeIcon />
  if (node.id.endsWith('.md')) return <FileTextIcon />
  return <FileIcon />
}

export default function TreeViewDemo() {
  const [selected, setSelected] = useState(['components/tree-view.tsx'])

  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <TreeView
        aria-label="Project files"
        data={files}
        defaultExpanded={['app', 'components']}
        selected={selected}
        onSelectedChange={setSelected}
        renderIcon={icon}
        className="rounded-lg border p-1.5"
      />
      <p className="text-muted-foreground text-xs">
        Open: <span className="font-mono text-foreground">{selected[0] ?? 'nothing'}</span>
      </p>
    </div>
  )
}
