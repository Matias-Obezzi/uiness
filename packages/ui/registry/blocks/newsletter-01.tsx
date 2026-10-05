'use client'

import { ArrowRightIcon, MailCheckIcon, MailIcon } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'

export interface NewsletterIssue {
  /** The issue number, shown as `No. 42`. */
  number: number
  title: string
  /** A short line under the title. */
  excerpt?: string
  /** Shown in the corner, like `Sep 26`. */
  date?: string
}

export interface NewsletterLabels {
  email: string
  placeholder: string
  submit: string
  pending: string
  /** Shown for an empty field or an address that does not look like one. */
  invalid: string
  /** Shown when `onSubscribe` throws without a message of its own. */
  error: string
  successTitle: string
  /** `{email}` is replaced with the address. */
  successDescription: string
  /** Resets the form after subscribing. */
  again: string
  /** On the card that lands on the stack. */
  to: string
  issue: string
}

export interface Newsletter01Props extends Omit<React.ComponentProps<'section'>, 'title'> {
  /** The small line above the heading. `null` hides it. */
  eyebrow?: React.ReactNode | null
  title?: React.ReactNode
  description?: React.ReactNode | null
  /** Past issues, newest first. The first three make the stack. */
  issues?: NewsletterIssue[]
  /** The card that lands on the stack, addressed to whoever subscribed. */
  nextIssue?: Omit<NewsletterIssue, 'number'> & { number?: number }
  /** Called with the address. Return a promise to show the pending state; throw to show an error. */
  onSubscribe?: (email: string) => void | Promise<void>
  /** A line under the form, like a reader count. `null` hides it. */
  note?: React.ReactNode | null
  labels?: Partial<NewsletterLabels>
}

const defaultIssues: NewsletterIssue[] = [
  {
    number: 42,
    title: 'Designing for the second visit',
    excerpt: 'What returning users notice, and what they never should.',
    date: 'Sep 26',
  },
  {
    number: 41,
    title: 'The quiet power of defaults',
    excerpt: 'Most people never change a setting. Pick well.',
    date: 'Sep 12',
  },
  {
    number: 40,
    title: 'Motion that explains',
    excerpt: 'Animation as a sentence, not a decoration.',
    date: 'Aug 29',
  },
]

