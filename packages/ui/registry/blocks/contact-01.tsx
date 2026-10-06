'use client'

import {
  ArrowRightIcon,
  CheckIcon,
  LifeBuoyIcon,
  type LucideIcon,
  MailIcon,
  MapPinIcon,
  MessagesSquareIcon,
  SendIcon,
} from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { Textarea } from '@/ui/textarea'

export interface ContactChannel {
  icon?: LucideIcon
  title: string
  description: string
  /** The link text, like an address or "Start a chat". */
  label: string
  href: string
}

export interface ContactOffice {
  city: string
  /** One line, or a few separated by commas. */
  address: string
  /** An IANA time zone, like `Europe/Lisbon`. The card shows the time there. */
  timeZone: string
  /** Opening hours in local time, as `[open, close]` hours on weekdays. Default 9 to 18. */
  hours?: [number, number]
}

export interface ContactValues {
  name: string
  email: string
  company: string
  message: string
}

export interface ContactLabels {
  name: string
  email: string
  company: string
  optional: string
  message: string
  messagePlaceholder: string
  submit: string
  pending: string
  required: string
  invalidEmail: string
  /** `{min}` is replaced with the shortest allowed length. */
  tooShort: string
  /** Shown when `onSubmit` throws without a message of its own. */
  error: string
  successTitle: string
  /** `{name}` and `{email}` are replaced. */
  successDescription: string
  again: string
  offices: string
  open: string
  closed: string
}

/** Who people are writing to. The same shape as the `brand` of the other blocks. */
export interface ContactBrand {
  /** Named in the default description. */
  name: string
  /** For the default addresses, like `sales@acme.com`. Default the name in lower case with `.com`. */
  domain?: string
}

export interface Contact01Props
  extends Omit<React.ComponentProps<'section'>, 'title' | 'onSubmit'> {
  brand?: ContactBrand
  /** The small line above the heading. `null` hides it. */
  eyebrow?: React.ReactNode | null
  title?: React.ReactNode
  description?: React.ReactNode | null
  /** Called with the values once they pass. Return a promise to wait; throw to show an error. */
  onSubmit?: (values: ContactValues) => void | Promise<void>
  /** Ways to reach you besides the form. The default ones write to the brand's domain. An empty list hides them. */
  channels?: ContactChannel[]
  /** Office cards with their local time. An empty list hides them. */
  offices?: ContactOffice[]
  /** Shortest message accepted. Default 20 characters. */
  minMessage?: number
  /** Locale for the clocks. Defaults to the browser's. */
  locale?: string
  labels?: Partial<ContactLabels>
}

const defaultBrand: ContactBrand = { name: 'Acme', domain: 'acme.com' }

const domainOf = (brand: ContactBrand) =>
  brand.domain ?? `${brand.name.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com`

const defaultChannels = (domain: string): ContactChannel[] => [
  {
    icon: MessagesSquareIcon,
    title: 'Talk to sales',
    description: 'Pricing, security reviews and volume plans.',
    label: `sales@${domain}`,
    href: `mailto:sales@${domain}`,
  },
  {
    icon: LifeBuoyIcon,
    title: 'Get support',
    description: 'Help with your workspace, any time of day.',
    label: 'Open the help center',
    href: '#',
  },
  {
    icon: MailIcon,
    title: 'Press',
    description: 'Stories, logos and interviews.',
    label: `press@${domain}`,
    href: `mailto:press@${domain}`,
  },
]

const defaultOffices: ContactOffice[] = [
  { city: 'Lisbon', address: 'Rua do Alecrim 12, 1200-018', timeZone: 'Europe/Lisbon' },
  { city: 'New York', address: '75 Spring St, NY 10012', timeZone: 'America/New_York' },
  { city: 'Tokyo', address: '2-11-3 Meguro, 153-0063', timeZone: 'Asia/Tokyo' },
]

const defaultLabels: ContactLabels = {
  name: 'Name',
  email: 'Work email',
  company: 'Company',
  optional: 'optional',
  message: 'How can we help?',
  messagePlaceholder: 'Tell us a little about your team and what you need.',
  submit: 'Send message',
  pending: 'Sending…',
  required: 'This field is required.',
  invalidEmail: 'Enter an email address like name@company.com.',
  tooShort: 'A few more words, please: at least {min} characters.',
  error: 'Your message did not go through. Try again in a moment.',
  successTitle: 'Message sent',
  successDescription: 'Thanks, {name}. We will reply to {email} within one business day.',
  again: 'Send another message',
  offices: 'Our offices',
  open: 'Open now',
  closed: 'Closed',
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''))

