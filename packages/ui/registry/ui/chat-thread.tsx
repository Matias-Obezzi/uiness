'use client'

import {
  ArrowDownIcon,
  CircleAlertIcon,
  FileIcon,
  PaperclipIcon,
  SendHorizontalIcon,
  SmilePlusIcon,
  XIcon,
} from 'lucide-react'
import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { LabelsProvider, useLabels, useLocale } from '@/lib/labels'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar'
import { Button } from '@/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover'

export interface ChatUser {
  id: string
  name: string
  /** Picture URL. Without one the avatar shows the initials. */
  avatar?: string
}

export interface ChatAttachment {
  id: string
  /** File name, shown on file chips and used as the alt text of images. */
  name: string
  /** Where the file or the full size image lives. Without it the chip is not a link. */
  url?: string
  /** `image` shows a thumbnail. Default worked out from `type`. */
  kind?: 'image' | 'file'
  /** MIME type, such as `image/png` or `application/pdf`. */
  type?: string
  /** Size in bytes, shown next to the name of a file. */
  size?: number
}

export interface ChatReaction {
  emoji: string
  /** Who reacted with it. The count is the length. */
  userIds: string[]
}

export interface ChatMessage {
  id: string
  authorId: string
  text?: string
  createdAt: Date | string | number
  attachments?: ChatAttachment[]
  reactions?: ChatReaction[]
  /** Users who have read up to this message. Each one is drawn under the last message they saw. */
  seenBy?: string[]
  /** Your own messages on their way: `sending` dims the bubble, `failed` says it was not sent. */
  status?: 'sending' | 'sent' | 'failed'
}

export interface ChatDraft {
  text: string
  files: File[]
}

const DEFAULT_REACTIONS = ['👍', '❤️', '😂', '🎉', '😮', '😢']

function toDate(value: Date | string | number) {
  return value instanceof Date ? value : new Date(value)
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

/** "1.2 MB" and friends, in the reader's locale. */
export function formatBytes(bytes: number, locale?: string) {
  const units = ['byte', 'kilobyte', 'megabyte', 'gigabyte'] as const
  let value = bytes
  let unit = 0
  while (value >= 1000 && unit < units.length - 1) {
    value /= 1000
    unit++
  }
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: units[unit],
    unitDisplay: 'short',
    maximumFractionDigits: value < 10 && unit > 0 ? 1 : 0,
  }).format(value)
}

function formatTime(date: Date, locale?: string) {
  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(date)
}

/** "Today", "Yesterday", or the date, with the year only when it is not this one. */
export function formatChatDay(date: Date, locale?: string, now = new Date()) {
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const days = Math.round((startOf(date) - startOf(now)) / 86_400_000)
  if (days === 0 || days === -1) {
    const word = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(days, 'day')
    return word.charAt(0).toLocaleUpperCase(locale) + word.slice(1)
  }
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  }).format(date)
}

function listNames(names: string[], locale?: string) {
  return new Intl.ListFormat(locale, { type: 'conjunction' }).format(names)
}

export type ChatRow =
  | { type: 'day'; key: string; date: Date }
  | { type: 'group'; key: string; authorId: string; messages: ChatMessage[] }

/**
 * Splits messages into day separators and runs of messages by the same author. A run breaks
 * when the author changes, the day changes, or more than `groupWithin` ms pass between two
 * messages.
 */
export function groupChatMessages(messages: ChatMessage[], groupWithin = 5 * 60_000): ChatRow[] {
  const rows: ChatRow[] = []
  let previous: { date: Date; authorId: string } | null = null
  let group: Extract<ChatRow, { type: 'group' }> | null = null
  for (const message of messages) {
    const date = toDate(message.createdAt)
    if (!previous || !sameDay(previous.date, date)) {
      rows.push({ type: 'day', key: `day-${message.id}`, date })
      group = null
    }
    if (
      !group ||
      !previous ||
      previous.authorId !== message.authorId ||
      date.getTime() - previous.date.getTime() > groupWithin
    ) {
      group = {
        type: 'group',
        key: `group-${message.id}`,
        authorId: message.authorId,
        messages: [],
      }
      rows.push(group)
    }
    group.messages.push(message)
    previous = { date, authorId: message.authorId }
  }
  return rows
}

