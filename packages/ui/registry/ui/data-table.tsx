'use client'

import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsUpDownIcon,
  CirclePlusIcon,
  InboxIcon,
  SearchIcon,
  SearchXIcon,
  XIcon,
} from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface DataTableColumn<T> {
  /** Unique id. Also the key read from each row when there is no `accessor`. */
  id: string
  /** Header content. */
  header: React.ReactNode
  /**
   * The column's name where the header is not plain text, such as an icon: it labels the
   * value in the card layout.
   */
  label?: string
  /** Key of the value in the row, or a function that reads it. Defaults to `row[id]`. */
  accessor?: keyof T | ((row: T) => unknown)
  /** Renders the cell. Defaults to the value as text. */
  cell?: (row: T, value: unknown) => React.ReactNode
  /** Click the header to sort; shift click to add it to the sort. Default false. */
  sortable?: boolean
  /** Custom order for this column. Defaults to numbers, dates, then text in natural order. */
  compare?: (a: T, b: T) => number
  /** Alignment of the header and cells. Numbers read best on the right. Default `left`. */
  align?: 'left' | 'center' | 'right'
  /** Include this column in the search. Default true. */
  searchable?: boolean
  /** Classes for the cells of this column, like a width. */
  className?: string
  /**
   * Its place on a card, when the table turns into cards in a narrow container: `title`,
   * bold at the top (default for the first column); `badge`, at the top right, for a status;
   * `field`, a label over the value (the default); `actions`, the card's footer (default for a
   * column with the id `actions`); or `hidden`.
   */
  card?: 'title' | 'badge' | 'field' | 'actions' | 'hidden'
}

export interface DataTableFilter {
  /** Id of the column whose values are filtered. */
  column: string
  /** Name on the filter button. */
  title: string
  /** The choices. Defaults to every distinct value in the column. */
  options?: { value: string; label?: React.ReactNode }[]
}

export interface DataTableSort {
  /** Column id. */
  id: string
  /** Descending order. */
  desc: boolean
}

export interface DataTableLabels {
  /** Placeholder of the search field, also its name without the ellipsis. */
  search: string
  reset: string
  resetFilters: string
  /** Shown when nothing matches. */
  empty: string
  selectAll: string
  /** Name of a row's checkbox, from the text of its first column. */
  selectRow: (name?: string) => string
  /** Tooltip of a sortable header. */
  sortHint: string
  /** The count under the table. `total` is there while filtering. */
  results: (count: number, total?: number) => string
  /** The count under the table while rows are selected. */
  selected: (count: number, total: number) => string
  /** Name of the page controls. */
  pages: string
  pageOf: (page: number, count: number) => string
  previousPage: string
  nextPage: string
  /** On a filter button with more than two values picked. */
  filterSelected: (count: number) => string
  clearFilter: string
}

export const defaultDataTableLabels: DataTableLabels = {
  search: 'Search…',
  reset: 'Reset',
  resetFilters: 'Reset filters',
  empty: 'No results.',
  selectAll: 'Select all rows',
  selectRow: (name) => `Select ${name || 'row'}`,
  sortHint: 'Click to sort, shift click to sort by several columns',
  results: (count, total) =>
    `${count} ${count === 1 ? 'result' : 'results'}${total === undefined ? '' : ` of ${total}`}`,
  selected: (count, total) => `${count} of ${total} selected`,
  pages: 'Pages',
  pageOf: (page, count) => `Page ${page} of ${count}`,
  previousPage: 'Previous page',
  nextPage: 'Next page',
  filterSelected: (count) => `${count} selected`,
  clearFilter: 'Clear filter',
}

