'use client'

import {
  ChevronDownIcon,
  CircleCheckIcon,
  EllipsisIcon,
  PencilIcon,
  ReplyIcon,
  RotateCcwIcon,
  SmilePlusIcon,
  Trash2Icon,
} from 'lucide-react'
import * as React from 'react'
import { LabelsProvider, useLabels, useLocale } from '@/lib/labels'
import { cn } from '@/lib/utils'
import { confirm } from '@/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar'
import { Button } from '@/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover'
import { Textarea } from '@/ui/textarea'

export interface CommentUser {
  id: string
  name: string
  /** Picture URL. Without one the avatar shows the initials. */
  avatar?: string
  /** What follows the @ to mention them. Default their first name. */
  handle?: string
}

export interface CommentReaction {
  emoji: string
  /** Who reacted with it. The count is the length. */
  userIds: string[]
}

export interface ThreadComment {
  id: string
  authorId: string
  /** Plain text. `@handle` of a known user turns into a mention. */
  body: string
  createdAt: Date | string | number
  /** When it was last changed. Adds "(edited)" next to the time. */
  editedAt?: Date | string | number
  reactions?: CommentReaction[]
  /** Answers to a top level comment. Replies to replies are not nested further. */
  replies?: ThreadComment[]
}

const DEFAULT_REACTIONS = ['👍', '❤️', '🎉', '👀', '🚀', '😄']

function toDate(value: Date | string | number) {
  return value instanceof Date ? value : new Date(value)
}

export interface CommentThreadLabels {
  /** Heading of the thread. */
  title: string
  /** Placeholder and name of the field for a new comment. */
  placeholder: string
  /** Submit button of a new comment. */
  comment: string
  cancel: string
  addReaction: string
  reactWith: (emoji: string) => string
  /** How your own name reads in who reacted. */
  you: string
  /** Name of a comment, by its author. */
  commentBy: (name?: string) => string
  /** Shown for an author who is not in `users`. */
  unknown: string
  edited: string
  moreActions: string
  edit: string
  delete: string
  /** Placeholder and name of the field while editing. */
  editPlaceholder: string
  save: string
  reply: string
  /** Placeholder and name of the field of a reply. */
  replyPlaceholder: string
  showReplies: (count: number) => string
  hideReplies: (count: number) => string
  /** Name of the replies of a comment, by its author. */
  repliesTo: (name?: string) => string
  resolved: string
  resolve: string
  reopen: string
  empty: string
  /** Shown in place of the field on a resolved thread. */
  resolvedNotice: string
  /** Added to it when the thread can be reopened. */
  reopenToReply: string
  /** The confirm before a delete. */
  deleteTitle: string
  deleteDescription: string
  deleteWithReplies: string
}