export interface ChatThreadLabels {
  /** Name of the log of messages. */
  messages: string
  /** The button back down, after scrolling up. */
  jumpToLatest: string
  /** The same button once new messages arrive below. */
  newMessages: string
  /** How your own name reads, in the log and in who reacted. */
  you: string
  /** Name of the reactions under a message, and of the picker. */
  reactions: string
  addReaction: string
  reactWith: (emoji: string) => string
  /** Read receipts. The names come as one list, joined for the locale. */
  seenBy: (names: string) => string
  /** Who is typing. The names come as one list, joined for the locale. */
  typing: (names: string, count: number) => string
  /** Placeholder and name of the composer field. */
  message: string
  attach: string
  /** Name of the files waiting to be sent. */
  attachments: string
  remove: (name: string) => string
  send: string
  sending: string
  notSent: string
}

export const defaultChatThreadLabels: ChatThreadLabels = {
  messages: 'Messages',
  jumpToLatest: 'Jump to latest',
  newMessages: 'New messages',
  you: 'You',
  reactions: 'Reactions',
  addReaction: 'Add reaction',
  reactWith: (emoji) => `React with ${emoji}`,
  seenBy: (names) => `Seen by ${names}`,
  typing: (names, count) =>
    count > 2 ? `${count} people are typing` : `${names} ${count === 1 ? 'is' : 'are'} typing`,
  message: 'Message',
  attach: 'Attach files',
  attachments: 'Attachments',
  remove: (name) => `Remove ${name}`,
  send: 'Send',
  sending: 'Sending…',
  notSent: 'Not sent',
}

function UserAvatar({ user, className }: { user?: ChatUser; className?: string }) {
  return (
    <Avatar className={cn('size-8', className)}>
      {user?.avatar ? <AvatarImage src={user.avatar} alt="" /> : null}
      <AvatarFallback className="text-[0.6875rem]">{initials(user?.name ?? '?')}</AvatarFallback>
    </Avatar>
  )
}

export interface ChatMessagesProps extends React.ComponentProps<'div'> {
  /** Scrolls to the bottom whenever it changes, wherever the reader was. ChatThread passes the
   * id of your own latest message, so sending always shows what you sent. */
  scrollKey?: unknown
  /** Rendered after the log, inside the scrolling area. Where the typing indicator goes. */
  status?: React.ReactNode
  /** Text of the button that appears once the reader scrolls up. Default "Jump to latest". */
  jumpLabel?: string
}

/** Pixels from the bottom that still count as being at the bottom. */
const STICK = 48

/**
 * The scrolling log of messages. It keeps to the bottom while the reader is there, stays put
 * when they have scrolled up to read, and then offers a button back down, marked once new
 * messages arrive below.
 */
