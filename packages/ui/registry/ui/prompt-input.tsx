'use client'

import { ArrowUpIcon, FileIcon, PaperclipIcon, SquareIcon, WrenchIcon, XIcon } from 'lucide-react'
import * as React from 'react'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  carryEffort,
  type Model,
  type ModelChoice,
  ModelSelector,
} from '@/components/ui/model-selector'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface PromptTool {
  id: string
  label: string
  icon?: React.ReactNode
}

export interface PromptCommand {
  /** Typed after the slash: `summarize` for `/summarize`. */
  name: string
  description?: string
}

export interface PromptMessage {
  text: string
  files: File[]
  model?: ModelChoice
  /** Ids of the tools turned on. */
  tools: string[]
}

export interface PromptInputLabels {
  placeholder: string
  attach: string
  remove: (name: string) => string
  send: string
  stop: string
  tools: string
  commands: string
}

export const defaultPromptInputLabels: PromptInputLabels = {
  placeholder: 'Ask anything…',
  attach: 'Attach files',
  remove: (name) => `Remove ${name}`,
  send: 'Send',
  stop: 'Stop',
  tools: 'Tools',
  commands: 'Commands',
}

export interface PromptInputProps
  extends Omit<React.ComponentProps<'form'>, 'onSubmit' | 'children'> {
  onSubmit: (message: PromptMessage) => void
  /** While a reply streams in, the send button turns into Stop. */
  streaming?: boolean
  onStop?: () => void
  /** Models to pick from, with their effort levels. Leave out for no picker. */
  models?: Model[]
  defaultModel?: ModelChoice
  /** Tools that can be turned on, from a menu. */
  tools?: PromptTool[]
  /** Offered while the message starts with a slash. */
  commands?: PromptCommand[]
  /** Accepted file types, as for an `<input type="file">`. Leave out for no attachments. */
  accept?: string
  disabled?: boolean
  labels?: Partial<PromptInputLabels>
}

/**
 * The box a chat with an AI starts from. It grows with the text, takes files from its button,
 * a drop or a paste, offers commands after a slash, turns tools on from a menu, picks the model
 * and its effort, and sends with Enter. While the reply streams, Send turns into Stop.
 */