export const defaultCommentThreadLabels: CommentThreadLabels = {
  title: 'Comments',
  placeholder: 'Add a comment',
  comment: 'Comment',
  cancel: 'Cancel',
  addReaction: 'Add reaction',
  reactWith: (emoji) => `React with ${emoji}`,
  you: 'You',
  commentBy: (name) => `Comment by ${name ?? 'unknown'}`,
  unknown: 'Unknown',
  edited: '(edited)',
  moreActions: 'More actions',
  edit: 'Edit',
  delete: 'Delete',
  editPlaceholder: 'Edit comment',
  save: 'Save',
  reply: 'Reply',
  replyPlaceholder: 'Write a reply',
  showReplies: (count) => `Show ${count} ${count === 1 ? 'reply' : 'replies'}`,
  hideReplies: (count) => `Hide ${count === 1 ? 'reply' : 'replies'}`,
  repliesTo: (name) => `Replies to ${name ?? 'comment'}`,
  resolved: 'Resolved',
  resolve: 'Resolve',
  reopen: 'Reopen',
  empty: 'No comments yet.',
  resolvedNotice: 'This thread is resolved.',
  reopenToReply: 'Reopen it to reply.',
  deleteTitle: 'Delete this comment?',
  deleteDescription: 'This cannot be undone.',
  deleteWithReplies: 'Its replies go with it. This cannot be undone.',
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

const handleOf = (user: CommentUser) => (user.handle ?? user.name.split(/\s+/)[0] ?? '').trim()

const STEPS: [Intl.RelativeTimeFormatUnit, number, number][] = [
  // unit, seconds in one, used while the distance is below this many seconds
  ['minute', 60, 45 * 60],
  ['hour', 3600, 22 * 3600],
  ['day', 86_400, 7 * 86_400],
  ['week', 604_800, 30 * 86_400],
  ['month', 2_629_800, 335 * 86_400],
  ['year', 31_557_600, Number.POSITIVE_INFINITY],
]

/** "now", "5 minutes ago", "yesterday", "in 2 weeks", in the reader's locale. */
export function formatRelativeTime(
  value: Date | string | number,
  now: Date = new Date(),
  locale?: string,
) {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const seconds = (toDate(value).getTime() - now.getTime()) / 1000
  const distance = Math.abs(seconds)
  if (distance < 45) return rtf.format(0, 'second')
  // Rounded the same way into the past and the future: 90 minutes is 2 hours either way.
  const round = (size: number) => Math.sign(seconds) * Math.round(distance / size)
  for (const [unit, size, below] of STEPS) {
    if (distance < below) return rtf.format(round(size), unit)
  }
  return rtf.format(round(31_557_600), 'year')
}

/** The current time, refreshed every `interval` ms so relative times stay true. */
function useNow(interval = 60_000, fixed?: Date) {
  const [now, setNow] = React.useState(() => fixed ?? new Date())
  React.useEffect(() => {
    if (fixed) return
    const timer = setInterval(() => setNow(new Date()), interval)
    return () => clearInterval(timer)
  }, [interval, fixed])
  return fixed ?? now
}

export interface RelativeTimeProps extends Omit<React.ComponentProps<'time'>, 'children'> {
  date: Date | string | number
  /** What "now" is. Default the clock, refreshed every minute. */
  now?: Date
  locale?: string
}

/** A `<time>` that reads "5 minutes ago", with the full date on hover. */
function RelativeTime({ date, now, locale: localeProp, className, ...props }: RelativeTimeProps) {
  const locale = useLocale(localeProp)
  const current = useNow(60_000, now)
  const value = toDate(date)
  return (
    <time
      data-slot="relative-time"
      dateTime={value.toISOString()}
      title={new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeStyle: 'short' }).format(
        value,
      )}
      className={className}
      {...props}
    >
      {formatRelativeTime(value, current, locale)}
    </time>
  )
}

export type MentionSegment =
  | { type: 'text'; value: string }
  | { type: 'mention'; value: string; user: CommentUser }

// An @ at the start or after anything that is not a letter, so emails are left alone.
const MENTION = /(^|[^\p{L}\p{N}_@])@([\p{L}\p{N}_](?:[\p{L}\p{N}_.-]*[\p{L}\p{N}_])?)/gu

/**
 * Splits plain text into text and mentions. A mention is `@` and the handle of a known user,
 * their first name or their whole name without spaces, ignoring case. Anything else after an
 * @ stays text.
 */
export function parseMentions(text: string, users: CommentUser[]): MentionSegment[] {
  const lookup = new Map<string, CommentUser>()
  for (const user of users) {
    lookup.set(user.name.replace(/\s+/g, '').toLowerCase(), user)
    lookup.set(handleOf(user).toLowerCase(), user)
  }
  const segments: MentionSegment[] = []
  let last = 0
  for (const match of text.matchAll(MENTION)) {
    const [, before = '', name = ''] = match
    const user = lookup.get(name.toLowerCase())
    if (!user) continue
    const start = (match.index ?? 0) + before.length
    if (start > last) segments.push({ type: 'text', value: text.slice(last, start) })
    segments.push({ type: 'mention', value: `@${name}`, user })
    last = start + name.length + 1
  }
  if (last < text.length) segments.push({ type: 'text', value: text.slice(last) })
  return segments
}

