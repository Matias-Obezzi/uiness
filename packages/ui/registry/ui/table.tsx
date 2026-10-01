import type * as React from 'react'
import { cn } from '@/lib/utils'

interface TableProps extends React.ComponentProps<'table'> {
  /**
   * Classes for the wrapper that draws the border and scrolls sideways. Give it a max height,
   * like `max-h-96`, to make it scroll down too: a sticky header needs that.
   */
  containerClassName?: string
}

function Table({ className, containerClassName, ...props }: TableProps) {
  return (
    <div
      data-slot="table-container"
      className={cn('relative w-full overflow-x-auto rounded-lg border', containerClassName)}
    >
      <table
        data-slot="table"
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  )
}

interface TableHeaderProps extends React.ComponentProps<'thead'> {
  /**
   * Keep the header cells in view while the rows scroll. They stick to the nearest scrolling
   * box, which is the table's own wrapper, so pair it with a max height on `containerClassName`.
   */
  sticky?: boolean
}

function TableHeader({ className, sticky = false, ...props }: TableHeaderProps) {
  return (
    <thead
      data-slot="table-header"
      data-sticky={sticky ? '' : undefined}
      className={cn(
        '[&_tr]:border-b',
        // The cells stick rather than the row: that is what works across browsers. The inset
        // shadow stands in for the row border, which scrolls away with the rows under it.
        sticky &&
          '[&_th]:sticky [&_th]:top-0 [&_th]:z-(--z-raised,10) [&_th]:bg-background [&_th]:shadow-[inset_0_-1px_0_var(--color-border)]',
        className,
      )}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return (
    <tbody
      data-slot="table-body"
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn('border-t bg-muted/50 font-medium [&>tr]:last:border-b-0', className)}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
        className,
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        'h-10 whitespace-nowrap px-2 text-left align-middle font-medium text-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        className,
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        'whitespace-nowrap p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        className,
      )}
      {...props}
    />
  )
}

function TableCaption({ className, ...props }: React.ComponentProps<'caption'>) {
  return (
    <caption
      data-slot="table-caption"
      className={cn('border-t py-3 text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow }
