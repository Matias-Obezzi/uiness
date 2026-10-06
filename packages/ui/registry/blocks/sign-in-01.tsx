'use client'

import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, MailIcon } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/ui/avatar'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/ui/input-otp'
import { Label } from '@/ui/label'

export type SignInStep = 'email' | 'code' | 'done'

/** Whose product this is. The same shape as the `brand` of the other blocks. */
export interface SignInBrand {
  /** Read out on the mark above the card, and put in the first title. */
  name: string
  /** Where the mark goes. Default `/`. */
  href?: string
  /** The mark above the card, like `<MountainIcon />` or an `<img>`. Without one it shows the first letter. */
  logo?: React.ReactNode
}

export interface SignInLabels {
  /** `{brand}` is replaced with the brand name. */
  emailTitle: string
  emailDescription: string
  email: string
  emailPlaceholder: string
  continue: string
  sending: string
  /** Shown for an address that does not look like one. */
  invalidEmail: string
  codeTitle: string
  /** `{email}` is replaced with the address. */
  codeDescription: string
  code: string
  verify: string
  verifying: string
  back: string
  resend: string
  /** `{seconds}` is replaced with the time left. */
  resendIn: string
  resent: string
  /** Shown when `onVerify` throws without a message of its own. */
  invalidCode: string
  doneTitle: string
  /** `{email}` is replaced with the address. */
  doneDescription: string
  continueToApp: string
  switchAccount: string
  /** Shown when `onRequestCode` throws without a message of its own. */
  error: string
}

export interface SignIn01Props extends Omit<React.ComponentProps<'section'>, 'title'> {
  brand?: SignInBrand
  /** Sends the code. Return a promise to show the pending state; throw to show an error. */
  onRequestCode?: (email: string) => void | Promise<void>
  /** Checks the code. Throw to reject it; the field shakes and clears. */
  onVerify?: (email: string, code: string) => void | Promise<void>
  /** Where "Continue" goes once signed in. */
  continueHref?: string
  /** Seconds before the code can be sent again. Default 30. */
  resendAfter?: number
  /** Start on a given step, mostly for previews and tests. */
  defaultStep?: SignInStep
  defaultEmail?: string
  /** The line under the card. `null` hides it. */
  footer?: React.ReactNode | null
  labels?: Partial<SignInLabels>
}

const defaultLabels: SignInLabels = {
  emailTitle: 'Sign in to {brand}',
  emailDescription: 'We will email you a six digit code. No password needed.',
  email: 'Work email',
  emailPlaceholder: 'you@company.com',
  continue: 'Continue with email',
  sending: 'Sending code…',
  invalidEmail: 'Enter an email address like name@company.com.',
  codeTitle: 'Check your inbox',
  codeDescription: 'Enter the six digit code we sent to {email}.',
  code: 'Verification code',
  verify: 'Verify',
  verifying: 'Checking…',
  back: 'Use a different email',
  resend: 'Resend code',
  resendIn: 'Resend in {seconds}s',
  resent: 'A new code is on its way.',
  invalidCode: 'That code did not match. Try again.',
  doneTitle: 'You’re in',
  doneDescription: 'Signed in as {email}.',
  continueToApp: 'Continue to dashboard',
  switchAccount: 'Sign in with another account',
  error: 'We could not send a code. Try again in a moment.',
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const CODE_LENGTH = 6

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''))

const reducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Follows the height of what is inside, so the card grows and shrinks smoothly between steps
 * instead of jumping. The first measure sets the height without a transition.
 */
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
 * A passwordless sign in card that changes in place: an email, then a six digit code, then
 * the signed in account. The card follows the height of each step, steps slide in from the
 * side they come from, a wrong code shakes the field, and the code can be sent again after a
 * short wait.
 */
