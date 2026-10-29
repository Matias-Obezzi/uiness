'use client'

import * as React from 'react'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface SeatRow {
  /** The row's name, such as `A`. */
  id: string
  /** Each place in the row: `true` for a seat taken, `false` for one free, `null` for an aisle. */
  seats: (boolean | null)[]
}

export interface SeatMapLabels {
  /** Names the map. */
  map: string
  screen: string
  /** A seat, read out with its state. */
  seat: (row: string, number: number, state: 'available' | 'taken' | 'selected') => string
  /** Warns about seats a choice would leave alone. */
  stranded: (seats: string[]) => string
  legend: { available: string; selected: string; taken: string }
}

export const defaultSeatMapLabels: SeatMapLabels = {
  map: 'Seats',
  screen: 'Screen',
  seat: (row, number, state) =>
    `Row ${row}, seat ${number}, ${state === 'available' ? 'free' : state}`,
  stranded: (seats) =>
    seats.length === 1
      ? `Seat ${seats[0]} would be left on its own.`
      : `Seats ${seats.join(', ')} would be left on their own.`,
  legend: { available: 'Free', selected: 'Yours', taken: 'Taken' },
}

const seatId = (row: string, number: number) => `${row}${number}`

/** The seats in each row, numbered from 1 and skipping aisles, with their place in the row. */
function numbered(row: SeatRow) {
  let n = 0
  return row.seats.map((taken, place) =>
    taken === null ? null : { id: seatId(row.id, ++n), number: n, taken, place },
  )
}

/**
 * Free seats a choice would leave on their own: a seat with no free neighbour on either side,
 * an aisle or the end of the row counting as a wall, next to one just chosen.
 */
export function strandedSeats(rows: SeatRow[], selected: string[]): string[] {
  const chosen = new Set(selected)
  const out: string[] = []
  for (const row of rows) {
    const seats = numbered(row)
    seats.forEach((seat, i) => {
      if (!seat || seat.taken || chosen.has(seat.id)) return
      const left = seats[i - 1]
      const right = seats[i + 1]
      const blocked = (s: typeof seat | null | undefined) => !s || s.taken || chosen.has(s.id)
      const byChoice = (s: typeof seat | null | undefined) => !!s && chosen.has(s.id)
      if (blocked(left) && blocked(right) && (byChoice(left) || byChoice(right))) out.push(seat.id)
    })
  }
  return out
}

export interface SeatMapProps
  extends Omit<React.ComponentProps<'div'>, 'children' | 'defaultValue'> {
  rows: SeatRow[]
  /** The seats chosen, such as `['C4', 'C5']`. */
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (seats: string[]) => void
  /** How many seats can be chosen. */
  max?: number
  labels?: Partial<SeatMapLabels>
}

/**
 * Pick seats for a show. Tap a seat, or drag along a row to take several; drag from a chosen
 * seat to let them go. It points out any single seat the choice would leave stranded. On the
 * keyboard the arrows move between seats and Space or Enter takes one.
 */
