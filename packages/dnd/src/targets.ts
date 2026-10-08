'use client'

import * as React from 'react'
import { type Point, pointInRect, rectFrom } from './core'

export interface DropTargetOptions {
  /** Name handed to the draggable that lands here. */
  id: string
  /** Which draggables may land here, by their id. Default every one. */
  accepts?: (draggableId: string) => boolean
  /** A draggable was dropped here. */
  onDrop?: (draggableId: string) => void
  disabled?: boolean
}

export interface DropTargetResult {
  /** A draggable that may land here is over it now. */
  isOver: boolean
  /** Put it on the element that receives drops. */
  ref: (node: HTMLElement | null) => void
}

export interface Target {
  id: string
  node: HTMLElement | null
  options: { current: DropTargetOptions }
  setOver: (over: boolean) => void
}

// Module wide, so a `useDraggable` anywhere on the page finds the targets without a provider.
const targets = new Set<Target>()

/** The target under `point` that takes `draggableId`, the innermost when they nest. */
export function targetAt(point: Point, draggableId: string): Target | null {
  let found: Target | null = null
  for (const target of targets) {
    const { node, options } = target
    if (!node || options.current.disabled) continue
    if (options.current.accepts && !options.current.accepts(draggableId)) continue
    if (!pointInRect(point, rectFrom(node))) continue
    // A target inside another is the more specific one.
    if (!found?.node || found.node.contains(node)) found = target
  }
  return found
}

/**
 * A place a `useDraggable` element can be dropped on, like a trash can or a folder. The
 * draggable is over it when its center is; `onDrop` gets the draggable's `id`.
 */
export function useDropTarget(options: DropTargetOptions): DropTargetResult {
  const [isOver, setOver] = React.useState(false)
  const optionsRef = React.useRef(options)
  optionsRef.current = options
  const target = React.useRef<Target | null>(null)
  if (!target.current) target.current = { id: options.id, node: null, options: optionsRef, setOver }
  target.current.id = options.id

  React.useEffect(() => {
    const entry = target.current as Target
    targets.add(entry)
    return () => {
      targets.delete(entry)
    }
  }, [])

  const ref = React.useCallback((node: HTMLElement | null) => {
    if (target.current) target.current.node = node
  }, [])

  return { isOver, ref }
}