export interface DataTableProps<T> extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** The rows. */
  data: T[]
  /** What to show of each row, in order. */
  columns: DataTableColumn<T>[]
  /** Stable id of a row, for selection. Defaults to `row.id`, or the index. */
  getRowId?: (row: T, index: number) => string
  /** Faceted filters in the toolbar, one button each. */
  filters?: DataTableFilter[]
  /** A search field over the searchable columns. Default true. */
  searchable?: boolean
  /** Placeholder of the search field. Default "Search…". */
  searchPlaceholder?: string
  /** Sort on the first render. */
  defaultSort?: DataTableSort[]
  /** A checkbox on each row and one in the header for every filtered row. Default false. */
  selectable?: boolean
  /** Selected row ids, to control the selection. */
  selection?: string[]
  /** Called with the selected row ids when they change. */
  onSelectionChange?: (ids: string[]) => void
  /** Rows per page; `false` shows them all. Default 10. */
  pageSize?: number | false
  /** Keep the header in view while the rows scroll. Give `containerClassName` a max height. Default true. */
  stickyHeader?: boolean
  /** Classes for the box that scrolls, like `max-h-96`. */
  containerClassName?: string
  /** Shown when nothing matches. Default "No results." */
  empty?: React.ReactNode
  /** Draw placeholder rows while the data loads. Default false. */
  loading?: boolean
  /**
   * `responsive` turns the rows into cards when the table's container is narrower than 576px,
   * so nothing scrolls sideways; `table` and `cards` keep one layout. Default `responsive`.
   */
  layout?: 'responsive' | 'table' | 'cards'
  /** Extra controls at the end of the toolbar, like an export button. */
  toolbar?: React.ReactNode
  /** Names the table for screen readers, and shows under it. */
  caption?: React.ReactNode
  /** Words to use instead of the English ones. A `LabelsProvider` sets them for the whole app. */
  labels?: Partial<DataTableLabels>
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

function compareValues(a: unknown, b: unknown) {
  // Missing values sink to the end in either direction, so they are compared by the caller.
  if (typeof a === 'number' && typeof b === 'number') return a - b
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime()
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b)
  return collator.compare(String(a), String(b))
}

const isMissing = (v: unknown) => v === null || v === undefined || v === ''

function readValue<T>(row: T, column: DataTableColumn<T>): unknown {
  const { accessor, id } = column
  if (typeof accessor === 'function') return accessor(row)
  return (row as Record<PropertyKey, unknown>)[accessor ?? id]
}

const asText = (v: unknown) =>
  v instanceof Date ? v.toLocaleDateString() : isMissing(v) ? '' : String(v)

const asKeys = (v: unknown) => (Array.isArray(v) ? v.map(String) : isMissing(v) ? [] : [String(v)])

const alignClass = { left: 'text-left', center: 'text-center', right: 'text-right' }

type CardPlace = NonNullable<DataTableColumn<unknown>['card']>

