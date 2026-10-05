'use client'

import { CheckIcon, XIcon } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/ui/button'
import { Spinner } from '@/ui/spinner'

type MorphState = 'idle' | 'confirming' | 'pending' | 'done' | 'error'

export interface ConfirmMorphProps
  extends Omit<React.ComponentProps<'div'>, 'children' | 'onError'> {
  /** The label of the button at rest. */
  children: React.ReactNode
  /** Runs after the user confirms. While its promise is pending a spinner shows; a rejection shows the error state. */
  onConfirm: () => unknown
  /** Offers Undo in the result. Runs when it is pressed, then the button returns to rest. */
  onUndo?: () => unknown
  /** `destructive` paints the button and the confirm action red. Default `destructive`. */
  variant?: 'destructive' | 'default'
  /** Height, as on Button. Default `default`. */
  size?: 'sm' | 'default'
  /** The question asked in place. Default "Are you sure?". */
  question?: React.ReactNode
  /** Default "Confirm". */
  confirmLabel?: React.ReactNode
  /** Default "Cancel". */
  cancelLabel?: React.ReactNode
  /** Shown next to the spinner. Default "Working…". */
  pendingLabel?: string
  /** Shown once it worked. Default "Done". */
  successLabel?: string
  /** Shown when `onConfirm` rejects. Default "Something went wrong". */
  errorLabel?: string
  /** Default "Undo". */
  undoLabel?: React.ReactNode
  /** Milliseconds the result stays before returning to rest. Paused while hovered. Default 4000. */
  resetAfter?: number
  /** Stop the button from being pressed. */
  disabled?: boolean
}

/**
 * A button that asks "Are you sure?" in place instead of opening a dialog, then shows a spinner
 * while the action runs and the result, with an optional Undo. The width follows the content.
 */