type Field = keyof ContactValues
type Errors = Partial<Record<Field, string>>

/** One clock for every card on the page, ticking while anything listens. */
const clock = {
  now: null as Date | null,
  listeners: new Set<() => void>(),
  timer: undefined as ReturnType<typeof setInterval> | undefined,
  subscribe(listener: () => void) {
    clock.listeners.add(listener)
    if (clock.listeners.size === 1) {
      clock.now = new Date()
      clock.timer = setInterval(() => {
        clock.now = new Date()
        for (const l of clock.listeners) l()
      }, 1000)
    }
    return () => {
      clock.listeners.delete(listener)
      if (clock.listeners.size > 0) return
      clearInterval(clock.timer)
      clock.now = null
    }
  },
  get: () => clock.now,
}
const subscribeNever = () => () => {}
const noTime = () => null

/** The time now, refreshed every second, and `null` until mounted so the server and the first render agree. */
function useNow(enabled: boolean) {
  return React.useSyncExternalStore(
    enabled ? clock.subscribe : subscribeNever,
    enabled ? clock.get : noTime,
    noTime,
  )
}

/** Measures what is inside, so the panel can ease between the form and the confirmation. */
function useAnimatedHeight<T extends HTMLElement>() {
  const inner = React.useRef<T>(null)
  const [height, setHeight] = React.useState<number | undefined>(undefined)
  React.useLayoutEffect(() => {
    const el = inner.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => setHeight(el.offsetHeight || undefined))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return { inner, height }
}

/**
 * A contact section: a form that checks each field as you leave it and turns into a
 * confirmation in place, the other ways to reach you, and the offices with the time there,
 * ticking, and whether they are open.
 */
function Contact01({
  brand = defaultBrand,
  eyebrow = 'Contact',
  title = 'Let’s talk',
  description = `Questions about plans, a demo for your team, or just a hello. A real person at ${brand.name} reads every message.`,
  onSubmit = () => wait(900),
  channels = defaultChannels(domainOf(brand)),
  offices = defaultOffices,
  minMessage = 20,
  locale,
  labels: labelsProp,
  className,
  ...props
}: Contact01Props) {
  const labels = { ...defaultLabels, ...labelsProp }
  const headingId = React.useId()
  const officesId = React.useId()
  const ids = {
    name: React.useId(),
    email: React.useId(),
    company: React.useId(),
    message: React.useId(),
  }
  const [values, setValues] = React.useState<ContactValues>({
    name: '',
    email: '',
    company: '',
    message: '',
  })
  const [errors, setErrors] = React.useState<Errors>({})
  const [status, setStatus] = React.useState<'idle' | 'pending' | 'sent'>('idle')
  const [failure, setFailure] = React.useState<string | null>(null)
  const [sentTo, setSentTo] = React.useState<ContactValues | null>(null)
  const { inner, height } = useAnimatedHeight<HTMLDivElement>()
  const formRef = React.useRef<HTMLFormElement>(null)
  const doneRef = React.useRef<HTMLDivElement>(null)
  const now = useNow(offices.length > 0)

  const check = (field: Field, value: string): string | undefined => {
    const v = value.trim()
    if (field === 'company') return undefined
    if (!v) return labels.required
    if (field === 'email' && !EMAIL.test(v)) return labels.invalidEmail
    if (field === 'message' && v.length < minMessage)
      return fill(labels.tooShort, { min: minMessage })
    return undefined
  }

  const change =
    (field: Field) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value
      setValues((prev) => ({ ...prev, [field]: value }))
      // Once a field has complained, it re-checks as you type so the message leaves as soon as it is fixed.
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: check(field, value) }))
    }
  const blur = (field: Field) => () => {
    if (values[field]) setErrors((prev) => ({ ...prev, [field]: check(field, values[field]) }))
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (status === 'pending') return
    const next: Errors = {}
    for (const field of ['name', 'email', 'company', 'message'] as Field[]) {
      const message = check(field, values[field])
      if (message) next[field] = message
    }
    setErrors(next)
    const first = (['name', 'email', 'message'] as Field[]).find((f) => next[f])
    if (first) {
      document.getElementById(ids[first])?.focus()
      return
    }
    setFailure(null)
    setStatus('pending')
    const clean = {
      name: values.name.trim(),
      email: values.email.trim(),
      company: values.company.trim(),
      message: values.message.trim(),
    }
    try {
      await onSubmit(clean)
      setSentTo(clean)
      setStatus('sent')
    } catch (err) {
      setFailure(err instanceof Error && err.message ? err.message : labels.error)
      setStatus('idle')
    }
  }

  React.useEffect(() => {
    if (status === 'sent') doneRef.current?.focus()
  }, [status])

  const field = (name: Field) => ({
    id: ids[name],
    name,
    value: values[name],
    onChange: change(name),
    onBlur: blur(name),
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `${ids[name]}-error` : undefined,
  })
  const errorFor = (name: Field) =>
    errors[name] ? (
      <p id={`${ids[name]}-error`} className="text-destructive text-xs">
        {errors[name]}
      </p>
    ) : null

  return (
    <section
      data-slot="block-contact-01"
      aria-labelledby={headingId}
      className={cn('@container w-full', className)}
      {...props}
    >
      <div className="mx-auto max-w-6xl px-6 py-16 @3xl:py-24">
        <div className="grid gap-12 @4xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] @4xl:gap-16">
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
            {channels.length > 0 && (
              <ul className="mt-10 grid gap-3 @xl:grid-cols-2 @4xl:grid-cols-1">
                {channels.map(({ icon: Icon = MailIcon, ...channel }) => (
                  <li
                    key={channel.title}
                    className="group/channel relative flex gap-4 rounded-2xl border bg-card p-4 transition-colors hover:bg-accent/50"
                  >
                    <span
                      aria-hidden
                      className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted ring-1 ring-border"
                    >
                      <Icon className="size-4.5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-medium text-sm">{channel.title}</h3>
                      <p className="text-muted-foreground text-sm">{channel.description}</p>
                      <a
                        href={channel.href}
                        className="mt-1 inline-flex items-center gap-1 rounded-sm font-medium text-sm underline-offset-4 outline-none after:absolute after:inset-0 after:rounded-2xl hover:underline focus-visible:after:ring-[3px] focus-visible:after:ring-ring/50"
                      >
                        <span className="truncate">{channel.label}</span>
                        <ArrowRightIcon
                          aria-hidden
                          className="size-3.5 shrink-0 transition-transform duration-(--duration-fast,150ms) group-hover/channel:translate-x-0.5"
                        />
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div
            data-slot="contact-panel"
            className="overflow-hidden rounded-3xl border bg-card shadow-sm transition-[height] duration-(--duration-slow,300ms) ease-(--easing-emphasized,ease-out) motion-reduce:transition-none"
            style={{ height }}
          >
            <div ref={inner} className="p-6 @md:p-8">
              {status === 'sent' && sentTo ? (
                <div
                  ref={doneRef}
                  tabIndex={-1}
                  role="status"
                  className="flex flex-col items-center py-10 text-center outline-none duration-(--duration-slow,300ms) animate-in fade-in-0 zoom-in-95 motion-reduce:animate-none"
                >
                  <span className="relative flex size-14 items-center justify-center">
                    <span
                      aria-hidden
                      className="absolute inset-0 animate-ping rounded-full bg-primary/20 [animation-iteration-count:2] motion-reduce:hidden"
                    />
                    <span className="relative flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <CheckIcon aria-hidden className="size-7" />
                    </span>
                  </span>
                  <h3 className="mt-6 text-heading">{labels.successTitle}</h3>
                  <p className="mt-2 max-w-sm text-pretty text-muted-foreground">
                    {fill(labels.successDescription, {
                      name: sentTo.name.split(' ')[0] ?? sentTo.name,
                      email: sentTo.email,
                    })}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-8"
                    onClick={() => {
                      setValues({ name: '', email: '', company: '', message: '' })
                      setErrors({})
                      setStatus('idle')
                    }}
                  >
                    {labels.again}
                  </Button>
                </div>
              ) : (
                <form
                  ref={formRef}
                  noValidate
                  onSubmit={submit}
                  className="grid gap-5 duration-(--duration-slow,300ms) animate-in fade-in-0 motion-reduce:animate-none @md:grid-cols-2"
                >
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={ids.name}>{labels.name}</Label>
                    <Input {...field('name')} autoComplete="name" className="h-10" />
                    {errorFor('name')}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={ids.email}>{labels.email}</Label>
                    <Input {...field('email')} type="email" autoComplete="email" className="h-10" />
                    {errorFor('email')}
                  </div>
                  <div className="flex flex-col gap-2 @md:col-span-2">
                    <Label htmlFor={ids.company}>
                      {labels.company}
                      <span className="font-normal text-muted-foreground">({labels.optional})</span>
                    </Label>
                    <Input {...field('company')} autoComplete="organization" className="h-10" />
                  </div>
                  <div className="flex flex-col gap-2 @md:col-span-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <Label htmlFor={ids.message}>{labels.message}</Label>
                      <span
                        aria-hidden
                        className={cn(
                          'text-caption tabular-nums',
                          values.message.trim().length >= minMessage
                            ? 'text-muted-foreground'
                            : 'text-muted-foreground/60',
                        )}
                      >
                        {values.message.trim().length}/{minMessage}
                      </span>
                    </div>
                    <Textarea
                      {...field('message')}
                      rows={5}
                      placeholder={labels.messagePlaceholder}
                      className="min-h-32 resize-none"
                    />
                    {errorFor('message')}
                  </div>
                  {failure && (
                    <p
                      role="alert"
                      className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive text-sm @md:col-span-2"
                    >
                      {failure}
                    </p>
                  )}
                  <Button
                    type="submit"
                    size="lg"
                    loading={status === 'pending'}
                    className="@md:col-span-2"
                  >
                    {status === 'pending' ? labels.pending : labels.submit}
                    {status !== 'pending' && <SendIcon aria-hidden />}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>

        {offices.length > 0 && (
          <div className="mt-16 @3xl:mt-20">
            <h3 id={officesId} className="text-subheading">
              {labels.offices}
            </h3>
            <ul
              aria-labelledby={officesId}
              className="mt-5 grid gap-3 @xl:grid-cols-2 @4xl:grid-cols-3"
            >
              {offices.map((office) => (
                <li key={office.city}>
                  <OfficeCard office={office} now={now} locale={locale} labels={labels} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}

function OfficeCard({
  office,
  now,
  locale,
  labels,
}: {
  office: ContactOffice
  now: Date | null
  locale?: string
  labels: ContactLabels
}) {
  const [open = 9, close = 18] = office.hours ?? []
  const parts = React.useMemo(() => {
    if (!now) return null
    const get = (options: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat('en-US', { timeZone: office.timeZone, ...options }).format(now)
    return {
      time: new Intl.DateTimeFormat(locale, {
        timeZone: office.timeZone,
        hour: 'numeric',
        minute: '2-digit',
      }).format(now),
      zone:
        new Intl.DateTimeFormat(locale, { timeZone: office.timeZone, timeZoneName: 'short' })
          .formatToParts(now)
          .find((p) => p.type === 'timeZoneName')?.value ?? '',
      hour: Number(get({ hour: 'numeric', hourCycle: 'h23' })),
      weekday: get({ weekday: 'short' }),
    }
  }, [now, office.timeZone, locale])
  const isOpen =
    parts != null &&
    parts.weekday !== 'Sat' &&
    parts.weekday !== 'Sun' &&
    parts.hour >= open &&
    parts.hour < close

  return (
    <article className="flex h-full flex-col rounded-2xl border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <h4 className="font-semibold">{office.city}</h4>
        {parts && (
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium text-xs',
              isOpen
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                : 'bg-muted text-muted-foreground',
            )}
          >
            <span
              aria-hidden
              className={cn(
                'size-1.5 rounded-full',
                isOpen
                  ? 'animate-pulse bg-emerald-500 motion-reduce:animate-none'
                  : 'bg-muted-foreground/60',
              )}
            />
            {isOpen ? labels.open : labels.closed}
          </span>
        )}
      </div>
      <p className="mt-1 flex items-start gap-1.5 text-muted-foreground text-sm">
        <MapPinIcon aria-hidden className="mt-0.5 size-3.5 shrink-0" />
        {office.address}
      </p>
      <p className="mt-6 flex items-baseline gap-2">
        <time
          data-slot="office-time"
          className="font-semibold text-3xl tabular-nums tracking-tight"
          dateTime={now?.toISOString()}
        >
          {parts?.time ?? '--:--'}
        </time>
        <span className="text-muted-foreground text-xs">{parts?.zone}</span>
      </p>
    </article>
  )
}

export { Contact01 }
