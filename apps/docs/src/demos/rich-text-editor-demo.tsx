import { useEffect, useRef, useState } from 'react'
import {
  RichTextEditor,
  type RichTextEditorHandle,
  type RichTextEditorValue,
} from '@/ui/rich-text-editor'

const start = `
<h2>Launch notes</h2>
<p>Type <code>#</code>, <code>-</code> or <code>&gt;</code> and a space at the start of a line, wrap words in <code>**</code> or <code>*</code>, or press <code>/</code> for blocks. Select text for the <strong>toolbar</strong>.</p>
<ul><li>Markdown shortcuts as you type</li><li>Pastes cleaned to the tags below</li></ul>
<blockquote>Undo and redo with Ctrl or Cmd+Z.</blockquote>
`

export default function RichTextEditorDemo() {
  const [value, setValue] = useState<RichTextEditorValue | null>(null)
  const [view, setView] = useState<'markdown' | 'html'>('markdown')
  const editor = useRef<RichTextEditorHandle>(null)

  // Show the output of the starting content before the first edit.
  useEffect(() => {
    const current = editor.current
    if (current) setValue({ html: current.getHTML(), markdown: current.getMarkdown() })
  }, [])

  return (
    <div className="flex w-full max-w-2xl flex-col gap-3">
      <RichTextEditor
        defaultValue={start}
        onChange={setValue}
        ref={editor}
        contentClassName="min-h-56"
      />
      <div className="overflow-hidden rounded-lg border bg-muted/40">
        <div className="flex items-center gap-1 border-b px-2 py-1.5">
          {(['markdown', 'html'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              aria-pressed={view === tab}
              onClick={() => setView(tab)}
              className="rounded-md px-2 py-1 font-medium text-muted-foreground text-xs hover:text-foreground aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-xs"
            >
              {tab === 'html' ? 'HTML' : 'Markdown'}
            </button>
          ))}
        </div>
        <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words p-3 font-mono text-xs leading-relaxed">
          {(view === 'html' ? value?.html : value?.markdown) || ' '}
        </pre>
      </div>
    </div>
  )
}
