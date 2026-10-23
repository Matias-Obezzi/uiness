'use client'

import { PauseIcon, PlayIcon, Volume2Icon, VolumeXIcon, XIcon } from 'lucide-react'
import * as React from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface Story {
  id: string
  /** An image or a video. Leave it out and pass `content` for anything else. */
  src?: string
  type?: 'image' | 'video'
  /** Describes an image for screen readers. */
  alt?: string
  /** Your own slide, drawn over the media or in its place. */
  content?: React.ReactNode
  /** Milliseconds on screen. Default 5000, or the video's own length. */
  duration?: number
  /** When it was posted, as you want it shown: "2h". */
  time?: string
}

export interface StoryGroup {
  id: string
  name: string
  avatar?: string
  stories: Story[]
}

export interface StoriesLabels {
  /** Names the row of avatars. */
  tray: string
  /** A person's button in the row, saying whether they have stories not seen yet. */
  group: (name: string, unseen: boolean) => string
  /** The story on screen: "Ana, story 2 of 5". */
  story: (name: string, index: number, total: number) => string
  previous: string
  next: string
  pause: string
  play: string
  mute: string
  unmute: string
  close: string
}

export const defaultStoriesLabels: StoriesLabels = {
  tray: 'Stories',
  group: (name, unseen) => (unseen ? `${name}, new stories` : name),
  story: (name, index, total) => `${name}, story ${index} of ${total}`,
  previous: 'Previous story',
  next: 'Next story',
  pause: 'Pause',
  play: 'Play',
  mute: 'Mute',
  unmute: 'Unmute',
  close: 'Close stories',
}

/** Held this long, a press pauses instead of moving on. */
const HOLD_MS = 200
const DEFAULT_DURATION = 5000

export interface StoriesProps extends Omit<React.ComponentProps<'ul'>, 'children'> {
  groups: StoryGroup[]
  /** Story ids already seen, to start from. */
  defaultSeen?: string[]
  /** Called once per story, the first time it is on screen. */
  onSeen?: (story: Story, group: StoryGroup) => void
  labels?: Partial<StoriesLabels>
}

/**
 * A row of avatars, ringed while they have stories not seen yet, that open a full screen
 * viewer: bars fill as each story plays and it moves on by itself, to the next person at the
 * end. Tap the right of the screen for the next story, the left for the one before, hold to
 * pause. The keyboard uses the arrows, space to pause and escape to close.
 */