// The card layout, by the width of the table's container (`@container/dt` on the root). Each
// class is written out in full, as Tailwind finds classes in the source.
const responsive = {
  container: '@max-xl/dt:rounded-none @max-xl/dt:border-0',
  table: '@max-xl/dt:flex @max-xl/dt:flex-col @max-xl/dt:gap-3',
  caption: '@max-xl/dt:order-last @max-xl/dt:border-0 @max-xl/dt:py-0',
  header:
    '@max-xl/dt:block @max-xl/dt:[&_th]:static @max-xl/dt:[&_th]:bg-transparent @max-xl/dt:[&_th]:shadow-none',
  headerRow:
    '@max-xl/dt:-m-1 @max-xl/dt:flex @max-xl/dt:items-center @max-xl/dt:gap-2 @max-xl/dt:overflow-x-auto @max-xl/dt:border-0 @max-xl/dt:p-1 @max-xl/dt:[scrollbar-width:none]',
  // Sortable headers stay, as one row of sort buttons over the cards that scrolls sideways on
  // its own; the rest are read, not seen.
  sortHead: '@max-xl/dt:block @max-xl/dt:h-auto @max-xl/dt:shrink-0 @max-xl/dt:p-0',
  plainHead: '@max-xl/dt:sr-only',
  sortButton:
    '@max-xl/dt:mx-0 @max-xl/dt:min-h-9 @max-xl/dt:flex-row @max-xl/dt:rounded-full @max-xl/dt:border @max-xl/dt:px-3 @max-xl/dt:font-normal',
  selectHead:
    '@max-xl/dt:me-auto @max-xl/dt:block @max-xl/dt:h-auto @max-xl/dt:w-auto @max-xl/dt:shrink-0 @max-xl/dt:p-0',
  selectText: 'hidden @max-xl/dt:inline',
  body: '@max-xl/dt:grid @max-xl/dt:gap-3 @max-xl/dt:[&_tr:last-child]:border',
  row: '@max-xl/dt:relative @max-xl/dt:grid @max-xl/dt:grid-cols-2 @max-xl/dt:gap-x-4 @max-xl/dt:gap-y-3 @max-xl/dt:rounded-lg @max-xl/dt:border @max-xl/dt:p-4',
  cell: '@max-xl/dt:block @max-xl/dt:min-w-0 @max-xl/dt:whitespace-normal @max-xl/dt:break-words @max-xl/dt:p-0 @max-xl/dt:text-left',
  selectCell:
    '@max-xl/dt:absolute @max-xl/dt:top-5 @max-xl/dt:left-4 @max-xl/dt:w-auto @max-xl/dt:p-0',
  fullWidth: '@max-xl/dt:col-span-2',
  place: {
    title:
      '@max-xl/dt:col-start-1 @max-xl/dt:row-start-1 @max-xl/dt:self-center @max-xl/dt:font-semibold @max-xl/dt:text-base',
    badge:
      '@max-xl/dt:col-start-2 @max-xl/dt:row-start-1 @max-xl/dt:self-start @max-xl/dt:justify-self-end',
    field:
      '@max-xl/dt:before:mb-0.5 @max-xl/dt:before:block @max-xl/dt:before:text-muted-foreground @max-xl/dt:before:text-xs @max-xl/dt:before:content-[attr(data-label)]',
    actions:
      '@max-xl/dt:col-span-2 @max-xl/dt:-mx-4 @max-xl/dt:-mb-4 @max-xl/dt:flex @max-xl/dt:flex-wrap @max-xl/dt:justify-end @max-xl/dt:gap-2 @max-xl/dt:border-t @max-xl/dt:px-4 @max-xl/dt:py-2',
    hidden: '@max-xl/dt:hidden',
  } satisfies Record<CardPlace, string>,
}

/** The column's place on a card. */
const placeOf = <T,>(column: DataTableColumn<T>, index: number): CardPlace =>
  column.card ?? (index === 0 ? 'title' : column.id === 'actions' ? 'actions' : 'field')

/** The text that labels a column's values on a card. */
const labelOf = <T,>(column: DataTableColumn<T>) =>
  column.label ?? (typeof column.header === 'string' ? column.header : column.id)

/**
 * A ready-made table on `table`: typed columns, sorting by one column or several with shift,
 * a toolbar with search and faceted filters, row selection, pages and an empty state. Holds its
 * own state, with no table library behind it.
 */
