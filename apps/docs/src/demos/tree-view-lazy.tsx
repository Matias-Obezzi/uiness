import { DatabaseIcon, TableIcon } from 'lucide-react'
import { type TreeNode, TreeView } from '@/components/ui/tree-view'

const databases: TreeNode[] = ['analytics', 'billing', 'auth'].map((name) => ({
  id: name,
  label: name,
  hasChildren: true,
}))

// Stands in for a request to your API.
async function loadTables(node: TreeNode): Promise<TreeNode[]> {
  await new Promise((resolve) => setTimeout(resolve, 900))
  return ['events', 'sessions', 'users'].map((table) => ({
    id: `${node.id}.${table}`,
    label: table,
  }))
}

export default function TreeViewLazy() {
  return (
    <TreeView
      aria-label="Databases"
      data={databases}
      loadChildren={loadTables}
      selectionMode="none"
      renderIcon={(_, { branch }) => (branch ? <DatabaseIcon /> : <TableIcon />)}
      className="w-full max-w-xs"
    />
  )
}
