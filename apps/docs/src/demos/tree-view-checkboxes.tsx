import { useState } from 'react'
import { type TreeNode, TreeView } from '@/ui/tree-view'

const permissions: TreeNode[] = [
  {
    id: 'projects',
    label: 'Projects',
    children: [
      { id: 'projects.read', label: 'View projects' },
      { id: 'projects.write', label: 'Edit projects' },
      { id: 'projects.delete', label: 'Delete projects' },
    ],
  },
  {
    id: 'billing',
    label: 'Billing',
    children: [
      { id: 'billing.read', label: 'View invoices' },
      {
        id: 'billing.manage',
        label: 'Manage plan',
        children: [
          { id: 'billing.upgrade', label: 'Upgrade' },
          { id: 'billing.cancel', label: 'Cancel subscription', disabled: true },
        ],
      },
    ],
  },
  { id: 'members', label: 'Invite members' },
]

export default function TreeViewCheckboxes() {
  const [checked, setChecked] = useState(['projects.read', 'billing.read'])
  const leaves = checked.filter((id) => id.includes('.'))

  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <TreeView
        aria-label="Permissions"
        data={permissions}
        checkboxes
        checked={checked}
        onCheckedChange={setChecked}
        defaultExpanded={['projects', 'billing', 'billing.manage']}
      />
      <p className="text-muted-foreground text-xs">{leaves.length} permissions granted</p>
    </div>
  )
}