function DataTable<T>({
  data,
  columns,
  getRowId,
  filters = [],
  searchable = true,
  searchPlaceholder: searchProp,
  defaultSort = [],
  selectable = false,
  selection: selectionProp,
  onSelectionChange,
  pageSize = 10,
  stickyHeader = true,
  containerClassName,
  empty,
  loading = false,
  layout = 'responsive',
  toolbar,
  caption,
  labels: labelsProp,
  className,
  ...props
}: DataTableProps<T>) {
  const labels = useLabels('data-table', defaultDataTableLabels, labelsProp)
  const searchPlaceholder = searchProp ?? labels.search
  const [query, setQuery] = React.useState('')
  const [facets, setFacets] = React.useState<Record<string, ReadonlySet<string>>>({})
  const [sort, setSort] = React.useState<DataTableSort[]>(defaultSort)
  const [page, setPage] = React.useState(0)
  const [ownSelection, setOwnSelection] = React.useState<ReadonlySet<string>>(() => new Set())
  const selection = React.useMemo(
    () => (selectionProp ? new Set(selectionProp) : ownSelection),
    [selectionProp, ownSelection],
  )
  const setSelection = (next: Set<string>) => {
    if (!selectionProp) setOwnSelection(next)
    onSelectionChange?.([...next])
  }

  const byId = React.useMemo(() => new Map(columns.map((c) => [c.id, c])), [columns])
  const ids = React.useMemo(
    () =>
      data.map((row, i) => {
        if (getRowId) return getRowId(row, i)
        const id = (row as { id?: unknown })?.id
        return id === undefined || id === null ? String(i) : String(id)
      }),
    [data, getRowId],
  )

  const q = query.trim().toLowerCase()
  const searchColumns = React.useMemo(
    () => columns.filter((c) => c.searchable !== false),
    [columns],
  )

  // Rows that pass the search and every facet except `skip`, so a facet's counts show what
  // picking an option would leave.
  const passes = React.useCallback(
    (row: T, skip?: string) => {
      if (q && !searchColumns.some((c) => asText(readValue(row, c)).toLowerCase().includes(q))) {
        return false
      }
      for (const [column, picked] of Object.entries(facets)) {
        if (column === skip || !picked.size) continue
        const col = byId.get(column)
        if (!col) continue
        if (!asKeys(readValue(row, col)).some((k) => picked.has(k))) return false
      }
      return true
    },
    [q, searchColumns, facets, byId],
  )

  const filtered = React.useMemo(() => {
    const out: { row: T; id: string }[] = []
    data.forEach((row, i) => {
      if (passes(row)) out.push({ row, id: ids[i] ?? String(i) })
    })
    return out
  }, [data, ids, passes])

  const sorted = React.useMemo(() => {
    if (!sort.length) return filtered
    return [...filtered].sort((a, b) => {
      for (const { id, desc } of sort) {
        const col = byId.get(id)
        if (!col) continue
        let result: number
        if (col.compare) result = col.compare(a.row, b.row)
        else {
          const va = readValue(a.row, col)
          const vb = readValue(b.row, col)
          if (isMissing(va) || isMissing(vb)) {
            if (isMissing(va) && isMissing(vb)) continue
            return isMissing(va) ? 1 : -1
          }
          result = compareValues(va, vb)
        }
        if (result !== 0) return desc ? -result : result
      }
      return 0
    })
  }, [filtered, sort, byId])

  const size = pageSize === false ? Math.max(1, sorted.length) : pageSize
  const pageCount = Math.max(1, Math.ceil(sorted.length / size))
  const current = Math.min(page, pageCount - 1)
  const visible = sorted.slice(current * size, current * size + size)

  const onSort = (id: string, multi: boolean) => {
    setSort((prev) => {
      const existing = prev.find((s) => s.id === id)
      if (multi) {
        if (!existing) return [...prev, { id, desc: false }]
        if (!existing.desc) return prev.map((s) => (s.id === id ? { id, desc: true } : s))
        return prev.filter((s) => s.id !== id)
      }
      if (existing && prev.length === 1) return existing.desc ? [] : [{ id, desc: true }]
      return [{ id, desc: false }]
    })
    setPage(0)
  }

  const setFacet = (column: string, values: ReadonlySet<string>) => {
    setFacets((prev) => ({ ...prev, [column]: values }))
    setPage(0)
  }

  const filtering = q !== '' || Object.values(facets).some((s) => s.size > 0)
  const reset = () => {
    setQuery('')
    setFacets({})
    setPage(0)
  }

  const filteredIds = filtered.map((r) => r.id)
  const selectedInView = filteredIds.filter((id) => selection.has(id)).length
  const allState: boolean | 'indeterminate' =
    selectedInView === 0 ? false : selectedInView === filteredIds.length ? true : 'indeterminate'

  const toggleAll = () => {
    const next = new Set(selection)
    if (allState === true) for (const id of filteredIds) next.delete(id)
    else for (const id of filteredIds) next.add(id)
    setSelection(next)
  }
  const toggleRow = (id: string) => {
    const next = new Set(selection)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelection(next)
  }

  const colSpan = columns.length + (selectable ? 1 : 0)
  const showToolbar = searchable || filters.length > 0 || toolbar
  // The card classes: by the container's width, always (the same classes with no
  // condition), or never.
  const card = (classes: string) =>
    layout === 'responsive'
      ? classes
      : layout === 'cards'
        ? classes.replaceAll('@max-xl/dt:', '')
        : undefined
  const hasBadge = columns.some((c, i) => placeOf(c, i) === 'badge')
  const cellCard = (place: CardPlace) =>
    card(
      cn(
        responsive.cell,
        responsive.place[place],
        place === 'title' && !hasBadge && responsive.fullWidth,
        place === 'title' && selectable && '@max-xl/dt:ps-7',
      ),
    )

  return (
    <div
      data-slot="data-table"
      className={cn('grid w-full min-w-0 gap-3 @container/dt', className)}
      {...props}
    >
      {showToolbar && (
        <div data-slot="data-table-toolbar" className="flex flex-wrap items-center gap-2">
          {searchable && (
            <div className="relative w-full sm:w-64">
              <SearchIcon
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPage(0)
                }}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder.replace(/…$/, '')}
                className="h-8 pl-8 pointer-coarse:h-11"
              />
            </div>
          )}
          {filters.map((filter) => (
            <FacetFilter
              key={filter.column}
              filter={filter}
              data={data}
              column={byId.get(filter.column)}
              passes={(row) => passes(row, filter.column)}
              selected={facets[filter.column] ?? new Set()}
              labels={labels}
              onChange={(values) => setFacet(filter.column, values)}
            />
          ))}
          {filtering && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={reset}
              className="pointer-coarse:h-11"
            >
              {labels.reset}
              <XIcon aria-hidden />
            </Button>
          )}
          {toolbar && <div className="ml-auto flex flex-wrap items-center gap-2">{toolbar}</div>}
        </div>
      )}

      <Table
        aria-busy={loading || undefined}
        containerClassName={cn(card(responsive.container), containerClassName)}
        className={card(responsive.table)}
      >
        {caption && <TableCaption className={card(responsive.caption)}>{caption}</TableCaption>}
        <TableHeader sticky={stickyHeader} className={card(responsive.header)}>
          <TableRow className={cn('hover:bg-transparent', card(responsive.headerRow))}>
            {selectable && (
              <TableHead className={cn('w-10 pl-3', card(responsive.selectHead))}>
                <SelectLabel
                  text={layout === 'table' ? undefined : labels.selectAll}
                  textClassName={card(responsive.selectText)}
                >
                  <SelectBox
                    checked={allState}
                    onCheckedChange={toggleAll}
                    aria-label={labels.selectAll}
                    disabled={filteredIds.length === 0}
                  />
                </SelectLabel>
              </TableHead>
            )}
            {columns.map((col) => {
              const index = sort.findIndex((s) => s.id === col.id)
              const state = sort[index]
              const align = col.align ?? 'left'
              return (
                <TableHead
                  key={col.id}
                  aria-sort={
                    col.sortable
                      ? state
                        ? state.desc
                          ? 'descending'
                          : 'ascending'
                        : 'none'
                      : undefined
                  }
                  className={cn(
                    alignClass[align],
                    col.className,
                    card(col.sortable ? responsive.sortHead : responsive.plainHead),
                  )}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={(e) => onSort(col.id, e.shiftKey)}
                      title={labels.sortHint}
                      className={cn(
                        '-mx-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-1 outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:min-h-11',
                        align === 'right' && 'flex-row-reverse',
                        card(responsive.sortButton),
                      )}
                    >
                      {col.header}
                      <span className="inline-flex items-center text-muted-foreground">
                        {state ? (
                          state.desc ? (
                            <ArrowDownIcon aria-hidden className="size-3.5" />
                          ) : (
                            <ArrowUpIcon aria-hidden className="size-3.5" />
                          )
                        ) : (
                          <ChevronsUpDownIcon aria-hidden className="size-3.5 opacity-50" />
                        )}
                        {sort.length > 1 && state && (
                          <span className="ml-0.5 text-[10px] tabular-nums">{index + 1}</span>
                        )}
                      </span>
                    </button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>
        <TableBody className={card(responsive.body)}>
          {loading ? (
            Array.from({ length: Math.min(size, 5) }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: placeholders have nothing else to key on
              <TableRow key={i} className={cn('hover:bg-transparent', card(responsive.row))}>
                {selectable && (
                  <TableCell className={cn('w-10 pl-3', card(responsive.selectCell))} />
                )}
                {columns.map((col, c) => (
                  <TableCell
                    key={col.id}
                    data-label={labelOf(col)}
                    className={cn(col.className, cellCard(placeOf(col, c)))}
                  >
                    <Skeleton
                      className={cn(
                        'h-4 w-full max-w-32',
                        col.align === 'right' && 'ms-auto',
                        col.align === 'center' && 'mx-auto',
                      )}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : visible.length === 0 ? (
            <TableRow className={cn('hover:bg-transparent', card(responsive.row))}>
              <TableCell
                colSpan={colSpan}
                className={cn('p-0 whitespace-normal', card(responsive.fullWidth))}
              >
                <EmptyState
                  size="sm"
                  icon={filtering ? <SearchXIcon /> : <InboxIcon />}
                  description={empty ?? labels.empty}
                  actions={
                    filtering && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={reset}
                        className="pointer-coarse:h-11"
                      >
                        {labels.resetFilters}
                      </Button>
                    )
                  }
                />
              </TableCell>
            </TableRow>
          ) : (
            visible.map(({ row, id }) => {
              const on = selection.has(id)
              const first = columns[0]
              return (
                <TableRow
                  key={id}
                  data-state={on ? 'selected' : undefined}
                  className={card(responsive.row)}
                >
                  {selectable && (
                    <TableCell className={cn('w-10 pl-3', card(responsive.selectCell))}>
                      <SelectLabel>
                        <SelectBox
                          checked={on}
                          onCheckedChange={() => toggleRow(id)}
                          aria-label={labels.selectRow(
                            first ? asText(readValue(row, first)) || undefined : undefined,
                          )}
                        />
                      </SelectLabel>
                    </TableCell>
                  )}
                  {columns.map((col, c) => {
                    const value = readValue(row, col)
                    return (
                      <TableCell
                        key={col.id}
                        data-label={labelOf(col)}
                        className={cn(
                          alignClass[col.align ?? 'left'],
                          col.align === 'right' && 'tabular-nums',
                          col.className,
                          cellCard(placeOf(col, c)),
                        )}
                      >
                        {col.cell ? col.cell(row, value) : asText(value)}
                      </TableCell>
                    )
                  })}
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>

      <div
        data-slot="data-table-footer"
        className="flex flex-wrap items-center justify-between gap-2 text-muted-foreground text-sm"
      >
        <div aria-live="polite">
          {loading
            ? null
            : selectable && selection.size > 0
              ? labels.selected(selection.size, data.length)
              : labels.results(filtered.length, filtering ? data.length : undefined)}
        </div>
        {pageSize !== false && pageCount > 1 && (
          <nav aria-label={labels.pages} className="flex items-center gap-2">
            <span className="tabular-nums">{labels.pageOf(current + 1, pageCount)}</span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8 pointer-coarse:size-11"
              aria-label={labels.previousPage}
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8 pointer-coarse:size-11"
              aria-label={labels.nextPage}
              disabled={current >= pageCount - 1}
              onClick={() => setPage(current + 1)}
            >
              <ChevronRightIcon />
            </Button>
          </nav>
        )}
      </div>
    </div>
  )
}

/**
 * Holds a selection checkbox. On touch screens it reaches 44px around the box without moving
 * it; on cards it can show the select-all text beside it.
 */
function SelectLabel({
  text,
  textClassName,
  children,
}: {
  text?: string
  textClassName?: string
  children: React.ReactNode
}) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the checkbox passed in is the control
    <label className="inline-flex cursor-pointer items-center gap-2 align-middle pointer-coarse:-m-3.5 pointer-coarse:p-3.5">
      {children}
      {text && (
        <span
          aria-hidden="true"
          className={cn('font-normal text-muted-foreground text-sm', textClassName)}
        >
          {text}
        </span>
      )}
    </label>
  )
}

/** The checkbox with a dash for "some selected", which the plain one draws as a check. */
function SelectBox(props: React.ComponentProps<typeof Checkbox>) {
  return (
    <Checkbox
      {...props}
      className="relative data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary dark:data-[state=indeterminate]:bg-primary data-[state=indeterminate]:after:absolute data-[state=indeterminate]:after:inset-x-[3px] data-[state=indeterminate]:after:top-1/2 data-[state=indeterminate]:after:h-0.5 data-[state=indeterminate]:after:-translate-y-1/2 data-[state=indeterminate]:after:rounded-full data-[state=indeterminate]:after:bg-primary-foreground data-[state=indeterminate]:[&_svg]:hidden"
    />
  )
}

function FacetFilter<T>({
  filter,
  data,
  column,
  passes,
  selected,
  labels,
  onChange,
}: {
  filter: DataTableFilter
  data: T[]
  column: DataTableColumn<T> | undefined
  passes: (row: T) => boolean
  selected: ReadonlySet<string>
  labels: DataTableLabels
  onChange: (values: ReadonlySet<string>) => void
}) {
  const counts = new Map<string, number>()
  const all = new Set<string>()
  if (column) {
    for (const row of data) {
      const keys = asKeys(readValue(row, column))
      for (const k of keys) all.add(k)
      if (!passes(row)) continue
      for (const k of keys) counts.set(k, (counts.get(k) ?? 0) + 1)
    }
  }
  const options: { value: string; label?: React.ReactNode }[] =
    filter.options ?? [...all].sort((a, b) => collator.compare(a, b)).map((value) => ({ value }))
  const labelOf = (value: string) => options.find((o) => o.value === value)?.label ?? value

  const toggle = (value: string) => {
    const next = new Set(selected)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    onChange(next)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 border-dashed pointer-coarse:h-11"
        >
          <CirclePlusIcon aria-hidden />
          {filter.title}
          {selected.size > 0 && (
            <>
              <span aria-hidden className="mx-0.5 h-4 w-px bg-border" />
              <span className="rounded-sm bg-secondary px-1 font-normal text-secondary-foreground">
                {selected.size > 2 ? (
                  labels.filterSelected(selected.size)
                ) : (
                  <>
                    <span className="sr-only">: </span>
                    {[...selected].map((v, i) => (
                      <React.Fragment key={v}>
                        {i > 0 && ', '}
                        {labelOf(v)}
                      </React.Fragment>
                    ))}
                  </>
                )}
              </span>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-1">
        <fieldset>
          <legend className="sr-only">{filter.title}</legend>
          {options.map((option) => (
            // biome-ignore lint/a11y/noLabelWithoutControl: the checkbox inside is the control
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent pointer-coarse:min-h-11"
            >
              <Checkbox
                checked={selected.has(option.value)}
                onCheckedChange={() => toggle(option.value)}
              />
              <span className="flex-1 truncate">{option.label ?? option.value}</span>
              <span className="text-muted-foreground text-xs tabular-nums">
                {counts.get(option.value) ?? 0}
              </span>
            </label>
          ))}
        </fieldset>
        {selected.size > 0 && (
          <>
            <div className="-mx-1 my-1 h-px bg-border" />
            <button
              type="button"
              onClick={() => onChange(new Set())}
              className="w-full rounded-md px-2 py-1.5 text-center text-sm hover:bg-accent pointer-coarse:min-h-11"
            >
              {labels.clearFilter}
            </button>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}

export { DataTable }
