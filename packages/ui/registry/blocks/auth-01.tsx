'use client'

import {
  EyeIcon,
  EyeOffIcon,
  GitBranchIcon,
  LoaderCircleIcon,
  type LucideIcon,
  QuoteIcon,
  WindIcon,
} from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'
import { Aurora } from '@/ui/aurora'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { Pattern } from '@/ui/pattern'

export interface AuthBrand {
  name: string
  href: string
  /** A lucide icon for the mark next to the name. Without one the mark shows the first letter. */
  icon?: LucideIcon
}

export interface AuthProvider {
  /** Passed to `onProvider` when the button is pressed. */
  id: string
  /** The name after "Continue with", like `GitHub`. */
  label: string
  /** A lucide icon. Without one the button shows the first letter. */
  icon?: LucideIcon
}

export interface AuthTestimonial {
  quote: React.ReactNode
  name: string
  role?: string
  /** A photo of the person. Without one their initials show. */
  image?: { src: string; alt: string }
}

export interface AuthValues {
  email: string
  password: string
}

export interface AuthLabels {
  email: string
  emailPlaceholder: string
  password: string
  forgotPassword: string
  showPassword: string
  hidePassword: string
  submit: string
  pending: string
  /** The word on the divider between the form and the providers. */
  divider: string
  /** Put before each provider's name. */
  continueWith: string
  /** Shown when `onSubmit` throws without a message of its own. */
  error: string
}

export interface Auth01Props extends Omit<React.ComponentProps<'section'>, 'title' | 'onSubmit'> {
  brand?: AuthBrand
  title?: React.ReactNode
  description?: React.ReactNode
  /** Called with the email and password. Return a promise to show the pending state; throw to show an error. */
  onSubmit?: (values: AuthValues) => void | Promise<void>
  /** Where "Forgot password?" goes. `null` hides it. */
  forgotPasswordHref?: string | null
  /** Buttons under the divider. An empty list hides them and the divider. */
  providers?: AuthProvider[]
  onProvider?: (id: string) => void
  /** The line under the form. `null` hides it. */
  signUp?: { prompt: string; label: string; href: string } | null
  /** The quote in the side panel on wide containers. `null` hides the panel. */
  testimonial?: AuthTestimonial | null
  /** Field labels and button text. */
  labels?: Partial<AuthLabels>
}

const defaultBrand: AuthBrand = { name: 'Northwind', href: '#', icon: WindIcon }

const defaultProviders: AuthProvider[] = [
  { id: 'github', label: 'GitHub', icon: GitBranchIcon },
  { id: 'google', label: 'Google' },
]

const defaultTestimonial: AuthTestimonial = {
  quote:
    'We moved three teams over in a week. Planning went from a Monday meeting to a five minute glance, and nobody wants to go back.',
  name: 'Maya Okafor',
  role: 'Head of Product, Fieldnote',
}

const defaultLabels: AuthLabels = {
  email: 'Email',
  emailPlaceholder: 'you@company.com',
  password: 'Password',
  forgotPassword: 'Forgot password?',
  showPassword: 'Show password',
  hidePassword: 'Hide password',
  submit: 'Sign in',
  pending: 'Signing in…',
  divider: 'or',
  continueWith: 'Continue with',
  error: 'We could not sign you in. Check your details and try again.',
}

/** Decorative hues for the aurora behind the quote. */
const auroraColors: [string, string, string] = [
  'oklch(0.72 0.19 285)',
  'oklch(0.78 0.14 210)',
  'oklch(0.8 0.15 160)',
]

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase()

function Mark({ brand }: { brand: AuthBrand }) {
  const Icon = brand.icon
  return (
    <a
      href={brand.href}
      className="group flex w-fit items-center gap-2 rounded-md font-semibold text-subheading outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <span
        aria-hidden
        className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-primary to-primary/70 text-primary-foreground shadow-sm transition-transform duration-(--duration-normal,200ms) ease-(--easing-spring,ease-out) group-hover:-rotate-6 group-hover:scale-105 motion-reduce:transition-none"
      >
        {Icon ? <Icon className="size-4" /> : brand.name.charAt(0)}
      </span>
      {brand.name}
    </a>
  )
}

/**
 * A sign in screen: email and password with a way to reveal it, a link for a forgotten
 * password, a submit button that waits for you, and buttons for other providers. On a wide
 * container a panel with a customer quote sits beside the form; narrow, the form stands alone.
 */
