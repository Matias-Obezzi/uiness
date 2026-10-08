'use client'

import * as React from 'react'

/** A file's name and type, all that `accept` looks at. */
interface Named {
  name: string
  type: string
}

/**
 * Whether a file matches an `accept` list like the file input's: MIME types (`image/png`),
 * wildcards (`image/*`) and extensions (`.pdf`). An empty list takes anything.
 */
export function matchesAccept(file: Named, accept: string | string[] | undefined): boolean {
  const rules = (Array.isArray(accept) ? accept : (accept ?? '').split(','))
    .map((rule) => rule.trim().toLowerCase())
    .filter(Boolean)
  if (rules.length === 0) return true
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()
  return rules.some((rule) =>
    rule.startsWith('.')
      ? name.endsWith(rule)
      : rule.endsWith('/*')
        ? type.startsWith(rule.slice(0, -1))
        : type === rule,
  )
}

export interface DropZoneOptions {
  /** What it takes, as on a file input: `'image/*'`, `['.pdf', 'text/plain']`. Default anything. */
  accept?: string | string[]
  /** Take several files at once. Default true. */
  multiple?: boolean
  disabled?: boolean
  /** Files that match `accept`, at most one without `multiple`. */
  onDrop: (files: File[]) => void
  /** Files that did not match, or the extra ones without `multiple`. */
  onReject?: (files: File[]) => void
}

export interface DropZoneProps {
  onDragEnter: React.DragEventHandler<HTMLElement>
  onDragOver: React.DragEventHandler<HTMLElement>
  onDragLeave: React.DragEventHandler<HTMLElement>
  onDrop: React.DragEventHandler<HTMLElement>
  'data-over'?: ''
  'aria-disabled'?: true
}

export interface DropZoneInputProps {
  ref: (node: HTMLInputElement | null) => void
  type: 'file'
  hidden: true
  accept: string | undefined
  multiple: boolean
  disabled: boolean | undefined
  tabIndex: -1
  onChange: React.ChangeEventHandler<HTMLInputElement>
}

export interface DropZoneResult {
  /** Files are being dragged over the zone. */
  isOver: boolean
  /** Spread on the element that takes the drop. */
  getZoneProps: () => DropZoneProps
  /** Spread on a hidden `<input>` inside, for `open()`. */
  getInputProps: () => DropZoneInputProps
  /** Open the file picker, for a button in the zone: dropping is not the only way in. */
  open: () => void
}

const carriesFiles = (event: React.DragEvent) =>
  Array.from(event.dataTransfer?.types ?? []).includes('Files')

/**
 * Files dropped from outside the page, with a picker for those who cannot drag. Not for
 * moving things inside the page: that is `useDraggable` and `useSortable`.
 */
export function useDropZone(options: DropZoneOptions): DropZoneResult {
  const optionsRef = React.useRef(options)
  optionsRef.current = options
  const [isOver, setOver] = React.useState(false)
  // Entering a child fires enter on it before leave on the zone: count, so it does not flicker.
  const depth = React.useRef(0)
  const input = React.useRef<HTMLInputElement | null>(null)

  const take = React.useCallback((list: FileList | File[] | null | undefined) => {
    const { accept, multiple = true, onDrop, onReject } = optionsRef.current
    const files = Array.from(list ?? [])
    const fits = files.filter((file) => matchesAccept(file, accept))
    const kept = multiple ? fits : fits.slice(0, 1)
    const rejected = files.filter((file) => !kept.includes(file))
    if (kept.length > 0) onDrop(kept)
    if (rejected.length > 0) onReject?.(rejected)
  }, [])

  const getZoneProps = (): DropZoneProps => ({
    onDragEnter: (event) => {
      if (optionsRef.current.disabled || !carriesFiles(event)) return
      event.preventDefault()
      depth.current += 1
      setOver(true)
    },
    onDragOver: (event) => {
      if (optionsRef.current.disabled || !carriesFiles(event)) return
      // Without this the browser opens the file instead of handing it to the page.
      event.preventDefault()
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
    },
    onDragLeave: (event) => {
      if (!carriesFiles(event)) return
      depth.current = Math.max(0, depth.current - 1)
      if (depth.current === 0) setOver(false)
    },
    onDrop: (event) => {
      if (optionsRef.current.disabled || !carriesFiles(event)) return
      event.preventDefault()
      depth.current = 0
      setOver(false)
      take(event.dataTransfer?.files)
    },
    ...(isOver ? { 'data-over': '' as const } : null),
    ...(options.disabled ? { 'aria-disabled': true as const } : null),
  })

  const accept = Array.isArray(options.accept) ? options.accept.join(',') : options.accept
  const getInputProps = (): DropZoneInputProps => ({
    ref: (node) => {
      input.current = node
    },
    type: 'file',
    hidden: true,
    accept,
    multiple: options.multiple ?? true,
    disabled: options.disabled,
    tabIndex: -1,
    onChange: (event) => {
      take(event.currentTarget.files)
      // Picking the same file twice in a row still reports it.
      event.currentTarget.value = ''
    },
  })

  const open = React.useCallback(() => {
    if (!optionsRef.current.disabled) input.current?.click()
  }, [])

  return { isOver, getZoneProps, getInputProps, open }
}