const defaultLabels: NewsletterLabels = {
  email: 'Email address',
  placeholder: 'you@example.com',
  submit: 'Subscribe',
  pending: 'Subscribing…',
  invalid: 'Enter an email address like name@example.com.',
  error: 'Something went wrong. Try again in a moment.',
  successTitle: 'You’re on the list',
  successDescription: 'The next issue goes to {email}. Look for it on Friday.',
  again: 'Use another address',
  to: 'To',
  issue: 'No.',
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

const reducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** How each card behind the front one sits, and how far it fans out on hover. */
const fan = [
  'rotate-0 group-hover/stack:-translate-y-1',
  '-translate-x-2 -translate-y-3 -rotate-3 group-hover/stack:-translate-x-6 group-hover/stack:-translate-y-5 group-hover/stack:-rotate-6',
  'translate-x-2 -translate-y-6 rotate-3 group-hover/stack:translate-x-6 group-hover/stack:-translate-y-9 group-hover/stack:rotate-6',
]

/**
 * An email signup beside a fanned stack of past issues. Subscribing drops the next issue onto
 * the front of the stack, addressed to the email just entered, while the form turns into a
 * thank you. The address is checked before anything is sent.
 */
function Newsletter01({
  eyebrow = 'The Field Notes newsletter',
  title = 'One good idea about product design, every other Friday',
  description = 'Short essays on interfaces, writing and craft, from people who ship. No tracking pixels, unsubscribe in one click.',
  issues = defaultIssues,
  nextIssue = { title: 'Your first issue', excerpt: 'Coming Friday, straight to your inbox.' },
  onSubscribe = () => wait(700),
  note = 'Join 18,000 designers and engineers.',
  labels: labelsProp,
  className,
  ...props
}: Newsletter01Props) {
  const labels = { ...defaultLabels, ...labelsProp }
  const headingId = React.useId()
  const emailId = React.useId()
  const errorId = React.useId()
  const [email, setEmail] = React.useState('')
  const [status, setStatus] = React.useState<'idle' | 'pending' | 'done'>('idle')
  const [error, setError] = React.useState<string | null>(null)
  const [subscriber, setSubscriber] = React.useState<string | null>(null)
  const input = React.useRef<HTMLInputElement>(null)
  const again = React.useRef<HTMLButtonElement>(null)

  const stack = issues.slice(0, 3)
  const number = nextIssue.number ?? (issues[0]?.number ?? 0) + 1

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (status === 'pending') return
    const value = email.trim()
    if (!EMAIL.test(value)) {
      setError(labels.invalid)
      input.current?.focus()
      return
    }
    setError(null)
    setStatus('pending')
    try {
      await onSubscribe(value)
      setSubscriber(value)
      setStatus('done')
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : labels.error)
      setStatus('idle')
    }
  }

  React.useEffect(() => {
    if (status === 'done') again.current?.focus()
  }, [status])

  return (
    <section
      data-slot="block-newsletter-01"
      aria-labelledby={headingId}
      className={cn('@container w-full overflow-hidden', className)}
      {...props}
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 @3xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] @3xl:gap-16 @3xl:py-24">
        <div>
          {eyebrow != null && (
            <p className="mb-3 text-eyebrow text-muted-foreground uppercase">{eyebrow}</p>
          )}
          <h2 id={headingId} className="text-balance text-title">
            {title}
          </h2>
          {description != null && (
            <p className="mt-4 text-pretty text-lead text-muted-foreground">{description}</p>
          )}

          <div aria-live="polite" className="mt-8 max-w-md">
            {status === 'done' ? (
              <div className="flex items-start gap-3 rounded-2xl border bg-muted/40 p-4 duration-(--duration-slow,300ms) animate-in fade-in-0 zoom-in-95 motion-reduce:animate-none">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <MailCheckIcon aria-hidden className="size-4" />
                </span>
                <div className="min-w-0 text-sm">
                  <p className="font-medium">{labels.successTitle}</p>
                  <p className="mt-0.5 break-words text-muted-foreground">
                    {labels.successDescription.replace('{email}', subscriber ?? '')}
                  </p>
                  <button
                    ref={again}
                    type="button"
                    onClick={() => {
                      setStatus('idle')
                      setEmail('')
                    }}
                    className="mt-2 rounded-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    {labels.again}
                  </button>
                </div>
              </div>
            ) : (
              <form noValidate onSubmit={submit} className="flex flex-col gap-2">
                <Label htmlFor={emailId} className="sr-only">
                  {labels.email}
                </Label>
                <div className="flex flex-col gap-2 @md:flex-row">
                  <div className="relative flex-1">
                    <MailIcon
                      aria-hidden
                      className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      ref={input}
                      id={emailId}
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (error) setError(null)
                      }}
                      placeholder={labels.placeholder}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? errorId : undefined}
                      className="h-10 bg-background pl-9"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    loading={status === 'pending'}
                    className="group/submit"
                  >
                    {status === 'pending' ? labels.pending : labels.submit}
                    {status !== 'pending' && (
                      <ArrowRightIcon
                        aria-hidden
                        className="transition-transform duration-(--duration-fast,150ms) group-hover/submit:translate-x-0.5"
                      />
                    )}
                  </Button>
                </div>
                {error && (
                  <p id={errorId} role="alert" className="text-destructive text-sm">
                    {error}
                  </p>
                )}
              </form>
            )}
            {note != null && status !== 'done' && (
              <p className="mt-3 text-caption text-muted-foreground">{note}</p>
            )}
          </div>
        </div>

        <IssueStack
          stack={stack}
          next={subscriber ? { ...nextIssue, number, to: subscriber } : null}
          labels={labels}
        />
      </div>
    </section>
  )
}

