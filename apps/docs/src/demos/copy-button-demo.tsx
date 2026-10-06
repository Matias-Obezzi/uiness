import { CopyButton } from '@/components/ui/copy-button'

const command = 'pnpm dlx shadcn@latest add @uiness/copy-button'

export default function CopyButtonDemo() {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6">
      <div className="flex w-full items-center gap-2 rounded-lg border bg-muted/50 py-1 pr-1 pl-3">
        <code className="min-w-0 flex-1 truncate font-mono text-sm">{command}</code>
        <CopyButton value={command} tooltip label="Copy command" />
      </div>
      <CopyButton value={() => window.location.href} variant="outline" size="sm">
        Copy link
      </CopyButton>
    </div>
  )
}