export interface CommentBodyProps extends React.ComponentProps<'p'> {
  /** The plain text of the comment. */
  text: string
  /** People who can be mentioned. */
  users: CommentUser[]
}

/** Comment text with its @mentions drawn as chips. Line breaks are kept. */
function CommentBody({ text, users, className, ...props }: CommentBodyProps) {
  return (
    <p
      data-slot="comment-body"
      className={cn('whitespace-pre-wrap break-words text-sm leading-relaxed', className)}
      {...props}
    >
      {parseMentions(text, users).map((segment, index) =>
        segment.type === 'mention' ? (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: segments have no identity of their own
            key={index}
            data-slot="mention"
            title={segment.user.name}
            className="rounded-md bg-primary/10 px-1 py-px font-medium text-primary dark:bg-primary/15"
          >
            {segment.value}
          </span>
        ) : (
          segment.value
        ),
      )}
    </p>
  )
}

export interface CommentComposerProps
  extends Omit<React.ComponentProps<'form'>, 'onSubmit' | 'children'> {
  /** Called with the trimmed text. The field empties afterwards unless it was editing. */
  onSubmit: (body: string) => void
  /** Shows a Cancel button and makes Escape call it. */
  onCancel?: () => void
  /** Starting text, for edits and for replies that start with a mention. */
  defaultValue?: string
  /** Also the accessible name of the field. Default "Add a comment". */
  placeholder?: string
  /** Label of the submit button. Default "Comment". */
  submitLabel?: string
  autoFocus?: boolean
  disabled?: boolean
}

/** A field and a button. Ctrl or Cmd+Enter submits, Escape cancels. */
function CommentComposer({
  onSubmit,
  onCancel,
  defaultValue = '',
  placeholder: placeholderProp,
  submitLabel,
  autoFocus,
  disabled,
  className,
  ...props
}: CommentComposerProps) {
  const labels = useLabels('comment-thread', defaultCommentThreadLabels)
  const placeholder = placeholderProp ?? labels.placeholder
  const [value, setValue] = React.useState(defaultValue)
  const fieldRef = React.useRef<HTMLTextAreaElement>(null)
  const trimmed = value.trim()

  // Put the caret after any starting text, such as the mention of a reply.
  React.useEffect(() => {
    const field = fieldRef.current
    if (!autoFocus || !field) return
    field.focus()
    field.setSelectionRange(field.value.length, field.value.length)
  }, [autoFocus])

  const submit = () => {
    if (!trimmed || disabled) return
    onSubmit(trimmed)
    if (!onCancel) setValue('')
  }

  return (
    <form
      data-slot="comment-composer"
      className={cn('flex flex-col gap-2', className)}
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
      {...props}
    >
      <Textarea
        ref={fieldRef}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault()
            submit()
          } else if (event.key === 'Escape' && onCancel) {
            event.preventDefault()
            onCancel()
          }
        }}
        className="max-h-48 min-h-16 resize-none"
      />
      <div className="flex items-center justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            {labels.cancel}
          </Button>
        ) : null}
        <Button type="submit" size="sm" disabled={!trimmed || disabled}>
          {submitLabel ?? labels.comment}
        </Button>
      </div>
    </form>
  )
}

function UserAvatar({ user, className }: { user?: CommentUser; className?: string }) {
  return (
    <Avatar className={cn('size-8', className)}>
      {user?.avatar ? <AvatarImage src={user.avatar} alt="" /> : null}
      <AvatarFallback className="text-[0.6875rem]">{initials(user?.name ?? '?')}</AvatarFallback>
    </Avatar>
  )
}

