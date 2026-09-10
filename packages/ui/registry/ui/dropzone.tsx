'use client'

import { UploadCloudIcon } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'

/** Why a file was turned away. */
export type DropzoneRejectionReason = 'type' | 'size' | 'count'

export interface DropzoneRejection {
  file: File
  reason: DropzoneRejectionReason
  /** The same thing in words, ready to show. */
  message: string
}

/** `image/*`, `image/png` and `.png` all work, comma separated, the way the `accept` attribute does. */
function matchesAccept(file: File, accept: string | undefined): boolean {
  if (!accept) return true
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()
  return accept.split(',').some((raw) => {
    const entry = raw.trim().toLowerCase()
    if (!entry) return false
    if (entry.startsWith('.')) return name.endsWith(entry)
    if (entry.endsWith('/*')) return type.startsWith(entry.slice(0, -1))
    return type === entry
  })
}

function formatBytes(bytes: number): string {
  const units = ['B', 'kB', 'MB', 'GB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${Math.round(value * 10) / 10} ${units[unit]}`
}

const NO_FILES: File[] = []

/**
 * Object URLs for the images in a list, and `null` for everything else. Revoked when the list
 * changes and when the component goes away, so nothing is left holding the file in memory.
 */
function useObjectUrls(files: File[]): (string | null)[] {
  const [urls, setUrls] = React.useState<(string | null)[]>([])

  React.useEffect(() => {
    if (typeof URL.createObjectURL !== 'function') return
    const created = files.map((file) =>
      file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
    )
    setUrls(created)
    return () => {
      for (const url of created) if (url) URL.revokeObjectURL(url)
    }
  }, [files])

  return urls
}

export interface DropzoneProps
  extends Omit<
    React.ComponentProps<'div'>,
    'onDrop' | 'onDragEnter' | 'onDragOver' | 'onDragLeave'
  > {
  /** The files that made it through. */
  onFiles?: (files: File[]) => void
  /** The ones that did not, each with the reason. Never silently dropped. */
  onRejected?: (rejections: DropzoneRejection[]) => void
  /** Comma separated types or extensions, like the `accept` attribute. */
  accept?: string
  /** Take more than one file. Default false. */
  multiple?: boolean
  /** Largest file, in bytes. */
  maxSize?: number
  /** How many files at once. Only meaningful with `multiple`. */
  maxFiles?: number
  disabled?: boolean
  /** Show thumbnails of the images that were accepted. Default true. */
  preview?: boolean
  /** Shown in the middle instead of the default prompt. */
  children?: React.ReactNode
}

/**
 * A box that takes files dropped from the desktop, or opens the file picker when it is
 * clicked or when space or enter is pressed on it. This one talks to the operating system
 * through the native HTML drag and drop events, so it has nothing to do with the pointer
 * dragging the other components in this registry do.
 *
 * Files that break `accept`, `maxSize` or `maxFiles` go to `onRejected` with a reason
 * attached rather than being thrown away quietly, and every outcome is read out.
 */
function Dropzone({
  onFiles,
  onRejected,
  accept,
  multiple = false,
  maxSize,
  maxFiles,
  disabled,
  preview = true,
  className,
  children,
  ...props
}: DropzoneProps) {
  const input = React.useRef<HTMLInputElement>(null)
  const [isOver, setIsOver] = React.useState(false)
  const [accepted, setAccepted] = React.useState<File[]>([])
  const [announcement, setAnnouncement] = React.useState('')
  // dragleave also fires when the pointer crosses into a child, so entries are counted
  // instead of trusted one for one. Without this the highlight flickers over any content.
  const depth = React.useRef(0)
  const previewFiles = preview ? accepted : NO_FILES
  const urls = useObjectUrls(previewFiles)
  const descriptionId = React.useId()

  const limit = multiple ? (maxFiles ?? Number.POSITIVE_INFINITY) : 1

  const intake = (list: FileList | null) => {
    if (disabled || !list) return
    const files: File[] = []
    const rejections: DropzoneRejection[] = []

    for (const file of Array.from(list)) {
      if (!matchesAccept(file, accept)) {
        rejections.push({ file, reason: 'type', message: `${file.name} is not an accepted type.` })
        continue
      }
      if (maxSize !== undefined && file.size > maxSize) {
        rejections.push({
          file,
          reason: 'size',
          message: `${file.name} is larger than ${formatBytes(maxSize)}.`,
        })
        continue
      }
      if (files.length >= limit) {
        rejections.push({
          file,
          reason: 'count',
          message:
            limit === 1
              ? `${file.name} was not taken: only one file at a time.`
              : `${file.name} was not taken: at most ${limit} files at a time.`,
        })
        continue
      }
      files.push(file)
    }

    if (files.length > 0) {
      setAccepted(files)
      onFiles?.(files)
    }
    if (rejections.length > 0) onRejected?.(rejections)

    const taken =
      files.length > 0 ? `${files.length} file${files.length === 1 ? '' : 's'} added.` : ''
    const turned =
      rejections.length > 0
        ? `${rejections.length} file${rejections.length === 1 ? '' : 's'} rejected: ${rejections
            .map((rejection) => rejection.message)
            .join(' ')}`
        : ''
    setAnnouncement([taken, turned].filter(Boolean).join(' ') || 'No files.')
  }

  const open = () => {
    if (disabled) return
    input.current?.click()
  }

  return (
    // biome-ignore lint/a11y/useSemanticElements: a real button may not hold the file input or the previews
    <div
      data-slot="dropzone"
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled ? true : undefined}
      aria-describedby={descriptionId}
      data-over={isOver ? '' : undefined}
      {...props}
      onClick={(event) => {
        props.onClick?.(event)
        if (event.defaultPrevented) return
        // `input.click()` below bubbles back up here; without this it would loop.
        if (event.target === input.current) return
        open()
      }}
      onKeyDown={(event) => {
        props.onKeyDown?.(event)
        if (event.defaultPrevented) return
        if (event.key !== ' ' && event.key !== 'Enter') return
        // Space would scroll the page and enter would submit a surrounding form.
        event.preventDefault()
        open()
      }}
      onDragEnter={(event) => {
        event.preventDefault()
        if (disabled) return
        depth.current++
        setIsOver(true)
      }}
      onDragOver={(event) => {
        // Without this the browser navigates to the file instead of handing it over.
        event.preventDefault()
        if (!disabled && event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
      }}
      onDragLeave={(event) => {
        event.preventDefault()
        if (disabled) return
        depth.current = Math.max(0, depth.current - 1)
        if (depth.current === 0) setIsOver(false)
      }}
      onDrop={(event) => {
        event.preventDefault()
        depth.current = 0
        setIsOver(false)
        intake(event.dataTransfer?.files ?? null)
      }}
      className={cn(
        'flex w-full flex-col items-center justify-center gap-3 rounded-lg border border-input border-dashed bg-background p-6 text-center outline-none transition-colors',
        'hover:border-ring/60 hover:bg-accent/40',
        'focus-visible:ring-[3px] focus-visible:ring-ring/50',
        'data-[over]:border-ring data-[over]:bg-accent data-[over]:text-accent-foreground',
        'aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
        className,
      )}
    >
      <input
        ref={input}
        type="file"
        data-slot="dropzone-input"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        // Off the screen rather than display:none, which would take it out of the
        // accessibility tree along with it. The box above is what gets the focus.
        tabIndex={-1}
        className="sr-only"
        onChange={(event) => {
          intake(event.target.files)
          // Same file twice in a row still fires a change.
          event.target.value = ''
        }}
      />
      {children ?? (
        <>
          <UploadCloudIcon className="size-6 text-muted-foreground" aria-hidden="true" />
          <span className="font-medium text-sm">
            Drop {multiple ? 'files' : 'a file'} here, or press to choose
          </span>
        </>
      )}
      <span id={descriptionId} data-slot="dropzone-hint" className="text-muted-foreground text-xs">
        {[
          accept
            ? accept
                .split(',')
                .map((entry) => entry.trim())
                .join(', ')
            : null,
          maxSize !== undefined ? `up to ${formatBytes(maxSize)} each` : null,
          multiple && maxFiles !== undefined ? `at most ${maxFiles} files` : null,
        ]
          .filter(Boolean)
          .join(' · ') || 'Any file'}
      </span>
      {preview && accepted.length > 0 ? <DropzonePreview files={accepted} urls={urls} /> : null}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-slot="dropzone-status"
        className="sr-only"
      >
        {announcement}
      </div>
    </div>
  )
}

interface DropzonePreviewProps {
  files: File[]
  /** One entry per file: the object URL for images, `null` for everything else. */
  urls: (string | null)[]
}

/** Thumbnails of what was accepted, with a name and a size for anything that is not an image. */
function DropzonePreview({ files, urls }: DropzonePreviewProps) {
  return (
    <ul data-slot="dropzone-preview" className="flex list-none flex-wrap justify-center gap-2 p-0">
      {files.map((file, index) => {
        const url = urls[index]
        return (
          <li
            key={`${file.name}:${file.size}:${file.lastModified}`}
            className="flex w-24 flex-col items-center gap-1"
          >
            {url ? (
              <img
                src={url}
                alt={file.name}
                className="size-16 rounded-md border border-input object-cover"
              />
            ) : (
              <span
                aria-hidden="true"
                className="flex size-16 items-center justify-center rounded-md border border-input bg-muted text-muted-foreground text-xs uppercase"
              >
                {file.name.split('.').pop()?.slice(0, 4)}
              </span>
            )}
            <span className="w-full truncate text-muted-foreground text-xs" title={file.name}>
              {file.name}
            </span>
            <span className="text-muted-foreground text-xs">{formatBytes(file.size)}</span>
          </li>
        )
      })}
    </ul>
  )
}

export { Dropzone }
