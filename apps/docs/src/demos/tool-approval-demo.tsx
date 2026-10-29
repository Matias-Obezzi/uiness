import { useState } from 'react'
import { ToolApproval, type ToolCall } from '@/components/ui/tool-approval'

const initial: ToolCall[] = [
  {
    id: '1',
    name: 'list_files',
    args: { dir: 'src/' },
    status: 'done',
    output: 'app.ts\nroutes/\nlib/',
  },
  { id: '2', name: 'read_file', args: { path: 'src/app.ts' }, status: 'pending' },
  {
    id: '3',
    name: 'delete_branch',
    args: { branch: 'release/2025', remote: true },
    destructive: true,
    status: 'pending',
  },
]

export default function ToolApprovalDemo() {
  const [calls, setCalls] = useState(initial)
  const set = (id: string, patch: Partial<ToolCall>) =>
    setCalls((list) => list.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  return (
    <ToolApproval
      className="w-full max-w-md"
      calls={calls}
      onDeny={(id) => set(id, { status: 'denied', output: 'Denied by you.' })}
      onApprove={(id) => {
        set(id, { status: 'running' })
        setTimeout(
          () =>
            set(id, {
              status: 'done',
              output: id === '2' ? 'export const app = …' : 'Branch deleted.',
            }),
          1200,
        )
      }}
    />
  )
}