function ReactionPicker({
  reactions,
  onPick,
}: {
  reactions: string[]
  onPick: (e: string) => void
}) {
  const labels = useLabels('comment-thread', defaultCommentThreadLabels)
  const [open, setOpen] = React.useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={labels.addReaction}
          className="h-7 px-2 text-muted-foreground first:-ml-2"
        >
          <SmilePlusIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" className="flex w-auto gap-0.5 rounded-full p-1">
        {reactions.map((emoji) => (
          <button
            key={emoji}
            type="button"
            aria-label={labels.reactWith(emoji)}
            onClick={() => {
              onPick(emoji)
              setOpen(false)
            }}
            className="grid size-8 place-items-center rounded-full text-lg outline-none transition-transform duration-(--duration-fast,150ms) hover:scale-110 hover:bg-accent focus-visible:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:hover:scale-100"
          >
            {emoji}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

export interface CommentThreadProps extends Omit<React.ComponentProps<'section'>, 'title'> {
  /** Top level comments, oldest first, each with its replies. */
  comments: ThreadComment[]
  /** Everyone who can appear or be mentioned. */
  users: CommentUser[]
  /** Your id. Only your own comments can be edited and deleted. */
  currentUserId: string
  /** Heading of the thread. Default "Comments". */
  title?: React.ReactNode
  /**
   * Called with a new comment. `parentId` is the top level comment it answers, or undefined
   * for a new top level comment. Without it there is nothing to write in.
   */
  onComment?: (body: string, parentId?: string) => void
  /** Called when you save an edit of your own comment. Without it there is no Edit. */
  onEdit?: (id: string, body: string) => void
  /** Called after the delete is confirmed. Without it there is no Delete. */
  onDelete?: (id: string) => void
  /** Called when a reaction is added, or taken away (`added` false). */
  onReact?: (id: string, emoji: string, added: boolean) => void
  /** Whether the thread is resolved. A resolved thread is read only until it is reopened. */
  resolved?: boolean
  /** Called by the Resolve and Reopen button. Without it there is no button. */
  onResolvedChange?: (resolved: boolean) => void
  /**
   * Ask with `confirm()` from alert-dialog before deleting. Needs a `<Confirmer />` mounted.
   * Default true.
   */
  confirmDelete?: boolean
  /** Emoji offered by the reaction picker. */
  reactions?: string[]
  /** Collapse the replies of every comment at first. Default false. */
  defaultCollapsed?: boolean
  /** What "now" is for the relative times. Default the clock, refreshed every minute. */
  now?: Date
  /** Locale for relative times. Default the reader's. */
  locale?: string
  /** Words to use instead of the English ones. A `LabelsProvider` sets them for the whole app. */
  labels?: Partial<CommentThreadLabels>
}

/**
 * Comments with one level of replies, reactions, @mentions, inline edits of your own comments,
 * delete behind a confirm and a resolved state, from plain data.
 */
function CommentThread({
  comments,
  users,
  currentUserId,
  title: titleProp,
  onComment,
  onEdit,
  onDelete,
  onReact,
  resolved = false,
  onResolvedChange,
  confirmDelete = true,
  reactions = DEFAULT_REACTIONS,
  defaultCollapsed = false,
  now: nowProp,
  locale,
  labels: labelsProp,
  className,
  ...props
}: CommentThreadProps) {
  const labels = useLabels('comment-thread', defaultCommentThreadLabels, labelsProp)
  // The parts read their words from the provider, so the `labels` prop reaches them through one.
  const pack = React.useMemo(() => ({ 'comment-thread': labels }), [labels])
  const title = titleProp ?? labels.title
  const now = useNow(60_000, nowProp)
  const byId = React.useMemo(() => new Map(users.map((user) => [user.id, user])), [users])
  const [editing, setEditing] = React.useState<string | null>(null)
  const [replying, setReplying] = React.useState<{ id: string; prefill: string } | null>(null)
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({})
  const titleId = React.useId()
  const total = comments.reduce((sum, c) => sum + 1 + (c.replies?.length ?? 0), 0)
  const readOnly = resolved

  const remove = async (comment: ThreadComment) => {
    if (!onDelete) return
    if (confirmDelete) {
      const ok = await confirm({
        title: labels.deleteTitle,
        description:
          comment.replies && comment.replies.length > 0
            ? labels.deleteWithReplies
            : labels.deleteDescription,
        confirmText: labels.delete,
        variant: 'destructive',
      })
      if (!ok) return
    }
    onDelete(comment.id)
  }

  const renderComment = (comment: ThreadComment, parent?: ThreadComment) => {
    const author = byId.get(comment.authorId)
    const mine = comment.authorId === currentUserId
    const top = parent ?? comment
    const toggle = (emoji: string) => {
      const reacted = comment.reactions
        ?.find((r) => r.emoji === emoji)
        ?.userIds.includes(currentUserId)
      onReact?.(comment.id, emoji, !reacted)
    }
    const shownReactions = comment.reactions?.filter((r) => r.userIds.length > 0) ?? []
    const canEdit = mine && !!onEdit && !readOnly
    const canDelete = mine && !!onDelete && !readOnly

    return (
      <article
        data-slot="comment"
        aria-label={labels.commentBy(author?.name)}
        className="group/comment flex gap-3"
      >
        <UserAvatar user={author} className={parent ? 'size-6' : undefined} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <p className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 text-sm">
              <span className="font-medium">{author?.name ?? labels.unknown}</span>
              <RelativeTime
                date={comment.createdAt}
                now={now}
                locale={locale}
                className="text-muted-foreground text-xs"
              />
              {comment.editedAt ? (
                <span className="text-muted-foreground text-xs">{labels.edited}</span>
              ) : null}
            </p>
            {canEdit || canDelete ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={labels.moreActions}
                    className="-my-1 size-7 text-muted-foreground opacity-0 focus-visible:opacity-100 group-hover/comment:opacity-100 data-[state=open]:opacity-100 pointer-coarse:opacity-100"
                  >
                    <EllipsisIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canEdit ? (
                    <DropdownMenuItem onSelect={() => setEditing(comment.id)}>
                      <PencilIcon />
                      {labels.edit}
                    </DropdownMenuItem>
                  ) : null}
                  {canDelete ? (
                    <DropdownMenuItem variant="destructive" onSelect={() => void remove(comment)}>
                      <Trash2Icon />
                      {labels.delete}
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
          {editing === comment.id ? (
            <CommentComposer
              className="mt-2"
              defaultValue={comment.body}
              placeholder={labels.editPlaceholder}
              submitLabel={labels.save}
              autoFocus
              onCancel={() => setEditing(null)}
              onSubmit={(body) => {
                setEditing(null)
                if (body !== comment.body) onEdit?.(comment.id, body)
              }}
            />
          ) : (
            <CommentBody text={comment.body} users={users} className="mt-0.5" />
          )}
          {shownReactions.length > 0 || (!readOnly && (onReact || onComment)) ? (
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              {shownReactions.map((reaction) => {
                const pressed = reaction.userIds.includes(currentUserId)
                return (
                  <button
                    key={reaction.emoji}
                    type="button"
                    aria-pressed={pressed}
                    aria-label={`${reaction.emoji} ${reaction.userIds.length}`}
                    title={reaction.userIds
                      .map((id) => (id === currentUserId ? labels.you : (byId.get(id)?.name ?? id)))
                      .join(', ')}
                    disabled={!onReact || readOnly}
                    onClick={() => toggle(reaction.emoji)}
                    className="inline-flex h-6 items-center gap-1 rounded-full border bg-background px-2 text-xs tabular-nums outline-none transition-colors duration-(--duration-fast,150ms) hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none aria-pressed:border-primary/30 aria-pressed:bg-primary/10"
                  >
                    <span aria-hidden>{reaction.emoji}</span>
                    <span aria-hidden className="text-muted-foreground">
                      {reaction.userIds.length}
                    </span>
                  </button>
                )
              })}
              {!readOnly && onReact ? (
                <ReactionPicker reactions={reactions} onPick={toggle} />
              ) : null}
              {!readOnly && onComment ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-muted-foreground first:-ml-2"
                  onClick={() => {
                    // Answering a reply goes to the same thread, starting with a mention.
                    const prefill = parent && author && !mine ? `@${handleOf(author)} ` : ''
                    setCollapsed((c) => ({ ...c, [top.id]: false }))
                    setReplying({ id: top.id, prefill })
                  }}
                >
                  <ReplyIcon />
                  {labels.reply}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </article>
    )
  }

  return (
    <LabelsProvider labels={pack}>
      <section
        data-slot="comment-thread"
        data-resolved={resolved || undefined}
        aria-labelledby={titleId}
        className={cn('rounded-xl border bg-card text-card-foreground shadow-xs', className)}
        {...props}
      >
        <header className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <h3 id={titleId} className="truncate font-semibold text-sm">
              {title}
            </h3>
            <span className="text-muted-foreground text-xs tabular-nums">{total}</span>
            {resolved ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-700 text-xs dark:text-emerald-400">
                <CircleCheckIcon aria-hidden className="size-3" />
                {labels.resolved}
              </span>
            ) : null}
          </div>
          {onResolvedChange ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditing(null)
                setReplying(null)
                onResolvedChange(!resolved)
              }}
            >
              {resolved ? <RotateCcwIcon /> : <CircleCheckIcon />}
              {resolved ? labels.reopen : labels.resolve}
            </Button>
          ) : null}
        </header>

        {comments.length === 0 ? (
          <p className="px-4 pt-4 text-muted-foreground text-sm">{labels.empty}</p>
        ) : (
          <ol className={cn('flex flex-col gap-5 p-4', resolved && 'opacity-75')}>
            {comments.map((comment) => {
              const replies = comment.replies ?? []
              const isCollapsed = collapsed[comment.id] ?? defaultCollapsed
              const repliesId = `${titleId}-${comment.id}-replies`
              const replyingHere = replying?.id === comment.id && !readOnly
              return (
                <li key={comment.id} className="flex flex-col gap-3">
                  {renderComment(comment)}
                  {replies.length > 0 || replyingHere ? (
                    <div className="ml-4 flex flex-col gap-3 border-l pl-4 sm:ml-[1.0625rem] sm:pl-5">
                      {replies.length > 0 ? (
                        <button
                          type="button"
                          aria-expanded={!isCollapsed}
                          aria-controls={repliesId}
                          onClick={() =>
                            setCollapsed((c) => ({ ...c, [comment.id]: !isCollapsed }))
                          }
                          className="inline-flex w-fit items-center gap-1 rounded-md font-medium text-muted-foreground text-xs outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                          <ChevronDownIcon
                            aria-hidden
                            className={cn(
                              'size-3.5 transition-transform duration-(--duration-fast,150ms)',
                              isCollapsed && '-rotate-90',
                            )}
                          />
                          {isCollapsed
                            ? labels.showReplies(replies.length)
                            : labels.hideReplies(replies.length)}
                        </button>
                      ) : null}
                      {replies.length > 0 && !isCollapsed ? (
                        <ol
                          id={repliesId}
                          aria-label={labels.repliesTo(byId.get(comment.authorId)?.name)}
                          className="flex flex-col gap-4"
                        >
                          {replies.map((reply) => (
                            <li key={reply.id}>{renderComment(reply, comment)}</li>
                          ))}
                        </ol>
                      ) : null}
                      {replyingHere && onComment ? (
                        <CommentComposer
                          key={`${replying.id}-${replying.prefill}`}
                          defaultValue={replying.prefill}
                          placeholder={labels.replyPlaceholder}
                          submitLabel={labels.reply}
                          autoFocus
                          onCancel={() => setReplying(null)}
                          onSubmit={(body) => {
                            onComment(body, comment.id)
                            setReplying(null)
                          }}
                        />
                      ) : null}
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ol>
        )}

        {onComment ? (
          <div className="border-t p-4">
            {resolved ? (
              <p className="text-muted-foreground text-sm">
                {labels.resolvedNotice}
                {onResolvedChange ? ` ${labels.reopenToReply}` : ''}
              </p>
            ) : (
              <div className="flex gap-3">
                <UserAvatar user={byId.get(currentUserId)} />
                <CommentComposer className="flex-1" onSubmit={(body) => onComment(body)} />
              </div>
            )}
          </div>
        ) : null}
      </section>
    </LabelsProvider>
  )
}

export { CommentBody, CommentComposer, CommentThread, RelativeTime }