function ChatMessages({
  className,
  children,
  scrollKey,
  status,
  jumpLabel,
  'aria-label': ariaLabel,
  ...props
}: ChatMessagesProps) {
  const labels = useLabels('chat-thread', defaultChatThreadLabels)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const atBottom = React.useRef(true)
  const lastHeight = React.useRef(0)
  const [away, setAway] = React.useState(false)
  const [unseen, setUnseen] = React.useState(false)
  const reduced = useReducedMotion()

  const toBottom = React.useCallback(
    (smooth: boolean) => {
      const el = scrollRef.current
      if (!el) return
      if (smooth && !reduced && typeof el.scrollTo === 'function') {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
      } else {
        el.scrollTop = el.scrollHeight
      }
      atBottom.current = true
      setAway(false)
      setUnseen(false)
    },
    [reduced],
  )

  // Content changed: follow it down, or note that there is something new below.
  const follow = React.useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const grew = el.scrollHeight > lastHeight.current
    lastHeight.current = el.scrollHeight
    if (atBottom.current) el.scrollTop = el.scrollHeight
    else if (grew) setUnseen(true)
  }, [])

  // biome-ignore lint/correctness/useExhaustiveDependencies: runs whenever the messages change
  React.useLayoutEffect(follow, [children, status, follow])

  // biome-ignore lint/correctness/useExhaustiveDependencies: scrollKey is the trigger
  React.useLayoutEffect(() => {
    if (scrollKey !== undefined) toBottom(false)
  }, [scrollKey])

  // Images that finish loading make the log taller after the render that added them.
  React.useEffect(() => {
    const content = contentRef.current
    if (!content || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => follow())
    observer.observe(content)
    return () => observer.disconnect()
  }, [follow])

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < STICK
    atBottom.current = bottom
    setAway(!bottom)
    if (bottom) setUnseen(false)
  }

  return (
    <div data-slot="chat-messages" className={cn('relative min-h-0 flex-1', className)} {...props}>
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="size-full overflow-y-auto overscroll-contain outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        // Scrollable regions have to be reachable from the keyboard to be read.
        // biome-ignore lint/a11y/noNoninteractiveTabindex: the log scrolls on its own
        tabIndex={0}
      >
        <div ref={contentRef} className="flex min-h-full flex-col justify-end gap-3 p-4">
          <div role="log" aria-label={ariaLabel ?? labels.messages} className="flex flex-col gap-3">
            {children}
          </div>
          {status}
        </div>
      </div>
      {away ? (
        <button
          type="button"
          data-slot="chat-jump"
          data-unseen={unseen || undefined}
          onClick={() => toBottom(true)}
          className="fade-in-0 slide-in-from-bottom-2 absolute bottom-3 left-1/2 inline-flex h-8 -translate-x-1/2 animate-in items-center gap-1.5 rounded-full border bg-background px-3 font-medium text-xs shadow-md outline-none transition-colors duration-(--duration-fast,150ms) hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[unseen]:border-primary data-[unseen]:bg-primary data-[unseen]:text-primary-foreground motion-reduce:animate-none"
        >
          <ArrowDownIcon aria-hidden className="size-3.5" />
          {unseen ? labels.newMessages : (jumpLabel ?? labels.jumpToLatest)}
        </button>
      ) : null}
    </div>
  )
}