function Stories({
  groups,
  defaultSeen = [],
  onSeen,
  labels: labelsProp,
  className,
  ...props
}: StoriesProps) {
  const labels = useLabels('stories', defaultStoriesLabels, labelsProp)
  const [seen, setSeen] = React.useState<ReadonlySet<string>>(() => new Set(defaultSeen))
  const [open, setOpen] = React.useState<number | null>(null)
  const unseen = (group: StoryGroup) => group.stories.some((s) => !seen.has(s.id))

  const markSeen = (story: Story, group: StoryGroup) => {
    if (seen.has(story.id)) return
    setSeen((prev) => new Set(prev).add(story.id))
    onSeen?.(story, group)
  }

  return (
    <>
      <ul
        data-slot="stories"
        aria-label={labels.tray}
        className={cn('flex list-none gap-4 overflow-x-auto p-1 [scrollbar-width:none]', className)}
        {...props}
      >
        {groups.map((group, i) => {
          const fresh = unseen(group)
          return (
            <li key={group.id} className="shrink-0">
              <button
                type="button"
                aria-label={labels.group(group.name, fresh)}
                onClick={() => setOpen(i)}
                className="relative flex w-18 flex-col items-center gap-1.5 rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <span
                  className={cn(
                    'rounded-full p-[3px]',
                    // The ring of unseen stories: the warm gradient people know it by.
                    fresh
                      ? 'bg-linear-to-tr from-amber-400 via-rose-500 to-fuchsia-600'
                      : 'bg-border',
                  )}
                >
                  <StoryAvatar group={group} className="size-16 border-2 border-background" />
                </span>
                <span className="w-full truncate text-center text-xs">{group.name}</span>
              </button>
            </li>
          )
        })}
      </ul>
      <Dialog open={open !== null} onOpenChange={(next) => !next && setOpen(null)}>
        <DialogContent
          showCloseButton={false}
          className="inset-0 top-0 left-0 h-dvh max-h-none w-full max-w-none translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-none border-0 bg-black p-0 text-white sm:max-w-none"
        >
          {open !== null && groups[open] && (
            <StoryGroupView
              // A new person starts at their first story.
              key={groups[open].id}
              group={groups[open]}
              firstUnseen={groups[open].stories.findIndex((s) => !seen.has(s.id))}
              labels={labels}
              onSeen={(story) => markSeen(story, groups[open] as StoryGroup)}
              onPrevious={() => setOpen(open > 0 ? open - 1 : open)}
              onNext={() => setOpen(open < groups.length - 1 ? open + 1 : null)}
              onClose={() => setOpen(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function StoryAvatar({ group, className }: { group: StoryGroup; className?: string }) {
  return group.avatar ? (
    <img
      src={group.avatar}
      alt=""
      className={cn('block rounded-full bg-muted object-cover', className)}
    />
  ) : (
    <span
      aria-hidden="true"
      className={cn(
        'flex items-center justify-center rounded-full bg-muted font-medium text-muted-foreground',
        className,
      )}
    >
      {group.name.charAt(0)}
    </span>
  )
}

interface StoryGroupViewProps {
  group: StoryGroup
  /** Where to start: the first story not seen, or -1 to start from the first. */
  firstUnseen: number
  labels: StoriesLabels
  onSeen: (story: Story) => void
  onPrevious: () => void
  onNext: () => void
  onClose: () => void
}

/** One person's stories, played in order. */
function StoryGroupView({
  group,
  firstUnseen,
  labels,
  onSeen,
  onPrevious,
  onNext,
  onClose,
}: StoryGroupViewProps) {
  const [index, setIndex] = React.useState(() => Math.max(0, firstUnseen))
  const [paused, setPaused] = React.useState(false)
  const [held, setHeld] = React.useState(false)
  const [muted, setMuted] = React.useState(true)
  const [videoLength, setVideoLength] = React.useState<number | null>(null)
  const bar = React.useRef<HTMLSpanElement>(null)
  const video = React.useRef<HTMLVideoElement>(null)
  const progress = React.useRef<Animation | null>(null)
  const holdTimer = React.useRef(0)
  const wasHold = React.useRef(false)

  const story = group.stories[index]
  const total = group.stories.length
  const duration =
    story?.duration ?? (story?.type === 'video' && videoLength ? videoLength : DEFAULT_DURATION)
  const stopped = paused || held

  const next = () => {
    if (index < total - 1) {
      setVideoLength(null)
      setIndex(index + 1)
    } else onNext()
  }
  const previous = () => {
    if (index > 0) {
      setVideoLength(null)
      setIndex(index - 1)
    } else onPrevious()
  }
  // The timers below outlive a render: they call whichever `next` is current.
  const nextRef = React.useRef(next)
  const onSeenRef = React.useRef(onSeen)
  React.useEffect(() => {
    nextRef.current = next
    onSeenRef.current = onSeen
  })

  React.useEffect(() => {
    if (story) onSeenRef.current(story)
  }, [story])

  // The current bar fills over the story's length, and moving on happens when it is full.
  React.useEffect(() => {
    const el = bar.current
    if (!el || !story || typeof el.animate !== 'function') return
    const animation = el.animate([{ scale: '0 1' }, { scale: '1 1' }], {
      duration,
      fill: 'forwards',
    })
    animation.onfinish = () => nextRef.current()
    progress.current = animation
    return () => {
      animation.cancel()
      progress.current = null
    }
  }, [story, duration])

  // Without Web Animations, a timer moves on.
  // shortcut: a pause restarts the story's time there, fine for the few browsers without them.
  React.useEffect(() => {
    if (!story || stopped || typeof bar.current?.animate === 'function') return
    const timer = window.setTimeout(() => nextRef.current(), duration)
    return () => window.clearTimeout(timer)
  }, [story, duration, stopped])

  // Pausing holds the bar and the video together.
  // biome-ignore lint/correctness/useExhaustiveDependencies: each new story brings its own bar animation and video
  React.useEffect(() => {
    if (stopped) {
      progress.current?.pause()
      video.current?.pause()
    } else {
      progress.current?.play()
      video.current?.play().catch(() => {})
    }
  }, [stopped, story, duration])

  if (!story) return null

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowRight') next()
    else if (event.key === 'ArrowLeft') previous()
    else if (event.key === ' ' && !(event.target instanceof HTMLButtonElement)) {
      event.preventDefault()
      setPaused(!paused)
    } else return
    event.preventDefault()
  }

  // A press held still pauses; a quick tap moves on. The click that follows a hold is not a tap.
  const zone = (go: () => void) => ({
    onPointerDown: () => {
      wasHold.current = false
      holdTimer.current = window.setTimeout(() => {
        wasHold.current = true
        setHeld(true)
      }, HOLD_MS)
    },
    onPointerUp: () => {
      window.clearTimeout(holdTimer.current)
      setHeld(false)
    },
    onPointerLeave: () => {
      window.clearTimeout(holdTimer.current)
      setHeld(false)
    },
    onClick: () => {
      if (wasHold.current) wasHold.current = false
      else go()
    },
  })

  return (
    <section
      data-slot="stories-viewer"
      aria-roledescription="story"
      aria-label={labels.story(group.name, index + 1, total)}
      onKeyDown={onKeyDown}
      className="relative mx-auto flex h-full w-full flex-col overflow-hidden bg-neutral-900 select-none sm:my-auto sm:aspect-9/16 sm:h-[min(100dvh-2rem,56rem)] sm:w-auto sm:rounded-xl"
    >
      <DialogTitle className="sr-only">{labels.story(group.name, index + 1, total)}</DialogTitle>

      {/* The story itself. */}
      <div className="absolute inset-0">
        {story.src && story.type === 'video' ? (
          <video
            ref={video}
            key={story.id}
            src={story.src}
            muted={muted}
            playsInline
            autoPlay
            onLoadedMetadata={(e) => {
              const length = e.currentTarget.duration
              if (Number.isFinite(length)) setVideoLength(length * 1000)
            }}
            className="size-full object-cover"
          />
        ) : story.src ? (
          <img
            key={story.id}
            src={story.src}
            alt={story.alt ?? ''}
            className="size-full object-cover"
          />
        ) : null}
        {story.content && <div className="absolute inset-0">{story.content}</div>}
      </div>

      {/* Tap the left third to go back, the rest to go on. */}
      <button
        type="button"
        aria-label={labels.previous}
        className="absolute inset-y-0 left-0 z-10 w-1/3 outline-none focus-visible:bg-white/10"
        {...zone(previous)}
      />
      <button
        type="button"
        aria-label={labels.next}
        className="absolute inset-y-0 right-0 z-10 w-2/3 outline-none focus-visible:bg-white/10"
        {...zone(next)}
      />

      {/* Bars and the header sit over a shade, so they read on any picture. */}
      <div className="relative z-20 bg-linear-to-b from-black/60 to-transparent px-3 pt-3 pb-8">
        <div aria-hidden="true" className="flex gap-1">
          {group.stories.map((s, i) => (
            <span key={s.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/35">
              <span
                ref={i === index ? bar : undefined}
                className={cn(
                  'block h-full origin-left bg-white',
                  i < index ? 'scale-x-100' : 'scale-x-0',
                )}
              />
            </span>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <StoryAvatar group={group} className="size-8 text-xs" />
          <span className="truncate font-semibold text-sm">{group.name}</span>
          {story.time && <span className="shrink-0 text-sm text-white/70">{story.time}</span>}
          <div className="ml-auto flex shrink-0 items-center">
            {story.type === 'video' && (
              <IconButton
                label={muted ? labels.unmute : labels.mute}
                onClick={() => setMuted(!muted)}
              >
                {muted ? <VolumeXIcon /> : <Volume2Icon />}
              </IconButton>
            )}
            <IconButton
              label={paused ? labels.play : labels.pause}
              onClick={() => setPaused(!paused)}
            >
              {paused ? <PlayIcon /> : <PauseIcon />}
            </IconButton>
            <IconButton label={labels.close} onClick={onClose}>
              <XIcon />
            </IconButton>
          </div>
        </div>
      </div>
    </section>
  )
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="relative flex size-10 items-center justify-center rounded-full outline-none transition-colors hover:bg-white/10 focus-visible:ring-[3px] focus-visible:ring-white/60 pointer-coarse:after:absolute pointer-coarse:after:inset-[-2px] [&_svg]:size-5"
    >
      {children}
    </button>
  )
}

export { Stories }
