import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable-panels'

export default function ResizablePanelsDemo() {
  return (
    <ResizablePanelGroup
      autoSaveId="docs-demo"
      className="h-72 w-full max-w-2xl rounded-lg border text-sm"
    >
      <ResizablePanel defaultSize={28} minSize={18} maxSize={45} collapsible>
        <div className="flex h-full flex-col gap-1 bg-muted/40 p-3">
          <p className="mb-1 font-medium text-muted-foreground text-xs uppercase tracking-wide">
            Files
          </p>
          {['index.tsx', 'layout.tsx', 'styles.css', 'utils.ts'].map((file) => (
            <p key={file} className="truncate rounded-md px-2 py-1 font-mono text-xs">
              {file}
            </p>
          ))}
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel>
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={65} minSize={25}>
            <div className="flex h-full items-center justify-center p-6 font-mono text-muted-foreground text-xs">
              editor
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel minSize={15} collapsible>
            <div className="flex h-full items-center justify-center bg-muted/40 p-6 font-mono text-muted-foreground text-xs">
              terminal
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