function IssueStack({
  stack,
  next,
  labels,
}: {
  stack: NewsletterIssue[]
  next: (NewsletterIssue & { to: string }) | null
  labels: NewsletterLabels
}) {
  const nextRef = React.useRef<HTMLLIElement>(null)
  const landed = next?.to

  // The new issue falls onto the pile from above with a little spin, like a letter dropped
  // on a desk. Played with the Web Animations API so there is no keyframe to install.
  React.useLayoutEffect(() => {
    const el = nextRef.current
    if (!landed || !el || typeof el.animate !== 'function' || reducedMotion()) return
    el.animate(
      [
        { transform: 'translate(-12%, -70%) rotate(-14deg)', opacity: 0 },
        { opacity: 1, offset: 0.35 },
        { transform: 'translate(0, 4%) rotate(1deg)', offset: 0.75 },
        { transform: 'translate(0, 0) rotate(-2deg)', opacity: 1 },
      ],
      { duration: 700, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'backwards' },
    )
  }, [landed])

  // With a new issue on top, the old ones move one place back.
  const offset = next ? 1 : 0
  return (
    <div className="mx-auto w-full max-w-sm px-4 pt-8 @3xl:max-w-md">
      <ol
        aria-label="Recent issues"
        className="group/stack relative grid aspect-[4/3] w-full [&>li]:[grid-area:1/1]"
      >
        {stack
          .map((issue, i) => ({ issue, depth: i + offset }))
          .filter(({ depth }) => depth < fan.length)
          .reverse()
          .map(({ issue, depth }) => (
            <li
              key={issue.number}
              className={cn(
                'transition-transform duration-(--duration-slower,500ms) ease-(--easing-emphasized,ease-out) motion-reduce:transition-none',
                fan[depth],
              )}
            >
              <IssueCard issue={issue} labels={labels} faded={depth > 0} />
            </li>
          ))}
        {next && (
          <li
            ref={nextRef}
            data-slot="newsletter-next-issue"
            className="-rotate-2 transition-transform duration-(--duration-slower,500ms) ease-(--easing-emphasized,ease-out) group-hover/stack:-translate-y-1 motion-reduce:transition-none"
          >
            <IssueCard issue={next} labels={labels} to={next.to} />
          </li>
        )}
      </ol>
    </div>
  )
}

function IssueCard({
  issue,
  labels,
  to,
  faded,
}: {
  issue: NewsletterIssue
  labels: NewsletterLabels
  to?: string
  faded?: boolean
}) {
  return (
    <article
      className={cn(
        'flex size-full flex-col overflow-hidden rounded-2xl border bg-card p-5 shadow-lg @md:p-6',
        to && 'ring-2 ring-primary/40',
      )}
    >
      <div className="flex items-center justify-between gap-3 text-caption text-muted-foreground">
        <span className="font-mono">
          {labels.issue} {issue.number}
        </span>
        {issue.date && <span>{issue.date}</span>}
      </div>
      <div
        aria-hidden
        className="mt-4 h-1.5 w-12 rounded-full bg-linear-to-r from-primary to-primary/40"
      />
      <h3
        className={cn(
          'mt-4 text-balance font-semibold text-xl leading-snug tracking-tight @md:text-2xl',
          faded && 'text-foreground/80',
        )}
      >
        {issue.title}
      </h3>
      {issue.excerpt && (
        <p className="mt-2 line-clamp-2 text-muted-foreground text-sm">{issue.excerpt}</p>
      )}
      <div aria-hidden className="mt-auto flex flex-col gap-1.5 pt-4">
        <span className="h-1.5 w-full rounded-full bg-muted" />
        <span className="h-1.5 w-4/5 rounded-full bg-muted" />
      </div>
      {to && (
        <p className="mt-4 flex min-w-0 items-center gap-2 border-t border-dashed pt-3 text-sm">
          <span className="text-muted-foreground">{labels.to}</span>
          <span className="truncate font-medium">{to}</span>
        </p>
      )}
    </article>
  )
}

export { Newsletter01 }
