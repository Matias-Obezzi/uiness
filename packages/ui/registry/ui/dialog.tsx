'use client'

import { XIcon } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import * as React from 'react'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface DialogLabels {
  /** Read out for the close button. */
  close: string
}

export const defaultDialogLabels: DialogLabels = {
  close: 'Close',
}

/** Carries `contentClassName` from `DialogContent` down to its `DialogBody`. */
const DialogBodyClassContext = React.createContext<string | undefined>(undefined)

function Dialog(props: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger(props: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal(props: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose(props: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'fixed inset-0 z-(--z-overlay,50) bg-black/50 backdrop-blur-[2px] duration-(--duration-normal,200ms) data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className,
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  contentClassName,
  children,
  showCloseButton = true,
  labels: labelsProp,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  /**
   * Class for the part that scrolls, the `DialogBody`, so a component that renders the whole
   * dialog can style its body from one place. `className` goes on the panel itself.
   */
  contentClassName?: string
  showCloseButton?: boolean
  /** Words to use instead of the English ones. A `LabelsProvider` sets them for the whole app. */
  labels?: Partial<DialogLabels>
}) {
  const labels = useLabels('dialog', defaultDialogLabels, labelsProp)
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          // A column no taller than the screen. With a DialogBody only the body scrolls and the
          // header and footer stay put; without one, the whole panel scrolls.
          'fixed top-[50%] left-[50%] z-(--z-overlay,50) flex max-h-[calc(100dvh-2rem)] w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] flex-col gap-4 overflow-y-auto overscroll-contain rounded-xl border bg-background p-6 shadow-lg duration-(--duration-normal,200ms) data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:max-w-lg',
          className,
        )}
        {...props}
      >
        <DialogBodyClassContext.Provider value={contentClassName}>
          {children}
        </DialogBodyClassContext.Provider>
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">{labels.close}</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex shrink-0 flex-col gap-2 text-center sm:text-left', className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn('flex shrink-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  )
}

/**
 * The part between the header and the footer that scrolls when the dialog is taller than the
 * screen. It runs edge to edge, so its scrollbar sits on the panel's border.
 */
function DialogBody({ className, ...props }: React.ComponentProps<'div'>) {
  const contentClassName = React.useContext(DialogBodyClassContext)
  return (
    <div
      data-slot="dialog-body"
      className={cn(
        '-mx-6 -my-1 min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-1',
        contentClassName,
        className,
      )}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('font-semibold text-lg leading-none', className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