function Auth01({
  brand = defaultBrand,
  title = 'Welcome back',
  description = 'Sign in to pick up where your team left off.',
  onSubmit,
  forgotPasswordHref = '#',
  providers = defaultProviders,
  onProvider,
  signUp = { prompt: 'New to Northwind?', label: 'Create an account', href: '#' },
  testimonial = defaultTestimonial,
  labels: labelsProp,
  className,
  ...props
}: Auth01Props) {
  const labels = { ...defaultLabels, ...labelsProp }
  const headingId = React.useId()
  const emailId = React.useId()
  const passwordId = React.useId()
  const errorId = React.useId()
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [reveal, setReveal] = React.useState(false)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending) return
    const data = new FormData(event.currentTarget)
    setError(null)
    setPending(true)
    try {
      await onSubmit?.({
        email: String(data.get('email') ?? '').trim(),
        password: String(data.get('password') ?? ''),
      })
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : labels.error)
    } finally {
      setPending(false)
    }
  }

  return (
    <section
      data-slot="block-auth-01"
      aria-labelledby={headingId}
      className={cn('@container w-full', className)}
      {...props}
    >
      <div
        className={cn(
          'mx-auto grid max-w-6xl gap-6 p-3',
          testimonial && '@4xl:grid-cols-2 @4xl:items-stretch',
        )}
      >
        <div className="flex flex-col px-3 py-10 @md:px-6 @3xl:py-16">
          <Mark brand={brand} />
          <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center pt-12 @4xl:pt-16">
            <h1 id={headingId} className="text-title">
              {title}
            </h1>
            {description && <p className="mt-2 text-muted-foreground">{description}</p>}

            <form
              onSubmit={submit}
              aria-busy={pending || undefined}
              aria-describedby={error ? errorId : undefined}
              className="mt-8 flex flex-col gap-5"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor={emailId}>{labels.email}</Label>
                <Input
                  id={emailId}
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder={labels.emailPlaceholder}
                  aria-invalid={error ? true : undefined}
                  className="h-10"
                />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor={passwordId}>{labels.password}</Label>
                  {forgotPasswordHref && (
                    <a
                      href={forgotPasswordHref}
                      className="rounded-sm text-muted-foreground text-sm underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      {labels.forgotPassword}
                    </a>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id={passwordId}
                    name="password"
                    type={reveal ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    aria-invalid={error ? true : undefined}
                    className="h-10 pr-10"
                  />
                  <button
                    type="button"
                    aria-label={reveal ? labels.hidePassword : labels.showPassword}
                    aria-controls={passwordId}
                    aria-pressed={reveal}
                    onClick={() => setReveal((r) => !r)}
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    {reveal ? (
                      <EyeOffIcon aria-hidden className="size-4" />
                    ) : (
                      <EyeIcon aria-hidden className="size-4" />
                    )}
                  </button>
                </div>
              </div>
              {error && (
                <p
                  id={errorId}
                  role="alert"
                  className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive text-sm"
                >
                  {error}
                </p>
              )}
              <Button type="submit" size="lg" disabled={pending} className="mt-1 w-full">
                {pending && (
                  <LoaderCircleIcon
                    aria-hidden
                    className="animate-spin motion-reduce:animate-none"
                  />
                )}
                {pending ? labels.pending : labels.submit}
              </Button>
            </form>

            {providers.length > 0 && (
              <>
                <div className="my-6 flex items-center gap-3 text-caption text-muted-foreground">
                  <span aria-hidden className="h-px flex-1 bg-border" />
                  {labels.divider}
                  <span aria-hidden className="h-px flex-1 bg-border" />
                </div>
                <div className={cn('grid gap-3', providers.length > 1 && '@md:grid-cols-2')}>
                  {providers.map(({ id, label, icon: Icon }) => (
                    <Button
                      key={id}
                      type="button"
                      variant="outline"
                      size="lg"
                      disabled={pending}
                      aria-label={`${labels.continueWith} ${label}`}
                      onClick={() => onProvider?.(id)}
                    >
                      {Icon ? (
                        <Icon aria-hidden />
                      ) : (
                        <span
                          aria-hidden
                          className="flex size-4 items-center justify-center font-bold text-[0.8rem] leading-none"
                        >
                          {label.charAt(0)}
                        </span>
                      )}
                      {label}
                    </Button>
                  ))}
                </div>
              </>
            )}

            {signUp && (
              <p className="mt-8 text-center text-muted-foreground text-sm">
                {signUp.prompt}{' '}
                <a
                  href={signUp.href}
                  className="rounded-sm font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  {signUp.label}
                </a>
              </p>
            )}
          </div>
        </div>

        {testimonial && (
          <aside
            aria-label="What customers say"
            className="relative isolate hidden overflow-hidden rounded-2xl border bg-muted/50 @4xl:flex @4xl:min-h-[36rem] @4xl:flex-col @4xl:justify-end"
          >
            <Aurora blur={70} duration={24} className="-z-10" colors={auroraColors} />
            <Pattern
              variant="grid"
              size={36}
              fadeAt="50% 30%"
              className="-z-10 text-foreground/10"
            />
            <figure className="m-6 rounded-2xl border bg-background/70 p-8 shadow-sm backdrop-blur-md">
              <QuoteIcon aria-hidden className="size-6 text-muted-foreground/60" />
              <blockquote className="mt-4 text-pretty text-subheading font-normal leading-relaxed">
                {testimonial.quote}
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <Avatar className="size-10">
                  {testimonial.image && (
                    <AvatarImage src={testimonial.image.src} alt={testimonial.image.alt} />
                  )}
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {initials(testimonial.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="flex flex-col">
                  <span className="font-medium text-sm">{testimonial.name}</span>
                  {testimonial.role && (
                    <span className="text-caption text-muted-foreground">{testimonial.role}</span>
                  )}
                </span>
              </figcaption>
            </figure>
          </aside>
        )}
      </div>
    </section>
  )
}

export { Auth01 }
