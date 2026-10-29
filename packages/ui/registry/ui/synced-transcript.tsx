'use client'

import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface TranscriptWord {
  text: string
  /** When it is said, in seconds. It lasts until the next word starts. */
  start: number
}

export interface TranscriptSegment {
  speaker?: string
  words: TranscriptWord[]
}

export interface SyncedTranscriptLabels {
  transcript: string
  /** A segment's timestamp button. */
  jump: (time: string) => string
  follow: string
}

export const defaultSyncedTranscriptLabels: SyncedTranscriptLabels = {
  transcript: 'Transcript',
  jump: (time) => `Play from ${time}`,
  follow: 'Back to the current word',
}

/** How long it waits after the reader scrolls away before following again. */
const WAIT = 5000

const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`

/** The index of the word being said at `time` in a flat list ordered by start, or -1 before any. */
export function wordAt(words: TranscriptWord[], time: number) {
  let lo = 0
  let hi = words.length - 1
  let found = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if ((words[mid] as TranscriptWord).start <= time) {
      found = mid
      lo = mid + 1
    } else hi = mid - 1
  }
  return found
}

export interface SyncedTranscriptProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  segments: TranscriptSegment[]
  /** The playback time in seconds, from your audio or video. */
  time: number
  /** Called with a word's start when it is clicked, to seek the media there. */
  onSeek?: (time: number) => void
  labels?: Partial<SyncedTranscriptLabels>
}

/**
 * A transcript that follows the spoken word: what was said is solid, the word being said is
 * marked, and the view keeps it in sight. Click any word to play from there. Scroll away and it
 * stops following for a few seconds, with a button to come back.
 */
function SyncedTranscript({
  segments,
  time,
  onSeek,
  labels: labelsProp,
  className,
  ...props
}: SyncedTranscriptProps) {
  const labels = useLabels('synced-transcript', defaultSyncedTranscriptLabels, labelsProp)
  const reduced = useReducedMotion()
  const scroller = React.useRef<HTMLDivElement>(null)
  const [away, setAway] = React.useState(false)
  const awayTimer = React.useRef(0)
  const flat = React.useMemo(() => segments.flatMap((s) => s.words), [segments])
  const current = wordAt(flat, time)
  // Where each segment's words start in the flat list.
  const offsets = React.useMemo(
    () => segments.map((_, i) => segments.slice(0, i).reduce((n, s) => n + s.words.length, 0)),
    [segments],
  )

  React.useEffect(() => {
    if (away || current < 0) return
    const box = scroller.current
    const word = box?.querySelector<HTMLElement>(`[data-word="${current}"]`)
    if (!box || !word) return
    const target = word.offsetTop - box.clientHeight / 2 + word.offsetHeight / 2
    if (Math.abs(box.scrollTop - target) > word.offsetHeight)
      box.scrollTo({ top: target, behavior: reduced ? 'auto' : 'smooth' })
  }, [current, away, reduced])

  React.useEffect(() => () => window.clearTimeout(awayTimer.current), [])

  // Only the reader's own scrolling counts, not the scrolls this makes to follow along.
  const leave = () => {
    setAway(true)
    window.clearTimeout(awayTimer.current)
    awayTimer.current = window.setTimeout(() => setAway(false), WAIT)
  }

  return (
    <div
      data-slot="synced-transcript"
      className={cn('relative w-full rounded-xl border bg-card', className)}
      {...props}
    >
      <section
        ref={scroller}
        aria-label={labels.transcript}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region has to be reachable to scroll with the keys
        tabIndex={0}
        onWheel={leave}
        onTouchMove={leave}
        onKeyDown={(e) => ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown'].includes(e.key) && leave()}
        onClick={(e) => {
          const start = (e.target as HTMLElement).dataset.start
          if (start !== undefined) {
            setAway(false)
            onSeek?.(Number(start))
          }
        }}
        className="relative flex max-h-80 flex-col gap-4 overflow-y-auto p-5 text-[15px] leading-7 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {segments.map((segment, s) => {
          const first = segment.words[0]
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: segments keep their order
            <div key={s} className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-xs">
                {segment.speaker && <span className="font-medium">{segment.speaker}</span>}
                {first && (
                  <button
                    type="button"
                    aria-label={labels.jump(clock(first.start))}
                    onClick={(e) => {
                      e.stopPropagation()
                      setAway(false)
                      onSeek?.(first.start)
                    }}
                    className="rounded px-1 text-muted-foreground tabular-nums outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:py-2"
                  >
                    {clock(first.start)}
                  </button>
                )}
              </div>
              <p>
                {segment.words.map((word, w) => {
                  const i = (offsets[s] ?? 0) + w
                  return (
                    <React.Fragment key={i}>
                      <span
                        data-word={i}
                        data-start={word.start}
                        aria-current={i === current ? 'true' : undefined}
                        className={cn(
                          'cursor-pointer rounded-sm transition-colors duration-150 hover:underline',
                          i > current && 'text-muted-foreground',
                          i === current && 'bg-primary text-primary-foreground',
                        )}
                      >
                        {word.text}
                      </span>{' '}
                    </React.Fragment>
                  )
                })}
              </p>
            </div>
          )
        })}
      </section>
      {away && (
        <button
          type="button"
          onClick={() => {
            window.clearTimeout(awayTimer.current)
            setAway(false)
          }}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-3 py-1.5 font-medium text-background text-xs shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 pointer-coarse:py-3"
        >
          {labels.follow}
        </button>
      )}
    </div>
  )
}

export { SyncedTranscript }