function SeatMap({
  rows,
  value,
  defaultValue = [],
  onValueChange,
  max = Number.POSITIVE_INFINITY,
  labels: labelsProp,
  className,
  ...props
}: SeatMapProps) {
  const labels = useLabels('seat-map', defaultSeatMapLabels, labelsProp)
  const [own, setOwn] = React.useState(defaultValue)
  const selected = value ?? own
  const [focus, setFocus] = React.useState<string | null>(null)
  const drag = React.useRef<{ row: string; from: number; adding: boolean; base: string[] } | null>(
    null,
  )
  const grid = React.useRef<HTMLFieldSetElement>(null)
  const layout = React.useMemo(() => rows.map((row) => ({ row, seats: numbered(row) })), [rows])
  const stranded = strandedSeats(rows, selected)

  const set = (next: string[]) => {
    if (value === undefined) setOwn(next)
    onValueChange?.(next)
  }
  const toggle = (id: string) => {
    if (selected.includes(id)) set(selected.filter((s) => s !== id))
    else if (selected.length < max) set([...selected, id])
  }
  /** Chooses, or lets go of, every free seat of a row between two numbers. */
  const sweep = (rowId: string, a: number, b: number) => {
    const d = drag.current
    if (!d) return
    const seats = layout.find((l) => l.row.id === rowId)?.seats ?? []
    const [lo, hi] = a < b ? [a, b] : [b, a]
    const span = seats
      .filter(
        (s): s is NonNullable<typeof s> => !!s && !s.taken && s.number >= lo && s.number <= hi,
      )
      .map((s) => s.id)
    const next = d.adding
      ? [...d.base, ...span.filter((id) => !d.base.includes(id))].slice(
          0,
          Number.isFinite(max) ? max : undefined,
        )
      : d.base.filter((id) => !span.includes(id))
    set(next)
  }

  const first = layout.flatMap((l) => l.seats).find((s) => s && !s.taken)?.id
  const current = focus ?? selected[0] ?? first
  const move = (id: string, dr: number, dc: number) => {
    const r = layout.findIndex((l) => l.seats.some((s) => s?.id === id))
    const row = layout[r]
    const seat = row?.seats.find((s) => s?.id === id)
    if (!row || !seat) return
    let place = seat.place
    let rowIndex = r
    // Steps past aisles and on to the next seat that exists.
    for (let i = 0; i < 40; i++) {
      rowIndex += dr
      place += dc
      const target = layout[rowIndex]?.seats[place]
      if (!layout[rowIndex] || place < 0 || place >= (layout[rowIndex]?.seats.length ?? 0)) return
      if (target) {
        setFocus(target.id)
        grid.current?.querySelector<HTMLButtonElement>(`[data-seat="${target.id}"]`)?.focus()
        return
      }
      if (dr) place -= dc
    }
  }

  return (
    <div
      data-slot="seat-map"
      className={cn('flex w-full flex-col items-center gap-4', className)}
      {...props}
    >
      <div
        aria-hidden="true"
        className="w-3/4 max-w-80 rounded-[50%/100%_100%_0_0] border-t-4 border-primary/50 pt-1 text-center text-muted-foreground text-xs"
      >
        {labels.screen}
      </div>
      <fieldset
        ref={grid}
        className="flex min-w-0 max-w-full touch-pan-y flex-col gap-1 overflow-x-auto sm:gap-1.5 p-1"
        onPointerUp={() => {
          drag.current = null
        }}
        onPointerLeave={() => {
          drag.current = null
        }}
      >
        <legend className="sr-only">{labels.map}</legend>
        {layout.map(({ row, seats }) => (
          <div key={row.id} className="flex items-center gap-1 sm:gap-1.5">
            {/* Each seat says its row; this is for the eye. */}
            <span
              aria-hidden="true"
              className="w-4 shrink-0 text-center text-muted-foreground text-xs"
            >
              {row.id}
            </span>
            {seats.map((seat, place) =>
              seat === null ? (
                // biome-ignore lint/suspicious/noArrayIndexKey: an aisle has no seat to name it
                <span key={`aisle-${place}`} className="w-3 shrink-0" />
              ) : (
                <React.Fragment key={seat.id}>
                  <button
                    type="button"
                    data-seat={seat.id}
                    tabIndex={seat.id === current ? 0 : -1}
                    disabled={seat.taken}
                    aria-pressed={selected.includes(seat.id)}
                    aria-label={labels.seat(
                      row.id,
                      seat.number,
                      seat.taken ? 'taken' : selected.includes(seat.id) ? 'selected' : 'available',
                    )}
                    data-stranded={stranded.includes(seat.id) || undefined}
                    onFocus={() => setFocus(seat.id)}
                    // A click from the keyboard or a screen reader; a pointer already chose on press.
                    onClick={(event) => {
                      if (event.detail === 0) toggle(seat.id)
                    }}
                    onPointerDown={(event) => {
                      if (event.pointerType === 'mouse' && event.button !== 0) return
                      // Pointer events go to the seat under the finger, not this one.
                      event.currentTarget.releasePointerCapture?.(event.pointerId)
                      drag.current = {
                        row: row.id,
                        from: seat.number,
                        adding: !selected.includes(seat.id),
                        base: selected,
                      }
                      sweep(row.id, seat.number, seat.number)
                    }}
                    onPointerEnter={() => {
                      const d = drag.current
                      if (d && d.row === row.id) sweep(row.id, d.from, seat.number)
                    }}
                    onKeyDown={(event) => {
                      const arrows: Record<string, [number, number]> = {
                        ArrowLeft: [0, -1],
                        ArrowRight: [0, 1],
                        ArrowUp: [-1, 0],
                        ArrowDown: [1, 0],
                      }
                      const arrow = arrows[event.key]
                      if (arrow) {
                        event.preventDefault()
                        move(seat.id, arrow[0], arrow[1])
                      }
                    }}
                    className={cn(
                      'relative size-7 shrink-0 rounded-t-lg rounded-b-sm border text-[10px] outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50',
                      seat.taken
                        ? 'cursor-not-allowed border-transparent bg-muted-foreground/25'
                        : selected.includes(seat.id)
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'bg-background hover:border-primary hover:bg-primary/10',
                      stranded.includes(seat.id) &&
                        'border-amber-500 bg-amber-500/15 ring-2 ring-amber-500/40',
                    )}
                  >
                    {selected.includes(seat.id) ? seat.number : ''}
                  </button>
                </React.Fragment>
              ),
            )}
          </div>
        ))}
      </fieldset>
      <p role="status" className="min-h-5 text-amber-700 text-sm dark:text-amber-400">
        {stranded.length ? labels.stranded(stranded) : ''}
      </p>
      <ul className="flex gap-4 text-muted-foreground text-xs">
        {(['available', 'selected', 'taken'] as const).map((state) => (
          <li key={state} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={cn(
                'size-3 rounded-t-[5px] rounded-b-[2px] border',
                state === 'selected' && 'border-primary bg-primary',
                state === 'taken' && 'border-transparent bg-muted-foreground/25',
              )}
            />
            {labels.legend[state]}
          </li>
        ))}
      </ul>
    </div>
  )
}

export { SeatMap }