function ConfirmMorph({
  children,
  onConfirm,
  onUndo,
  variant = 'destructive',
  size = 'default',
  question = 'Are you sure?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  pendingLabel = 'Working…',
  successLabel = 'Done',
  errorLabel = 'Something went wrong',
  undoLabel = 'Undo',
  resetAfter = 4000,
  disabled = false,
  className,
  onKeyDown,
  onPointerEnter,
  onPointerLeave,
  ...props
}: ConfirmMorphProps) {
  const [state, setState] = React.useState<MorphState>('idle')
  const [undoing, setUndoing] = React.useState(false)
  const outer = React.useRef<HTMLDivElement>(null)
  const inner = React.useRef<HTMLDivElement>(null)
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined)
  const hovered = React.useRef(false)
  const keepFocus = React.useRef(false)
  const mounted = React.useRef(true)
  const questionId = React.useId()

  React.useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      clearTimeout(timer.current)
    }
  }, [])

  // The outer box holds an explicit width that follows the content's, so a change of content
  // becomes a change of width the browser can transition.
  React.useLayoutEffect(() => {
    const box = outer.current
    const content = inner.current
    if (!box || !content) return
    const follow = () => {
      box.style.width = `${content.offsetWidth + box.offsetWidth - box.clientWidth}px`
    }
    follow()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(follow)
    observer.observe(content)
    return () => observer.disconnect()
  }, [])

  const move = React.useCallback((next: MorphState) => {
    if (!mounted.current) return
    // The control being pressed is about to disappear: remember to put focus back inside.
    keepFocus.current = !!outer.current?.contains(document.activeElement)
    setState(next)
  }, [])

  const scheduleReset = React.useCallback(() => {
    clearTimeout(timer.current)
    if (hovered.current) return
    timer.current = setTimeout(() => move('idle'), resetAfter)
  }, [move, resetAfter])

  React.useEffect(() => {
    if (state === 'done' || state === 'error') scheduleReset()
    else clearTimeout(timer.current)
  }, [state, scheduleReset])

  // biome-ignore lint/correctness/useExhaustiveDependencies: runs after every change of state
  React.useEffect(() => {
    if (!keepFocus.current) return
    keepFocus.current = false
    const target =
      outer.current?.querySelector<HTMLElement>('[data-autofocus]') ?? outer.current ?? null
    target?.focus()
  }, [state])

  const confirm = async () => {
    try {
      const result = onConfirm()
      if (result instanceof Promise) {
        move('pending')
        await result
      }
      move('done')
    } catch {
      move('error')
    }
  }

  const undo = async () => {
    if (!onUndo) return
    setUndoing(true)
    try {
      await onUndo()
    } finally {
      if (mounted.current) setUndoing(false)
    }
    move('idle')
  }

  const small = size === 'sm'
  const innerButton = small ? 'h-6 px-2' : 'h-7 px-2.5'

  let content: React.ReactNode
  if (state === 'idle') {
    content = (
      <button
        type="button"
        data-autofocus
        disabled={disabled}
        className={cn(
          'inline-flex h-full items-center gap-2 whitespace-nowrap font-medium outline-none disabled:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
          small ? 'px-3 text-xs' : 'px-4 text-sm',
        )}
        onClick={() => move('confirming')}
      >
        {children}
      </button>
    )
  } else if (state === 'confirming') {
    content = (
      // biome-ignore lint/a11y/useSemanticElements: a fieldset would bring its own box model
      <div role="group" aria-labelledby={questionId} className="flex items-center gap-1 px-1">
        <span id={questionId} className="whitespace-nowrap px-2 font-medium">
          {question}
        </span>
        <Button
          variant="ghost"
          size="sm"
          data-autofocus
          className={innerButton}
          onClick={() => move('idle')}
        >
          {cancelLabel}
        </Button>
        <Button variant={variant} size="sm" className={innerButton} onClick={() => void confirm()}>
          {confirmLabel}
        </Button>
      </div>
    )
  } else if (state === 'pending') {
    content = (
      <span className="flex items-center gap-2 whitespace-nowrap px-3">
        <Spinner aria-hidden="true" />
        {pendingLabel}
      </span>
    )
  } else if (state === 'done') {
    content = (
      <span
        className={cn('flex items-center gap-2 whitespace-nowrap pl-3', onUndo ? 'pr-1' : 'pr-3')}
      >
        <CheckIcon aria-hidden="true" className="size-4" />
        {successLabel}
        {onUndo && (
          <Button
            variant="ghost"
            size="sm"
            data-autofocus
            loading={undoing}
            className={cn(innerButton, 'ml-1')}
            onClick={() => void undo()}
          >
            {undoLabel}
          </Button>
        )}
      </span>
    )
  } else {
    content = (
      <span className="flex items-center gap-2 whitespace-nowrap px-3">
        <XIcon aria-hidden="true" className="size-4 text-destructive" />
        {errorLabel}
      </span>
    )
  }

  const announcement =
    state === 'pending'
      ? pendingLabel
      : state === 'done'
        ? successLabel
        : state === 'error'
          ? errorLabel
          : ''

  return (
    <>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Escape cancels the question from whichever of its buttons has focus */}
      <div
        ref={outer}
        tabIndex={-1}
        data-slot="confirm-morph"
        data-state={state}
        data-variant={variant}
        className={cn(
          'relative inline-flex shrink-0 overflow-hidden rounded-lg border text-sm outline-none transition-[width,background-color,border-color,color,box-shadow] duration-(--duration-slow,300ms) ease-(--easing-emphasized,cubic-bezier(0.16,1,0.3,1)) focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=idle]:has-[:focus-visible]:ring-[3px] data-[state=idle]:has-[:focus-visible]:ring-ring/50 motion-reduce:transition-none',
          small ? 'h-8' : 'h-9',
          state === 'idle'
            ? variant === 'destructive'
              ? 'border-transparent bg-destructive text-white shadow-xs hover:bg-destructive/90'
              : 'border-transparent bg-primary text-primary-foreground shadow-xs hover:bg-primary/90'
            : 'bg-background text-foreground shadow-xs',
          disabled && 'opacity-50',
          className,
        )}
        onKeyDown={(e) => {
          onKeyDown?.(e)
          if (e.key === 'Escape' && state === 'confirming') {
            e.preventDefault()
            move('idle')
          }
        }}
        onPointerEnter={(e) => {
          onPointerEnter?.(e)
          hovered.current = true
          clearTimeout(timer.current)
        }}
        onPointerLeave={(e) => {
          onPointerLeave?.(e)
          hovered.current = false
          if (state === 'done' || state === 'error') scheduleReset()
        }}
        {...props}
      >
        <div ref={inner} className="flex h-full w-max shrink-0 items-center">
          <div
            key={state}
            className="flex h-full items-center fade-in-0 animate-in duration-(--duration-normal,200ms)"
          >
            {content}
          </div>
        </div>
      </div>
      <span role="status" className="sr-only">
        {announcement}
      </span>
    </>
  )
}

export { ConfirmMorph }