/** A line across the log with the day of the messages under it. */
function ChatDaySeparator({ className, children, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="chat-day"
      className={cn(
        'flex items-center gap-3 py-1 font-medium text-muted-foreground text-xs before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export interface ChatMessageGroupProps extends React.ComponentProps<'div'> {
  /** Who wrote the run. Drawn as an avatar and a name for other people. */
  author?: ChatUser
  /** Your own messages: on the right, no avatar, no name. */
  self?: boolean
  /** Shown next to the name, usually the time of the first message. */
  meta?: React.ReactNode
  /** Show the author's name above the run. Turn off for one to one chats. Default true. */
  showName?: boolean
}

/** One avatar for a run of messages by the same person. */
function ChatMessageGroup({
  author,
  self = false,
  meta,
  showName = true,
  className,
  children,
  ...props
}: ChatMessageGroupProps) {
  return (
    <div
      data-slot="chat-message-group"
      data-self={self || undefined}
      className={cn('flex items-end gap-2 data-[self]:flex-row-reverse', className)}
      {...props}
    >
      {self ? null : <UserAvatar user={author} className="mb-0.5" />}
      <div
        className={cn(
          'flex min-w-0 max-w-[85%] flex-col gap-1 sm:max-w-[75%]',
          self ? 'items-end' : 'items-start',
        )}
      >
        {(showName && !self && author) || meta ? (
          <div className="flex items-baseline gap-2 px-1 text-xs">
            {showName && !self && author ? (
              <span className="font-medium text-foreground">{author.name}</span>
            ) : null}
            {meta ? <span className="text-muted-foreground">{meta}</span> : null}
          </div>
        ) : null}
        {children}
      </div>
    </div>
  )
}

export interface ChatBubbleProps extends React.ComponentProps<'div'> {
  self?: boolean
  /** Where it sits in its run, which squares off the corners that touch a neighbour. */
  position?: 'single' | 'first' | 'middle' | 'last'
}

function ChatBubble({ self = false, position = 'single', className, ...props }: ChatBubbleProps) {
  const corners = self
    ? { single: '', first: 'rounded-br-md', middle: 'rounded-r-md', last: 'rounded-tr-md' }
    : { single: '', first: 'rounded-bl-md', middle: 'rounded-l-md', last: 'rounded-tl-md' }
  return (
    <div
      data-slot="chat-bubble"
      data-self={self || undefined}
      className={cn(
        'w-fit max-w-full whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm leading-relaxed',
        self ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
        corners[position],
        className,
      )}
      {...props}
    />
  )
}

function attachmentKind(attachment: ChatAttachment) {
  return attachment.kind ?? (attachment.type?.startsWith('image/') ? 'image' : 'file')
}

export interface ChatAttachmentsProps extends React.ComponentProps<'div'> {
  attachments: ChatAttachment[]
  self?: boolean
  locale?: string
}

/** Image thumbnails and file chips sent with a message. */
function ChatAttachments({
  attachments,
  self = false,
  locale: localeProp,
  className,
  ...props
}: ChatAttachmentsProps) {
  const locale = useLocale(localeProp)
  return (
    <div
      data-slot="chat-attachments"
      className={cn('flex max-w-full flex-wrap gap-1.5', self && 'justify-end', className)}
      {...props}
    >
      {attachments.map((attachment) => {
        if (attachmentKind(attachment) === 'image' && attachment.url) {
          return (
            <a
              key={attachment.id}
              href={attachment.url}
              target="_blank"
              rel="noreferrer"
              className="block overflow-hidden rounded-2xl border outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <img
                src={attachment.url}
                alt={attachment.name}
                loading="lazy"
                className="block max-h-48 w-auto max-w-60 object-cover"
              />
            </a>
          )
        }
        const body = (
          <>
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
              <FileIcon aria-hidden className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-medium text-sm">{attachment.name}</span>
              {attachment.size !== undefined ? (
                <span className="block text-muted-foreground text-xs">
                  {formatBytes(attachment.size, locale)}
                </span>
              ) : null}
            </span>
          </>
        )
        const chip =
          'flex min-w-0 max-w-64 items-center gap-2.5 rounded-2xl border bg-card py-2 pr-3.5 pl-2 text-card-foreground'
        return attachment.url ? (
          <a
            key={attachment.id}
            href={attachment.url}
            target="_blank"
            rel="noreferrer"
            download={attachment.name}
            className={cn(
              chip,
              'outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50',
            )}
          >
            {body}
          </a>
        ) : (
          <div key={attachment.id} className={chip}>
            {body}
          </div>
        )
      })}
    </div>
  )
}

export interface ChatReactionsProps extends Omit<React.ComponentProps<'div'>, 'onToggle'> {
  reactions: ChatReaction[]
  /** Marks the reactions that are yours, which pressing removes. */
  currentUserId?: string
  /** Looks up names for the tooltip of who reacted. */
  users?: ChatUser[]
  /** Called with the emoji pressed. Without it the reactions are only shown. */
  onToggle?: (emoji: string) => void
}

/** Emoji with their counts, pressed for the ones you added. */
function ChatReactions({
  reactions,
  currentUserId,
  users,
  onToggle,
  className,
  ...props
}: ChatReactionsProps) {
  const labels = useLabels('chat-thread', defaultChatThreadLabels)
  const shown = reactions.filter((reaction) => reaction.userIds.length > 0)
  if (shown.length === 0) return null
  const nameOf = (id: string) =>
    id === currentUserId ? labels.you : (users?.find((u) => u.id === id)?.name ?? id)
  return (
    // biome-ignore lint/a11y/useSemanticElements: a fieldset would bring its own box model
    <div
      data-slot="chat-reactions"
      role="group"
      aria-label={labels.reactions}
      className={cn('flex flex-wrap gap-1', className)}
      {...props}
    >
      {shown.map((reaction) => {
        const mine = currentUserId !== undefined && reaction.userIds.includes(currentUserId)
        const count = reaction.userIds.length
        return (
          <button
            key={reaction.emoji}
            type="button"
            aria-pressed={mine}
            aria-label={`${reaction.emoji} ${count}`}
            title={reaction.userIds.map(nameOf).join(', ')}
            disabled={!onToggle}
            onClick={() => onToggle?.(reaction.emoji)}
            className="inline-flex h-6 items-center gap-1 rounded-full border bg-background px-2 text-xs tabular-nums outline-none transition-colors duration-(--duration-fast,150ms) hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none aria-pressed:border-primary/30 aria-pressed:bg-primary/10"
          >
            <span aria-hidden>{reaction.emoji}</span>
            <span aria-hidden className="text-muted-foreground">
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export interface ChatReactionPickerProps {
  /** Called with the emoji picked. */
  onPick: (emoji: string) => void
  /** The emoji offered. */
  reactions?: string[]
  className?: string
}

/** A button that opens a row of emoji to react with. */
function ChatReactionPicker({
  onPick,
  reactions = DEFAULT_REACTIONS,
  className,
}: ChatReactionPickerProps) {
  const labels = useLabels('chat-thread', defaultChatThreadLabels)
  const [open, setOpen] = React.useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={labels.addReaction}
          data-slot="chat-reaction-picker"
          className={cn(
            'grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground opacity-0 outline-none transition-[opacity,background-color] duration-(--duration-fast,150ms) hover:bg-accent hover:text-foreground focus-visible:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring/50 group-hover/message:opacity-100 data-[state=open]:opacity-100 pointer-coarse:opacity-100',
            className,
          )}
        >
          <SmilePlusIcon aria-hidden className="size-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        className="flex w-auto gap-0.5 rounded-full p-1"
        aria-label={labels.reactions}
      >
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

export interface ChatSeenByProps extends React.ComponentProps<'div'> {
  users: ChatUser[]
  locale?: string
}

/** Small avatars of the people who have read up to here. */
function ChatSeenBy({ users, locale: localeProp, className, ...props }: ChatSeenByProps) {
  const labels = useLabels('chat-thread', defaultChatThreadLabels)
  const locale = useLocale(localeProp)
  if (users.length === 0) return null
  const label = labels.seenBy(
    listNames(
      users.map((u) => u.name),
      locale,
    ),
  )
  return (
    <div
      data-slot="chat-seen-by"
      role="img"
      aria-label={label}
      title={label}
      className={cn('flex items-center -space-x-1 px-1', className)}
      {...props}
    >
      {users.slice(0, 4).map((user) => (
        <UserAvatar
          key={user.id}
          user={user}
          className="size-4 ring-2 ring-background [&_[data-slot=avatar-fallback]]:text-[0.4375rem]"
        />
      ))}
      {users.length > 4 ? (
        <span className="pl-1.5 text-[0.625rem] text-muted-foreground">+{users.length - 4}</span>
      ) : null}
    </div>
  )
}

export interface ChatTypingIndicatorProps extends React.ComponentProps<'div'> {
  /** Who is typing. Nothing renders when it is empty. */
  users: ChatUser[]
  locale?: string
}

/** Three dots in a bubble, with who is typing for screen readers. */
function ChatTypingIndicator({
  users,
  locale: localeProp,
  className,
  ...props
}: ChatTypingIndicatorProps) {
  const labels = useLabels('chat-thread', defaultChatThreadLabels)
  const locale = useLocale(localeProp)
  const text =
    users.length === 0
      ? ''
      : labels.typing(
          listNames(
            users.map((u) => u.name),
            locale,
          ),
          users.length,
        )
  return (
    <div
      data-slot="chat-typing"
      role="status"
      className={cn('flex items-end gap-2', users.length === 0 && 'hidden', className)}
      {...props}
    >
      {users.length > 0 ? (
        <>
          <UserAvatar user={users[0]} />
          <div
            aria-hidden
            className="fade-in-0 slide-in-from-bottom-1 flex h-9 animate-in items-center gap-1 rounded-2xl rounded-bl-md bg-muted px-3.5 motion-reduce:animate-none"
          >
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                className="size-1.5 rounded-full bg-muted-foreground animate-[chat-typing_1.2s_ease-in-out_infinite] motion-reduce:animate-none"
                style={{ animationDelay: `${dot * 0.15}s` }}
              />
            ))}
          </div>
          <span className="sr-only">{text}</span>
        </>
      ) : null}
    </div>
  )
}

interface PendingFile {
  id: string
  file: File
  /** Object URL for image previews. */
  url?: string
}

export interface ChatComposerProps
  extends Omit<React.ComponentProps<'form'>, 'onSubmit' | 'children'> {
  /** Called with the text, trimmed, and the files attached. The field empties afterwards. */
  onSend: (draft: ChatDraft) => void
  /** Also the accessible name of the field. Default "Message". */
  placeholder?: string
  disabled?: boolean
  /** Offer the attach button and accept pasted files. Default true. */
  allowAttachments?: boolean
  /** File types the picker offers, like the `accept` of a file input. */
  accept?: string
}

let fileCounter = 0

/**
 * A field that grows with what you write. Enter sends, Shift+Enter starts a new line, and
 * files come from the attach button or from pasting them in.
 */
function ChatComposer({
  onSend,
  placeholder: placeholderProp,
  disabled = false,
  allowAttachments = true,
  accept,
  className,
  ...props
}: ChatComposerProps) {
  const labels = useLabels('chat-thread', defaultChatThreadLabels)
  const placeholder = placeholderProp ?? labels.message
  const [text, setText] = React.useState('')
  const [files, setFiles] = React.useState<PendingFile[]>([])
  const fieldRef = React.useRef<HTMLTextAreaElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const filesRef = React.useRef(files)
  filesRef.current = files

  // Grow with the content; the max height in the classes takes over from there.
  // biome-ignore lint/correctness/useExhaustiveDependencies: measures after every change of text
  React.useLayoutEffect(() => {
    const field = fieldRef.current
    if (!field) return
    field.style.height = '0px'
    field.style.height = `${field.scrollHeight}px`
  }, [text])

  // Object URLs hold the file in memory until they are revoked.
  React.useEffect(
    () => () => {
      for (const pending of filesRef.current) if (pending.url) URL.revokeObjectURL(pending.url)
    },
    [],
  )

  const addFiles = (list: FileList | File[]) => {
    const added = Array.from(list).map((file) => ({
      id: `file-${++fileCounter}`,
      file,
      url:
        file.type.startsWith('image/') && typeof URL.createObjectURL === 'function'
          ? URL.createObjectURL(file)
          : undefined,
    }))
    if (added.length) setFiles((current) => [...current, ...added])
  }

  const removeFile = (id: string) => {
    setFiles((current) => {
      const gone = current.find((f) => f.id === id)
      if (gone?.url) URL.revokeObjectURL(gone.url)
      return current.filter((f) => f.id !== id)
    })
    fieldRef.current?.focus()
  }

  const trimmed = text.trim()
  const canSend = !disabled && (trimmed.length > 0 || files.length > 0)

  const send = () => {
    if (!canSend) return
    onSend({ text: trimmed, files: files.map((f) => f.file) })
    for (const pending of files) if (pending.url) URL.revokeObjectURL(pending.url)
    setText('')
    setFiles([])
    fieldRef.current?.focus()
  }

  return (
    <form
      data-slot="chat-composer"
      className={cn('flex items-end gap-2 bg-background p-3', className)}
      onSubmit={(event) => {
        event.preventDefault()
        send()
      }}
      {...props}
    >
      {allowAttachments ? (
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground"
            aria-label={labels.attach}
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
          >
            <PaperclipIcon />
          </Button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={accept}
            hidden
            tabIndex={-1}
            onChange={(event) => {
              if (event.target.files) addFiles(event.target.files)
              // Picking the same file twice in a row still fires a change.
              event.target.value = ''
            }}
          />
        </>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col gap-2 rounded-2xl border border-input bg-transparent px-3 py-2 shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 dark:bg-input/30">
        {files.length > 0 ? (
          <ul aria-label={labels.attachments} className="flex flex-wrap gap-1.5">
            {files.map((pending) => (
              <li
                key={pending.id}
                className="relative flex h-12 max-w-48 items-center gap-2 overflow-hidden rounded-lg border bg-muted/50 pr-7 text-xs"
              >
                {pending.url ? (
                  <img src={pending.url} alt="" className="size-12 shrink-0 object-cover" />
                ) : (
                  <FileIcon aria-hidden className="ml-2 size-4 shrink-0 text-muted-foreground" />
                )}
                <span className="truncate">{pending.file.name}</span>
                <button
                  type="button"
                  aria-label={labels.remove(pending.file.name)}
                  onClick={() => removeFile(pending.id)}
                  className="absolute top-1 right-1 grid size-5 place-items-center rounded-full bg-background/80 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <XIcon aria-hidden className="size-3" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <textarea
          ref={fieldRef}
          rows={1}
          value={text}
          disabled={disabled}
          placeholder={placeholder}
          aria-label={placeholder}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            // Keys pressed while an IME is composing belong to the composition.
            if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
            event.preventDefault()
            send()
          }}
          onPaste={(event) => {
            if (!allowAttachments || event.clipboardData.files.length === 0) return
            event.preventDefault()
            addFiles(event.clipboardData.files)
          }}
          className="max-h-40 min-h-5 w-full resize-none bg-transparent text-base leading-5 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed md:text-sm"
        />
      </div>
      <Button
        type="submit"
        size="icon"
        className="rounded-full"
        aria-label={labels.send}
        disabled={!canSend}
      >
        <SendHorizontalIcon />
      </Button>
    </form>
  )
}

export interface ChatThreadProps extends Omit<React.ComponentProps<'div'>, 'onSubmit'> {
  /** Oldest first. */
  messages: ChatMessage[]
  /** Everyone who can appear in the thread, for names and avatars. */
  users: ChatUser[]
  /** Your id. Your messages sit on the right and your reactions show as pressed. */
  currentUserId: string
  /** Called when the composer sends. Without it there is no composer. */
  onSend?: (draft: ChatDraft) => void
  /**
   * Called when a reaction is added or taken away. `added` is false when you pressed one of
   * your own. Without it reactions are shown but cannot be changed.
   */
  onReact?: (messageId: string, emoji: string, added: boolean) => void
  /** Ids of the people typing right now. */
  typing?: string[]
  /** Emoji offered by the reaction picker. */
  reactions?: string[]
  /** Milliseconds between two messages that still share one avatar. Default five minutes. */
  groupWithin?: number
  /** Show names above other people's runs. Turn off for one to one chats. Default true. */
  showNames?: boolean
  /** Locale for times, days and lists of names. Default the reader's. */
  locale?: string
  /** Props for the composer, such as `placeholder`, `accept` or `disabled`. */
  composerProps?: Omit<ChatComposerProps, 'onSend'>
  /** Words to use instead of the English ones. A `LabelsProvider` sets them for the whole app. */
  labels?: Partial<ChatThreadLabels>
}

/**
 * A whole conversation from data: runs of messages under one avatar, day separators,
 * reactions, read receipts, a typing indicator, attachments and a composer. Every piece is
 * also exported to build your own.
 */
function ChatThread({
  messages,
  users,
  currentUserId,
  onSend,
  onReact,
  typing = [],
  reactions = DEFAULT_REACTIONS,
  groupWithin,
  showNames = true,
  locale: localeProp,
  composerProps,
  labels: labelsProp,
  className,
  'aria-label': ariaLabel,
  ...props
}: ChatThreadProps) {
  const labels = useLabels('chat-thread', defaultChatThreadLabels, labelsProp)
  const locale = useLocale(localeProp)
  // The parts read their words from the provider, so the `labels` prop reaches them through one.
  const pack = React.useMemo(() => ({ 'chat-thread': labels }), [labels])
  const byId = React.useMemo(() => new Map(users.map((user) => [user.id, user])), [users])
  const rows = React.useMemo(
    () => groupChatMessages(messages, groupWithin),
    [messages, groupWithin],
  )

  // Each reader is drawn once, under the last message they have seen.
  const seenAt = React.useMemo(() => {
    const last = new Map<string, string>()
    for (const message of messages) {
      for (const id of message.seenBy ?? []) if (id !== currentUserId) last.set(id, message.id)
    }
    const at = new Map<string, ChatUser[]>()
    for (const [userId, messageId] of last) {
      const user = byId.get(userId)
      if (user) at.set(messageId, [...(at.get(messageId) ?? []), user])
    }
    return at
  }, [messages, currentUserId, byId])

  // Messages that were already there when the thread mounted come in without an animation.
  const fresh = React.useRef<Map<string, boolean> | null>(null)
  if (fresh.current === null) fresh.current = new Map(messages.map((m) => [m.id, false]))
  for (const message of messages) {
    if (!fresh.current.has(message.id)) fresh.current.set(message.id, true)
  }

  const ownLatest = React.useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.authorId === currentUserId) return messages[i]?.id
    }
    return undefined
  }, [messages, currentUserId])

  const typingUsers = typing
    .filter((id) => id !== currentUserId)
    .map((id) => byId.get(id))
    .filter((user): user is ChatUser => !!user)

  return (
    <LabelsProvider labels={pack}>
      <div
        data-slot="chat-thread"
        className={cn(
          'flex h-full min-h-0 flex-col overflow-hidden rounded-xl border bg-background text-foreground',
          className,
        )}
        {...props}
      >
        <ChatMessages
          aria-label={ariaLabel}
          scrollKey={ownLatest}
          status={<ChatTypingIndicator users={typingUsers} locale={locale} />}
        >
          {rows.map((row) => {
            if (row.type === 'day') {
              const label = formatChatDay(row.date, locale)
              return (
                <ChatDaySeparator key={row.key} role="separator" aria-label={label}>
                  {label}
                </ChatDaySeparator>
              )
            }
            const self = row.authorId === currentUserId
            const author = byId.get(row.authorId)
            const first = row.messages[0] as ChatMessage
            const firstDate = toDate(first.createdAt)
            return (
              <ChatMessageGroup
                key={row.key}
                author={author}
                self={self}
                showName={showNames}
                meta={
                  <time dateTime={firstDate.toISOString()}>{formatTime(firstDate, locale)}</time>
                }
              >
                {row.messages.map((message, index) => {
                  const count = row.messages.length
                  const position =
                    count === 1
                      ? 'single'
                      : index === 0
                        ? 'first'
                        : index === count - 1
                          ? 'last'
                          : 'middle'
                  const date = toDate(message.createdAt)
                  const seen = seenAt.get(message.id)
                  const toggle = (emoji: string) => {
                    const mine = message.reactions
                      ?.find((r) => r.emoji === emoji)
                      ?.userIds.includes(currentUserId)
                    onReact?.(message.id, emoji, !mine)
                  }
                  return (
                    <div
                      key={message.id}
                      data-slot="chat-message"
                      data-status={message.status}
                      className={cn(
                        'group/message flex max-w-full flex-col gap-1',
                        self ? 'items-end' : 'items-start',
                        fresh.current?.get(message.id) &&
                          'fade-in-0 slide-in-from-bottom-2 animate-in duration-(--duration-normal,200ms) motion-reduce:animate-none',
                      )}
                    >
                      <div className="relative flex max-w-full">
                        <div
                          className={cn(
                            'flex min-w-0 flex-col gap-1',
                            self ? 'items-end' : 'items-start',
                            message.status === 'sending' && 'opacity-60',
                          )}
                        >
                          <span className="sr-only">
                            {self ? labels.you : (author?.name ?? '')}:{' '}
                          </span>
                          {message.attachments?.length ? (
                            <ChatAttachments
                              attachments={message.attachments}
                              self={self}
                              locale={locale}
                            />
                          ) : null}
                          {message.text ? (
                            <ChatBubble
                              self={self}
                              position={position}
                              title={formatTime(date, locale)}
                            >
                              {message.text}
                            </ChatBubble>
                          ) : null}
                        </div>
                        {onReact ? (
                          // Beside the bubble without taking any of its width.
                          <ChatReactionPicker
                            reactions={reactions}
                            onPick={toggle}
                            className={cn(
                              'absolute top-1/2 -translate-y-1/2',
                              self ? 'right-full mr-1' : 'left-full ml-1',
                            )}
                          />
                        ) : null}
                      </div>
                      {message.reactions?.length ? (
                        <ChatReactions
                          reactions={message.reactions}
                          currentUserId={currentUserId}
                          users={users}
                          onToggle={onReact ? toggle : undefined}
                        />
                      ) : null}
                      {message.status === 'failed' ? (
                        <p className="flex items-center gap-1 px-1 text-destructive text-xs">
                          <CircleAlertIcon aria-hidden className="size-3.5" />
                          {labels.notSent}
                        </p>
                      ) : message.status === 'sending' ? (
                        <p className="px-1 text-muted-foreground text-xs">{labels.sending}</p>
                      ) : null}
                      {seen ? <ChatSeenBy users={seen} locale={locale} /> : null}
                    </div>
                  )
                })}
              </ChatMessageGroup>
            )
          })}
        </ChatMessages>
        {onSend ? <ChatComposer onSend={onSend} className="border-t" {...composerProps} /> : null}
      </div>
    </LabelsProvider>
  )
}

export {
  ChatAttachments,
  ChatBubble,
  ChatComposer,
  ChatDaySeparator,
  ChatMessageGroup,
  ChatMessages,
  ChatReactionPicker,
  ChatReactions,
  ChatSeenBy,
  ChatThread,
  ChatTypingIndicator,
}