function PromptInput({
  onSubmit,
  streaming = false,
  onStop,
  models,
  defaultModel,
  tools = [],
  commands = [],
  accept,
  disabled = false,
  labels: labelsProp,
  className,
  ...props
}: PromptInputProps) {
  const labels = useLabels('prompt-input', defaultPromptInputLabels, labelsProp)
  const [text, setText] = React.useState('')
  const [files, setFiles] = React.useState<File[]>([])
  const [active, setActive] = React.useState<string[]>([])
  const [model, setModel] = React.useState<ModelChoice | undefined>(() => {
    const first = models?.[0]
    return (
      defaultModel ??
      (first && { model: first.id, effort: carryEffort(undefined, undefined, first) })
    )
  })
  const [dragging, setDragging] = React.useState(false)
  const [highlight, setHighlight] = React.useState(0)
  const [dismissed, setDismissed] = React.useState(false)
  const textarea = React.useRef<HTMLTextAreaElement>(null)
  const fileInput = React.useRef<HTMLInputElement>(null)
  const listId = React.useId()

  // A slash at the start, before any space, opens the commands that match it.
  const query = /^\/(\S*)$/.exec(text)?.[1]
  const matches =
    query === undefined || dismissed
      ? []
      : commands.filter((c) => c.name.toLowerCase().startsWith(query.toLowerCase()))
  const open = matches.length > 0
  const current = Math.min(highlight, matches.length - 1)

  const addFiles = (list: FileList | File[]) => {
    if (accept === undefined) return
    setFiles((prev) => [...prev, ...Array.from(list)])
  }
  const pick = (command: PromptCommand) => {
    setText(`/${command.name} `)
    textarea.current?.focus()
  }
  const canSend = (text.trim() !== '' || files.length > 0) && !disabled
  const submit = () => {
    if (!canSend || streaming) return
    onSubmit({ text: text.trim(), files, model, tools: active })
    setText('')
    setFiles([])
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (open) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        const step = event.key === 'ArrowDown' ? 1 : -1
        setHighlight((current + step + matches.length) % matches.length)
        return
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault()
        const command = matches[current]
        if (command) pick(command)
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        setDismissed(true)
        return
      }
    }
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <form
      data-slot="prompt-input"
      data-dragging={dragging || undefined}
      onSubmit={(event) => {
        event.preventDefault()
        if (streaming) onStop?.()
        else submit()
      }}
      onDragOver={(event) => {
        if (accept === undefined || !event.dataTransfer.types.includes('Files')) return
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false)
      }}
      onDrop={(event) => {
        if (accept === undefined) return
        event.preventDefault()
        setDragging(false)
        addFiles(event.dataTransfer.files)
      }}
      className={cn(
        'relative flex flex-col gap-2 rounded-2xl border bg-background p-2 shadow-xs transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 data-dragging:border-primary data-dragging:border-dashed',
        className,
      )}
      {...props}
    >
      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label={labels.commands}
          className="absolute inset-x-2 bottom-full mb-2 overflow-hidden rounded-xl border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {matches.map((command, i) => (
            <div
              key={command.name}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === current}
              tabIndex={-1}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => pick(command)}
              onKeyDown={() => {}}
              className="flex cursor-pointer items-baseline gap-2 rounded-md px-2 py-1.5 text-sm aria-selected:bg-accent"
            >
              <span className="font-medium">/{command.name}</span>
              {command.description && (
                <span className="truncate text-muted-foreground text-xs">
                  {command.description}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {(files.length > 0 || active.length > 0) && (
        <ul className="flex list-none flex-wrap gap-1.5 px-1 pt-1">
          {files.map((file, i) => (
            <Chip
              // biome-ignore lint/suspicious/noArrayIndexKey: the same file can be attached twice
              key={`${file.name}-${i}`}
              icon={<FileIcon />}
              label={file.name}
              removeLabel={labels.remove(file.name)}
              onRemove={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
            />
          ))}
          {active.map((id) => {
            const tool = tools.find((t) => t.id === id)
            if (!tool) return null
            return (
              <Chip
                key={id}
                icon={tool.icon ?? <WrenchIcon />}
                label={tool.label}
                removeLabel={labels.remove(tool.label)}
                onRemove={() => setActive((prev) => prev.filter((t) => t !== id))}
              />
            )
          })}
        </ul>
      )}

      {/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: it takes the combobox role, and these, only when there are commands */}
      <textarea
        ref={textarea}
        value={text}
        rows={1}
        disabled={disabled}
        placeholder={labels.placeholder}
        aria-label={labels.placeholder}
        // A combobox while it has commands to offer after a slash.
        role={commands.length ? 'combobox' : undefined}
        aria-autocomplete={commands.length ? 'list' : undefined}
        aria-controls={open ? listId : undefined}
        aria-expanded={commands.length ? open : undefined}
        aria-activedescendant={open ? `${listId}-${current}` : undefined}
        onChange={(event) => {
          setText(event.target.value)
          setHighlight(0)
          setDismissed(false)
        }}
        onKeyDown={onKeyDown}
        onPaste={(event) => {
          if (accept !== undefined && event.clipboardData.files.length) {
            event.preventDefault()
            addFiles(event.clipboardData.files)
          }
        }}
        className="field-sizing-content max-h-48 min-h-11 w-full resize-none bg-transparent px-2 py-1.5 text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed md:text-sm"
      />

      <div className="flex items-center gap-1">
        {accept !== undefined && (
          <>
            <input
              ref={fileInput}
              type="file"
              multiple
              accept={accept}
              hidden
              onChange={(event) => {
                if (event.target.files) addFiles(event.target.files)
                event.target.value = ''
              }}
            />
            <IconButton
              label={labels.attach}
              onClick={() => fileInput.current?.click()}
              disabled={disabled}
            >
              <PaperclipIcon />
            </IconButton>
          </>
        )}
        {tools.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <IconButton label={labels.tools} disabled={disabled}>
                <WrenchIcon />
              </IconButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>{labels.tools}</DropdownMenuLabel>
              {tools.map((tool) => (
                <DropdownMenuCheckboxItem
                  key={tool.id}
                  checked={active.includes(tool.id)}
                  onSelect={(event) => event.preventDefault()}
                  onCheckedChange={(on) =>
                    setActive((prev) =>
                      on ? [...prev, tool.id] : prev.filter((t) => t !== tool.id),
                    )
                  }
                >
                  {tool.icon}
                  {tool.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {models && models.length > 0 && (
          <ModelSelector models={models} value={model} onValueChange={setModel} />
        )}
        <button
          type="submit"
          aria-label={streaming ? labels.stop : labels.send}
          disabled={!streaming && !canSend}
          className="relative ml-auto flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground outline-none transition-[opacity,box-shadow] focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-40 pointer-coarse:after:absolute pointer-coarse:after:-inset-1.5 [&_svg]:size-4"
        >
          {streaming ? <SquareIcon className="fill-current" /> : <ArrowUpIcon />}
        </button>
      </div>
    </form>
  )
}

function Chip({
  icon,
  label,
  removeLabel,
  onRemove,
}: {
  icon: React.ReactNode
  label: string
  removeLabel: string
  onRemove: () => void
}) {
  return (
    <li className="flex max-w-56 items-center gap-1.5 rounded-lg border bg-muted/50 py-1 pr-1 pl-2 text-xs [&>svg]:size-3.5 [&>svg]:shrink-0 [&>svg]:text-muted-foreground">
      {icon}
      <span className="truncate">{label}</span>
      <button
        type="button"
        aria-label={removeLabel}
        onClick={onRemove}
        className="relative flex size-5 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:after:absolute pointer-coarse:after:-inset-3"
      >
        <XIcon aria-hidden="true" className="size-3" />
      </button>
    </li>
  )
}

function IconButton({
  label,
  className,
  ...props
}: React.ComponentProps<'button'> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        'relative flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 data-[state=open]:bg-accent pointer-coarse:after:absolute pointer-coarse:after:-inset-1.5 [&_svg]:size-4',
        className,
      )}
      {...props}
    />
  )
}

export { PromptInput }
