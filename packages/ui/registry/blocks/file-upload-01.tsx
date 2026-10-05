'use client'

import {
  CircleAlertIcon,
  CircleCheckIcon,
  FileIcon,
  FileImageIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FileVideoIcon,
  RotateCcwIcon,
  UploadCloudIcon,
  XIcon,
} from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/ui/button'
import { Dropzone, type DropzoneRejection } from '@/ui/dropzone'
import { Progress } from '@/ui/progress'

export type UploadStatus = 'uploading' | 'done' | 'error' | 'rejected'

export interface UploadItem {
  id: string
  name: string
  /** Bytes. */
  size: number
  type: string
  /** The picked file. Seeds have none, so they can only be retried by the simulation. */
  file?: File
  status: UploadStatus
  /** 0 to 1. */
  progress: number
  error?: string
}

/** A file already in the list when the block appears, for previews and restoring a session. */
export type UploadSeed = Omit<UploadItem, 'id' | 'file' | 'progress' | 'type'> & {
  type?: string
  progress?: number
}

export interface UploadContext {
  /** Aborted when the file is removed. Pass it to fetch or XHR. */
  signal: AbortSignal
  /** Report progress from 0 to 1. */
  onProgress: (progress: number) => void
}

/**
 * Sends one file. Either report progress through `onProgress` and resolve when done, or
 * return an async iterable that yields progress from 0 to 1. Throw to mark the file failed.
 */
export type UploadFn = (
  file: File,
  context: UploadContext,
) => Promise<unknown> | AsyncIterable<number>

export interface FileUploadLabels {
  drop: string
  browse: string
  /** `{name}` is replaced. */
  type: string
  /** `{max}` is replaced. */
  size: string
  count: string
  failed: string
  retry: string
  remove: string
  clear: string
  done: string
  /** `{done}` and `{total}` are replaced. */
  summary: string
  allDone: string
  empty: string
  files: string
}

export interface FileUpload01Props extends Omit<React.ComponentProps<'section'>, 'title'> {
  title?: React.ReactNode
  description?: React.ReactNode | null
  /** Types or extensions, comma separated, like the `accept` attribute. */
  accept?: string
  /** Largest file in bytes. Default 10 MB. */
  maxSize?: number
  /** Most files per drop. Default 10. */
  maxFiles?: number
  /** Sends a file for real. Without it uploads are simulated, which is handy for previews. */
  upload?: UploadFn
  /** Called each time a file finishes. */
  onUploaded?: (item: UploadItem) => void
  /** Files to show from the start. */
  defaultFiles?: UploadSeed[]
  labels?: Partial<FileUploadLabels>
}

const MB = 1024 * 1024

const defaultSeeds: UploadSeed[] = [
  { name: 'brand-guidelines.pdf', size: 2.4 * MB, type: 'application/pdf', status: 'done' },
  {
    name: 'launch-hero.png',
    size: 3.1 * MB,
    type: 'image/png',
    status: 'uploading',
    progress: 0.3,
  },
  {
    name: 'q3-numbers.xlsx',
    size: 820 * 1024,
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    status: 'error',
    progress: 0.6,
    error: 'The connection dropped.',
  },
  {
    name: 'demo-recording.mov',
    size: 48 * MB,
    type: 'video/quicktime',
    status: 'rejected',
    error: 'Larger than 10 MB.',
  },
]

const defaultLabels: FileUploadLabels = {
  drop: 'Drop files here',
  browse: 'or press to browse',
  type: 'This type of file is not allowed.',
  size: 'Larger than {max}.',
  count: 'Too many files at once.',
  failed: 'Upload failed. Try again.',
  retry: 'Retry',
  remove: 'Remove',
  clear: 'Clear finished',
  done: 'Uploaded',
  summary: '{done} of {total} uploaded',
  allDone: 'All files uploaded',
  empty: 'No files yet.',
  files: 'Files',
}