function SignIn01({
  brand = { name: 'Acme', href: '#' },
  onRequestCode = () => wait(700),
  onVerify = () => wait(700),
  continueHref = '#',
  resendAfter = 30,
  defaultStep = 'email',
  defaultEmail = '',
  footer = (
    <>
      By continuing you agree to the{' '}
      <a href="#terms" className="underline underline-offset-4 hover:text-foreground">
        Terms
      </a>{' '}
      and{' '}
      <a href="#privacy" className="underline underline-offset-4 hover:text-foreground">
        Privacy Policy
      </a>
      .
    </>
  ),
  labels: labelsProp,
  className,
  ...props
}: SignIn01Props) {
  const labels = { ...defaultLabels, ...labelsProp }
  const headingId = React.useId()
  const emailId = React.useId()
  const errorId = React.useId()
  const [step, setStep] = React.useState<SignInStep>(defaultStep)
  // Which way the last change went, so the next step slides in from the right side.
  const [direction, setDirection] = React.useState<1 | -1>(1)
  const [email, setEmail] = React.useState(defaultEmail)
  const [code, setCode] = React.useState('')
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [notice, setNotice] = React.useState<string | null>(null)
  const [left, setLeft] = React.useState(defaultStep === 'code' ? resendAfter : 0)
  // A fresh code field after a wrong code: the field only reports completion once per fill.
  const [attempt, setAttempt] = React.useState(0)
  const { inner, height } = useAnimatedHeight<HTMLDivElement>()
  const otpRef = React.useRef<HTMLDivElement>(null)
  const stepRef = React.useRef<HTMLDivElement>(null)
  const moved = React.useRef(false)

  React.useEffect(() => {
    if (left <= 0) return
    const id = setTimeout(() => setLeft((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [left])

  // Move focus to the first field of a new step, so keyboard users land where they type.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs when the step changes
  React.useEffect(() => {
    if (!moved.current) return
    stepRef.current?.querySelector<HTMLElement>('input, a, button:not([data-back])')?.focus()
  }, [step])

  React.useEffect(() => {
    if (attempt > 0) otpRef.current?.querySelector('input')?.focus()
  }, [attempt])

  const go = (next: SignInStep, dir: 1 | -1) => {
    moved.current = true
    setDirection(dir)
    setError(null)
    setNotice(null)
    setStep(next)
  }

  const shake = () => {
    const el = otpRef.current
    if (!el || typeof el.animate !== 'function' || reducedMotion()) return
    el.animate(
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-8px)' },
        { transform: 'translateX(7px)' },
        { transform: 'translateX(-5px)' },
        { transform: 'translateX(3px)' },
        { transform: 'translateX(0)' },
      ],
      { duration: 400, easing: 'ease-out' },
    )
  }

  const requestCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending) return
    const value = email.trim()
    if (!EMAIL.test(value)) {
      setError(labels.invalidEmail)
      return
    }
    setError(null)
    setPending(true)
    try {
      await onRequestCode(value)
      setEmail(value)
      setCode('')
      setLeft(resendAfter)
      go('code', 1)
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : labels.error)
    } finally {
      setPending(false)
    }
  }

  const verify = async (value: string) => {
    if (pending || value.length < CODE_LENGTH) return
    setError(null)
    setPending(true)
    try {
      await onVerify(email, value)
      go('done', 1)
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : labels.invalidCode)
      setCode('')
      setAttempt((n) => n + 1)
      shake()
    } finally {
      setPending(false)
    }
  }

  const resend = async () => {
    if (left > 0 || pending) return
    setError(null)
    try {
      await onRequestCode(email)
      setLeft(resendAfter)
      setNotice(labels.resent)
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : labels.error)
    }
  }

  const title =
    step === 'email'
      ? fill(labels.emailTitle, { brand: brand.name })
      : step === 'code'
        ? labels.codeTitle
        : labels.doneTitle

  return (
    <section
      data-slot="block-sign-in-01"
      data-step={step}
      aria-labelledby={headingId}
      className={cn('@container relative isolate w-full overflow-hidden', className)}
      {...props}
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,var(--color-muted),transparent)]"
      />
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 @md:px-6 @3xl:py-24">
        <a
          href={brand.href ?? '/'}
          className="mb-8 flex items-center gap-2 rounded-md font-semibold text-subheading outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <span
            aria-hidden
            className="flex size-9 items-center justify-center overflow-hidden rounded-xl bg-linear-to-br from-primary to-primary/70 text-primary-foreground shadow-sm [&_svg]:size-4.5"
          >
            {brand.logo ?? brand.name.charAt(0)}
          </span>
          <span className="sr-only">{brand.name}</span>
        </a>

        <div
          data-slot="sign-in-card"
          className="w-full overflow-hidden rounded-2xl border bg-card shadow-sm transition-[height] duration-(--duration-slow,300ms) ease-(--easing-emphasized,ease-out) motion-reduce:transition-none"
          style={{ height }}
        >
          <div ref={inner} className="p-6 @md:p-8">
            <div
              key={step}
              ref={stepRef}
              className={cn(
                'duration-(--duration-slow,300ms) ease-(--easing-emphasized,ease-out) motion-reduce:animate-none',
                moved.current &&
                  (direction === 1
                    ? 'animate-in fade-in-0 slide-in-from-right-6'
                    : 'animate-in fade-in-0 slide-in-from-left-6'),
              )}
            >
              {step === 'code' && (
                <button
                  type="button"
                  data-back
                  onClick={() => go('email', -1)}
                  className="-ml-1 mb-5 inline-flex items-center gap-1.5 rounded-md px-1 text-muted-foreground text-sm outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <ArrowLeftIcon aria-hidden className="size-4" />
                  {labels.back}
                </button>
              )}

              {step === 'done' && (
                <span
                  aria-hidden
                  className="mb-5 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground duration-(--duration-slow,300ms) ease-(--easing-spring,ease-out) animate-in zoom-in-50 motion-reduce:animate-none"
                >
                  <CheckIcon className="size-6" />
                </span>
              )}

              <h1 id={headingId} className="text-heading">
                {title}
              </h1>
              <p className="mt-2 text-pretty text-muted-foreground text-sm">
                {step === 'email'
                  ? labels.emailDescription
                  : fill(step === 'code' ? labels.codeDescription : labels.doneDescription, {
                      email,
                    })}
              </p>

              {step === 'email' && (
                <form noValidate onSubmit={requestCode} className="mt-6 flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={emailId}>{labels.email}</Label>
                    <div className="relative">
                      <MailIcon
                        aria-hidden
                        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                      />
                      <Input
                        id={emailId}
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          if (error) setError(null)
                        }}
                        placeholder={labels.emailPlaceholder}
                        aria-invalid={error ? true : undefined}
                        aria-describedby={error ? errorId : undefined}
                        className="h-10 pl-9"
                      />
                    </div>
                  </div>
                  {error && (
                    <p id={errorId} role="alert" className="text-destructive text-sm">
                      {error}
                    </p>
                  )}
                  <Button type="submit" size="lg" loading={pending} className="w-full">
                    {pending ? labels.sending : labels.continue}
                    {!pending && <ArrowRightIcon aria-hidden />}
                  </Button>
                </form>
              )}

              {step === 'code' && (
                <form
                  noValidate
                  onSubmit={(e) => {
                    e.preventDefault()
                    void verify(code)
                  }}
                  className="mt-6 flex flex-col gap-4"
                >
                  <div ref={otpRef} className="flex justify-center @xs:justify-start">
                    <InputOTP
                      key={attempt}
                      maxLength={CODE_LENGTH}
                      value={code}
                      onValueChange={(value) => {
                        setCode(value)
                        if (error) setError(null)
                      }}
                      onComplete={(value) => void verify(value)}
                      disabled={pending}
                      aria-label={labels.code}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? errorId : undefined}
                    >
                      <InputOTPGroup>
                        {[0, 1, 2].map((i) => (
                          <InputOTPSlot
                            key={i}
                            index={i}
                            className={cn('size-11 text-lg', error && 'border-destructive/60')}
                          />
                        ))}
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup>
                        {[3, 4, 5].map((i) => (
                          <InputOTPSlot
                            key={i}
                            index={i}
                            className={cn('size-11 text-lg', error && 'border-destructive/60')}
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <div aria-live="polite" className="min-h-5 text-sm">
                    {error ? (
                      <p id={errorId} role="alert" className="text-destructive">
                        {error}
                      </p>
                    ) : notice ? (
                      <p className="text-muted-foreground">{notice}</p>
                    ) : null}
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    loading={pending}
                    disabled={code.length < CODE_LENGTH}
                    className="w-full"
                  >
                    {pending ? labels.verifying : labels.verify}
                  </Button>
                  <button
                    type="button"
                    onClick={() => void resend()}
                    disabled={left > 0}
                    className="mx-auto rounded-md px-1 text-sm tabular-nums outline-none transition-colors enabled:font-medium enabled:hover:underline enabled:underline-offset-4 disabled:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    {left > 0 ? fill(labels.resendIn, { seconds: left }) : labels.resend}
                  </button>
                </form>
              )}

              {step === 'done' && (
                <div className="mt-6 flex flex-col gap-4">
                  <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-3">
                    <Avatar className="size-10">
                      <AvatarFallback className="bg-primary/10 font-semibold text-primary uppercase">
                        {email.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-sm">{email.split('@')[0]}</p>
                      <p className="truncate text-muted-foreground text-xs">{email}</p>
                    </div>
                  </div>
                  <Button asChild size="lg" className="w-full">
                    <a href={continueHref}>
                      {labels.continueToApp}
                      <ArrowRightIcon aria-hidden />
                    </a>
                  </Button>
                  <button
                    type="button"
                    data-back
                    onClick={() => {
                      setCode('')
                      go('email', -1)
                    }}
                    className="mx-auto rounded-md px-1 text-muted-foreground text-sm outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    {labels.switchAccount}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {footer != null && (
          <p className="mt-6 max-w-xs text-balance text-center text-caption text-muted-foreground">
            {footer}
          </p>
        )}
      </div>
    </section>
  )
}

export { SignIn01 }