function formatBytes(bytes: number) {
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value >= 10 || unit === 0 ? Math.round(value) : Math.round(value * 10) / 10} ${units[unit]}`
}

function iconFor(type: string, name: string) {
  if (type.startsWith('image/')) return FileImageIcon
  if (type.startsWith('video/')) return FileVideoIcon
  if (/sheet|excel|csv/.test(type) || /\.(xlsx?|csv)$/i.test(name)) return FileSpreadsheetIcon
  if (/pdf|text|word|document/.test(type)) return FileTextIcon
  return FileIcon
}

const isAsyncIterable = (value: unknown): value is AsyncIterable<number> =>
  value != null && typeof (value as AsyncIterable<number>)[Symbol.asyncIterator] === 'function'

/**
 * Pretends to send a file: progress moves in uneven steps, a little faster for small files,
 * the way a real network does. Stops when the signal aborts.
 */
function simulate(size: number, from: number, { signal, onProgress }: UploadContext) {
  return new Promise<void>((resolve, reject) => {
    let progress = from
    const perTick = Math.min(0.2, Math.max(0.03, (0.6 * MB) / Math.max(size, 1)))
    const id = setInterval(() => {
      progress = Math.min(1, progress + perTick * (0.5 + Math.random()))
      onProgress(progress)
      if (progress >= 1) {
        clearInterval(id)
        resolve()
      }
    }, 140)
    signal.addEventListener('abort', () => {
      clearInterval(id)
      reject(signal.reason)
    })
  })
}

let counter = 0
const nextId = () => `upload-${++counter}`

/**
 * A whole upload flow around a dropzone: picked files join a list, each with its own progress,
 * failures say why and can be retried, files can be removed at any time (which cancels them),
 * and a bar on top adds it all up. Files that break the type or size rules show up with the
 * reason instead of vanishing. Uploads are simulated until you pass `upload`.
 */
function FileUpload01({
  title = 'Upload files',
  description = 'Images, PDFs and spreadsheets, up to 10 MB each.',
  accept = 'image/*,application/pdf,.csv,.xlsx',
  maxSize = 10 * MB,
  maxFiles = 10,
  upload,
  onUploaded,
  defaultFiles = defaultSeeds,
  labels: labelsProp,
  className,
  ...props
}: FileUpload01Props) {
  const labels = { ...defaultLabels, ...labelsProp }
  const headingId = React.useId()
  const listId = React.useId()
  const [items, setItems] = React.useState<UploadItem[]>(() =>
    defaultFiles.map((seed) => ({
      ...seed,
      id: nextId(),
      type: seed.type ?? '',
      progress: seed.progress ?? (seed.status === 'done' ? 1 : 0),
    })),
  )
  const [announcement, setAnnouncement] = React.useState('')
  const controllers = React.useRef(new Map<string, AbortController>())
  const itemsRef = React.useRef(items)
  itemsRef.current = items
  const uploadRef = React.useRef(upload)
  uploadRef.current = upload
  const onUploadedRef = React.useRef(onUploaded)
  onUploadedRef.current = onUploaded

  const patch = React.useCallback((id: string, next: Partial<UploadItem>) => {
    setItems((list) => list.map((item) => (item.id === id ? { ...item, ...next } : item)))
  }, [])

  const start = React.useCallback(
    async (item: UploadItem, from = 0) => {
      controllers.current.get(item.id)?.abort()
      const controller = new AbortController()
      controllers.current.set(item.id, controller)
      const { signal } = controller
      patch(item.id, { status: 'uploading', progress: from, error: undefined })
      const onProgress = (p: number) => {
        if (!signal.aborted) patch(item.id, { progress: Math.max(0, Math.min(1, p)) })
      }
      try {
        const send = uploadRef.current
        if (send) {
          // A seed has no file behind it, so there is nothing real to send again.
          if (!item.file) throw new Error(labels.failed)
          const result = send(item.file, { signal, onProgress })
          if (isAsyncIterable(result)) {
            for await (const p of result) {
              if (signal.aborted) break
              onProgress(p)
            }
          } else {
            await result
          }
        } else {
          await simulate(item.size, from, { signal, onProgress })
        }
        if (signal.aborted) return
        controllers.current.delete(item.id)
        const done = { ...item, status: 'done' as const, progress: 1, error: undefined }
        patch(item.id, done)
        setAnnouncement(`${item.name}: ${labels.done}`)
        onUploadedRef.current?.(done)
      } catch (err) {
        if (signal.aborted) return
        controllers.current.delete(item.id)
        const message = err instanceof Error && err.message ? err.message : labels.failed
        patch(item.id, { status: 'error', error: message })
        setAnnouncement(`${item.name}: ${message}`)
      }
    },
    [patch, labels.done, labels.failed],
  )

  // Seeds that were mid upload carry on from where they were. Everything stops on unmount.
  // biome-ignore lint/correctness/useExhaustiveDependencies: only on mount
  React.useEffect(() => {
    for (const item of itemsRef.current) {
      if (item.status === 'uploading') void start(item, item.progress)
    }
    const running = controllers.current
    return () => {
      for (const controller of running.values()) controller.abort()
      running.clear()
    }
  }, [])

  const add = (files: File[]) => {
    const fresh = files.map<UploadItem>((file) => ({
      id: nextId(),
      name: file.name,
      size: file.size,
      type: file.type,
      file,
      status: 'uploading',
      progress: 0,
    }))
    setItems((list) => [...fresh, ...list])
    for (const item of fresh) void start(item)
  }

  const reject = (rejections: DropzoneRejection[]) => {
    const reason = (r: DropzoneRejection) =>
      r.reason === 'type'
        ? labels.type.replace('{name}', r.file.name)
        : r.reason === 'size'
          ? labels.size.replace('{max}', formatBytes(maxSize))
          : labels.count
    setItems((list) => [
      ...rejections.map<UploadItem>((r) => ({
        id: nextId(),
        name: r.file.name,
        size: r.file.size,
        type: r.file.type,
        status: 'rejected',
        progress: 0,
        error: reason(r),
      })),
      ...list,
    ])
  }

  const remove = (id: string) => {
    controllers.current.get(id)?.abort()
    controllers.current.delete(id)
    setItems((list) => list.filter((item) => item.id !== id))
  }

  const counted = items.filter((item) => item.status !== 'rejected')
  const done = counted.filter((item) => item.status === 'done').length
  const totalBytes = counted.reduce((sum, item) => sum + item.size, 0)
  // A failed file has to start over, so what it sent before failing does not count.
  const sentBytes = counted.reduce(
    (sum, item) => sum + (item.status === 'error' ? 0 : item.size * item.progress),
    0,
  )
  const total = totalBytes ? Math.round((sentBytes / totalBytes) * 100) : 0
  const finished = items.filter((item) => item.status === 'done' || item.status === 'rejected')

  return (
    <section
      data-slot="block-file-upload-01"
      aria-labelledby={headingId}
      className={cn('@container w-full', className)}
      {...props}
    >
      <div className="mx-auto max-w-2xl px-4 py-12 @md:px-6 @3xl:py-16">
        <div className="rounded-3xl border bg-card p-4 shadow-sm @md:p-6">
          <div className="mb-5 px-1">
            <h2 id={headingId} className="text-subheading">
              {title}
            </h2>
            {description != null && (
              <p className="mt-1 text-muted-foreground text-sm">{description}</p>
            )}
          </div>

          <Dropzone
            multiple
            accept={accept}
            maxSize={maxSize}
            maxFiles={maxFiles}
            preview={false}
            onFiles={add}
            onRejected={reject}
            aria-controls={listId}
            className="group/drop gap-2 rounded-2xl bg-muted/30 py-10"
          >
            <span className="mb-1 flex size-12 items-center justify-center rounded-full border bg-background shadow-xs transition-transform duration-(--duration-normal,200ms) ease-(--easing-spring,ease-out) group-hover/drop:-translate-y-0.5 group-data-[over]/drop:-translate-y-1 group-data-[over]/drop:scale-110">
              <UploadCloudIcon aria-hidden className="size-5 text-muted-foreground" />
            </span>
            <span className="font-medium text-sm">
              {labels.drop}{' '}
              <span className="font-normal text-muted-foreground">{labels.browse}</span>
            </span>
          </Dropzone>

          {counted.length > 0 && (
            <div className="mt-6 px-1">
              <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">
                  {done === counted.length
                    ? labels.allDone
                    : labels.summary
                        .replace('{done}', String(done))
                        .replace('{total}', String(counted.length))}
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {formatBytes(sentBytes)} / {formatBytes(totalBytes)} · {total}%
                </span>
              </div>
              <Progress value={total} aria-label="Total progress" className="h-1.5" />
            </div>
          )}

          <div className="mt-6 flex items-center justify-between px-1">
            <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
              {labels.files}
            </h3>
            {finished.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="-mr-2 h-7 text-muted-foreground"
                onClick={() =>
                  setItems((list) =>
                    list.filter((item) => item.status !== 'done' && item.status !== 'rejected'),
                  )
                }
              >
                {labels.clear}
              </Button>
            )}
          </div>
          <ul id={listId} className="mt-2 flex flex-col gap-2">
            {items.length === 0 && (
              <li className="rounded-xl border border-dashed px-4 py-6 text-center text-muted-foreground text-sm">
                {labels.empty}
              </li>
            )}
            {items.map((item) => (
              <FileRow
                key={item.id}
                item={item}
                labels={labels}
                onRetry={() => void start(item)}
                onRemove={() => remove(item.id)}
              />
            ))}
          </ul>
          <div data-slot="file-upload-status" role="status" aria-live="polite" className="sr-only">
            {announcement}
          </div>
        </div>
      </div>
    </section>
  )
}

function FileRow({
  item,
  labels,
  onRetry,
  onRemove,
}: {
  item: UploadItem
  labels: FileUploadLabels
  onRetry: () => void
  onRemove: () => void
}) {
  const Icon = iconFor(item.type, item.name)
  const failed = item.status === 'error' || item.status === 'rejected'
  const percent = Math.round(item.progress * 100)
  return (
    <li
      data-status={item.status}
      className={cn(
        'flex items-center gap-3 rounded-xl border bg-background p-3 duration-(--duration-slow,300ms) animate-in fade-in-0 slide-in-from-top-1 motion-reduce:animate-none',
        failed && 'border-destructive/30 bg-destructive/5',
      )}
    >
      <span
        className={cn(
          'relative flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted/50',
          failed && 'border-destructive/30 bg-destructive/10 text-destructive',
        )}
      >
        <Icon aria-hidden className="size-4.5" />
        {item.status === 'done' && (
          <CircleCheckIcon
            aria-hidden
            className="absolute -right-1.5 -bottom-1.5 size-4.5 rounded-full bg-background text-emerald-600 duration-(--duration-slow,300ms) animate-in zoom-in-50 dark:text-emerald-400"
          />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate font-medium text-sm" title={item.name}>
            {item.name}
          </p>
          {item.status === 'uploading' && (
            <span className="shrink-0 text-muted-foreground text-xs tabular-nums">{percent}%</span>
          )}
        </div>
        {item.status === 'uploading' ? (
          <Progress
            value={percent}
            aria-label={`${item.name} progress`}
            className="mt-2 h-1.5 [&>[data-slot=progress-indicator]]:duration-(--duration-normal,200ms)"
          />
        ) : failed ? (
          <p className="mt-0.5 flex items-start gap-1 text-destructive text-xs">
            <CircleAlertIcon aria-hidden className="mt-px size-3.5 shrink-0" />
            <span className="line-clamp-2">{item.error ?? labels.failed}</span>
          </p>
        ) : (
          <p className="mt-0.5 text-muted-foreground text-xs">
            {formatBytes(item.size)} · {labels.done}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {item.status === 'error' && (
          <Button variant="outline" size="sm" onClick={onRetry} className="h-8">
            <RotateCcwIcon aria-hidden />
            <span className="sr-only @md:not-sr-only">{labels.retry}</span>
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          aria-label={`${labels.remove} ${item.name}`}
          className="size-8 text-muted-foreground hover:text-foreground"
        >
          <XIcon aria-hidden />
        </Button>
      </div>
    </li>
  )
}

export { FileUpload01 }
