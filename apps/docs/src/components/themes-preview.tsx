import {
  BellIcon,
  CalendarIcon,
  CreditCardIcon,
  MinusIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SendIcon,
  SettingsIcon,
  SmileIcon,
  TrendingUpIcon,
  UserIcon,
} from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { cn } from '@/lib/utils'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/ui/accordion'
import { Alert, AlertDescription, AlertTitle } from '@/ui/alert'
import { confirm } from '@/ui/alert-dialog'
import { Avatar, AvatarFallback } from '@/ui/avatar'
import { Badge } from '@/ui/badge'
import { BarChart } from '@/ui/bar-chart'
import { BentoCard, BentoGrid } from '@/ui/bento-grid'
import { Button } from '@/ui/button'
import { Calendar } from '@/ui/calendar'
import { Checkbox } from '@/ui/checkbox'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/ui/command'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu'
import { Input } from '@/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/ui/input-otp'
import { Label } from '@/ui/label'
import { LineChart } from '@/ui/line-chart'
import { Progress } from '@/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select'
import { Slider } from '@/ui/slider'
import { Switch } from '@/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs'
import { Textarea } from '@/ui/textarea'
import { toast } from '@/ui/toast'

/** A bento card holding live components. The grid's hover lift would move the controls, so it is off. */
function Tile({
  title,
  description,
  span,
  rows,
  className,
  children,
}: {
  title: string
  description?: string
  span?: 1 | 2 | 3
  rows?: 1 | 2 | 3
  className?: string
  children: ReactNode
}) {
  return (
    <BentoCard
      title={title}
      description={description}
      span={span}
      rows={rows}
      className={cn(
        'hover:shadow-xs [&>[data-slot=bento-body]]:translate-y-0! [&>[data-slot=bento-body]]:flex [&>[data-slot=bento-body]]:h-full [&>[data-slot=bento-body]]:flex-col',
        className,
      )}
    >
      <div className="mt-4 flex flex-1 flex-col gap-4">{children}</div>
    </BentoCard>
  )
}

// Thirty days of made up numbers, the same on every render.
const days = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(2026, 8, i + 1)
  return {
    date,
    revenue: Math.round(3800 + Math.sin(i / 3.5) * 900 + i * 110),
    refunds: Math.round(900 + Math.cos(i / 4) * 260 + i * 18),
    starter: Math.round(40 + Math.sin(i / 2) * 12 + i * 1.2),
    pro: Math.round(22 + Math.cos(i / 3) * 8 + i * 0.8),
  }
})

function RevenueCard() {
  return (
    <Tile title="Total revenue" span={2}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-semibold text-3xl tabular-nums">$15,231.89</p>
          <p className="text-muted-foreground text-sm">September 2026</p>
        </div>
        <Badge variant="secondary">
          <TrendingUpIcon /> +20.1%
        </Badge>
      </div>
      <LineChart
        area
        curve="monotone"
        height={180}
        showLegend={false}
        data={days}
        x="date"
        series={[
          { key: 'revenue', label: 'Revenue' },
          { key: 'refunds', label: 'Refunds' },
        ]}
        yFormat={(v) => `$${Math.round(v / 1000)}k`}
      />
    </Tile>
  )
}

function CalendarCard() {
  const [range, setRange] = useState<{ from?: Date; to?: Date }>({
    from: new Date(2026, 9, 6),
    to: new Date(2026, 9, 10),
  })
  const nights =
    range.from && range.to ? Math.round((+range.to - +range.from) / 86_400_000) : undefined
  return (
    <Tile title="Book a stay" description="Pick your check-in and check-out." rows={2}>
      <Calendar
        mode="range"
        selected={range}
        onSelect={setRange}
        defaultMonth={new Date(2026, 9, 1)}
        className="mx-auto rounded-lg border"
      />
      <div className="mt-auto flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">
          {nights ? `${nights} nights` : 'Pick the last night'}
        </p>
        <Button
          size="sm"
          disabled={!nights}
          onClick={() => toast.success('Stay booked', { description: `${nights} nights` })}
        >
          Reserve
        </Button>
      </div>
    </Tile>
  )
}

function SubscriptionsCard() {
  return (
    <Tile title="Subscriptions">
      <div>
        <p className="font-semibold text-2xl tabular-nums">+2,350</p>
        <p className="text-muted-foreground text-sm">+180.1% from last month</p>
      </div>
      <BarChart
        stacked
        height={120}
        showLegend={false}
        showGrid={false}
        data={days.slice(-14)}
        x="date"
        series={[
          { key: 'starter', label: 'Starter' },
          { key: 'pro', label: 'Pro' },
        ]}
      />
    </Tile>
  )
}

const members = [
  { name: 'Sofia Davis', email: 'sofia@acme.com', role: 'owner' },
  { name: 'Jackson Lee', email: 'jackson@acme.com', role: 'admin' },
  { name: 'Isabella Nguyen', email: 'isabella@acme.com', role: 'viewer' },
]

function TeamCard() {
  return (
    <Tile title="Team members" description="Invite your team and pick their role.">
      <ul className="flex flex-col gap-3">
        {members.map((m) => (
          <li key={m.email} className="flex items-center gap-3">
            <Avatar className="size-8">
              <AvatarFallback>
                {m.name
                  .split(' ')
                  .map((p) => p[0])
                  .join('')}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-sm">{m.name}</p>
              <p className="truncate text-muted-foreground text-xs">{m.email}</p>
            </div>
            <Select defaultValue={m.role}>
              <SelectTrigger size="sm" className="w-24" aria-label={`Role of ${m.name}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </li>
        ))}
      </ul>
    </Tile>
  )
}

function CreateAccountCard() {
  return (
    <Tile
      title="Create an account"
      description="Enter your email below to create your account."
      rows={2}
    >
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline">GitHub</Button>
        <Button variant="outline">Google</Button>
      </div>
      <div className="flex items-center gap-3 text-muted-foreground text-xs uppercase">
        <span className="h-px flex-1 bg-border" />
        or continue with
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="themes-email">Email</Label>
        <Input id="themes-email" type="email" placeholder="m@example.com" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="themes-password">Password</Label>
        <Input id="themes-password" type="password" />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="themes-updates" defaultChecked />
        <Label htmlFor="themes-updates" className="font-normal">
          Send me product updates
        </Label>
      </div>
      <Button className="mt-auto w-full">Create account</Button>
    </Tile>
  )
}

const payments = [
  { id: 'm5gr84i9', status: 'Success', email: 'ken99@example.com', amount: 316 },
  { id: '3u1reuv4', status: 'Success', email: 'abe45@example.com', amount: 242 },
  { id: 'derv1ws0', status: 'Processing', email: 'monserrat44@example.com', amount: 837 },
  { id: '5kma53ae', status: 'Success', email: 'silas22@example.com', amount: 874 },
  { id: 'bhqecj4p', status: 'Failed', email: 'carmella@example.com', amount: 721 },
]

function PaymentsCard() {
  const [selected, setSelected] = useState<string[]>(['derv1ws0'])
  const all = selected.length === payments.length
  return (
    <Tile title="Payments" description="Manage your payments." span={2}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8">
              <Checkbox
                aria-label="Select all"
                checked={all ? true : selected.length ? 'indeterminate' : false}
                onCheckedChange={(v) => setSelected(v ? payments.map((p) => p.id) : [])}
              />
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((p) => {
            const on = selected.includes(p.id)
            return (
              <TableRow key={p.id} data-state={on ? 'selected' : undefined}>
                <TableCell>
                  <Checkbox
                    aria-label={`Select ${p.email}`}
                    checked={on}
                    onCheckedChange={(v) =>
                      setSelected((s) => (v ? [...s, p.id] : s.filter((id) => id !== p.id)))
                    }
                  />
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      p.status === 'Failed'
                        ? 'destructive'
                        : p.status === 'Processing'
                          ? 'outline'
                          : 'secondary'
                    }
                  >
                    {p.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{p.email}</TableCell>
                <TableCell className="text-right tabular-nums">${p.amount.toFixed(2)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-7" aria-label="Actions">
                        <MoreHorizontalIcon />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onSelect={() => navigator.clipboard?.writeText(p.id).catch(() => {})}
                      >
                        Copy payment ID
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>View customer</DropdownMenuItem>
                      <DropdownMenuItem variant="destructive">Refund</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      <p className="text-muted-foreground text-sm">
        {selected.length} of {payments.length} rows selected.
      </p>
    </Tile>
  )
}

function ChatCard() {
  const [messages, setMessages] = useState([
    { me: false, text: 'Hi, how can I help you today?' },
    { me: true, text: "Hey, I'm having trouble with my account." },
    { me: false, text: 'What seems to be the problem?' },
    { me: true, text: "I can't log in." },
  ])
  const [draft, setDraft] = useState('')
  return (
    <Tile title="Sofia Davis" description="m@example.com">
      <div className="flex flex-col gap-2">
        {messages.map((m, i) => (
          <p
            // biome-ignore lint/suspicious/noArrayIndexKey: messages are only ever appended
            key={i}
            className={cn(
              'max-w-[80%] rounded-lg px-3 py-2 text-sm',
              m.me ? 'ml-auto bg-primary text-primary-foreground' : 'bg-muted',
            )}
          >
            {m.text}
          </p>
        ))}
      </div>
      <form
        className="mt-auto flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!draft.trim()) return
          setMessages((ms) => [...ms, { me: true, text: draft.trim() }])
          setDraft('')
        }}
      >
        <Input
          aria-label="Message"
          placeholder="Type your message…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <Button type="submit" size="icon" aria-label="Send" disabled={!draft.trim()}>
          <SendIcon />
        </Button>
      </form>
    </Tile>
  )
}

function CookiesCard() {
  const rows = [
    { id: 'necessary', label: 'Strictly necessary', hint: 'Keep the site working.', on: true },
    { id: 'functional', label: 'Functional', hint: 'Remember your settings.', on: true },
    { id: 'analytics', label: 'Analytics', hint: 'Help us improve.', on: false },
  ]
  return (
    <Tile title="Cookie settings" description="Manage your cookie settings here.">
      {rows.map((r) => (
        <div key={r.id} className="flex items-center justify-between gap-4">
          <Label htmlFor={`cookie-${r.id}`} className="flex flex-col items-start gap-0.5">
            <span>{r.label}</span>
            <span className="font-normal text-muted-foreground text-xs">{r.hint}</span>
          </Label>
          <Switch id={`cookie-${r.id}`} defaultChecked={r.on} disabled={r.id === 'necessary'} />
        </div>
      ))}
      <Button
        variant="outline"
        className="mt-auto w-full"
        onClick={() => toast('Preferences saved')}
      >
        Save preferences
      </Button>
    </Tile>
  )
}

function ReportCard() {
  return (
    <Tile title="Report an issue" description="What area are you having problems with?">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="themes-area">Area</Label>
          <Select defaultValue="billing">
            <SelectTrigger id="themes-area" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="team">Team</SelectItem>
              <SelectItem value="billing">Billing</SelectItem>
              <SelectItem value="account">Account</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="themes-severity">Severity</Label>
          <Select defaultValue="2">
            <SelectTrigger id="themes-severity" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Low</SelectItem>
              <SelectItem value="2">Medium</SelectItem>
              <SelectItem value="3">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="themes-description">Description</Label>
        <Textarea
          id="themes-description"
          placeholder="Please include all information relevant to your issue."
        />
      </div>
      <div className="mt-auto flex justify-end gap-2">
        <Button variant="ghost">Cancel</Button>
        <Button
          onClick={() =>
            toast.success('Issue reported', { description: 'We will get back to you.' })
          }
        >
          Submit
        </Button>
      </div>
    </Tile>
  )
}

function FaqCard() {
  return (
    <Tile title="FAQ">
      <Accordion type="single" collapsible defaultValue="free">
        <AccordionItem value="free">
          <AccordionTrigger>Is there a free plan?</AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            Yes. Starter is free forever for up to three projects.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="change">
          <AccordionTrigger>Can I change plans later?</AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            Any time, from the billing page. Upgrades apply right away.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="cancel">
          <AccordionTrigger>What happens if I cancel?</AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            Your workspace stays readable for 90 days so you can export everything.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Tile>
  )
}

function PaymentMethodCard() {
  return (
    <Tile title="Payment method" description="Add a new payment method to your account.">
      <RadioGroup defaultValue="card" className="grid grid-cols-3 gap-2">
        {[
          { value: 'card', label: 'Card', icon: CreditCardIcon },
          { value: 'paypal', label: 'PayPal', icon: SmileIcon },
          { value: 'apple', label: 'Apple', icon: UserIcon },
        ].map(({ value, label, icon: Icon }) => (
          <label
            key={value}
            htmlFor={`themes-pay-${value}`}
            className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-3 text-sm transition-colors hover:bg-accent has-[button[data-state=checked]]:border-primary"
          >
            <RadioGroupItem value={value} id={`themes-pay-${value}`} className="sr-only" />
            <Icon className="size-5" />
            {label}
          </label>
        ))}
      </RadioGroup>
      <div className="flex flex-col gap-2">
        <Label htmlFor="themes-card">Card number</Label>
        <Input id="themes-card" placeholder="4242 4242 4242 4242" inputMode="numeric" />
      </div>
      <Button className="mt-auto w-full">Continue</Button>
    </Tile>
  )
}

function NotificationsCard() {
  return (
    <Tile
      title="Notifications"
      description="Feedback in place, in a toast, or as a question."
      span={2}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Alert variant="info">
          <AlertTitle>A new version is out</AlertTitle>
          <AlertDescription>Refresh to get the latest features.</AlertDescription>
        </Alert>
        <Alert variant="success">
          <AlertTitle>Payment received</AlertTitle>
          <AlertDescription>Your invoice is marked as paid.</AlertDescription>
        </Alert>
        <Alert variant="warning">
          <AlertTitle>Storage almost full</AlertTitle>
          <AlertDescription>You have used 95% of your plan.</AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <AlertTitle>Payment failed</AlertTitle>
          <AlertDescription>Check your billing details.</AlertDescription>
        </Alert>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          onClick={() =>
            toast('Event created', {
              description: 'Friday, October 3 at 5:57 PM',
              action: { label: 'Undo', onClick: () => {} },
            })
          }
        >
          <BellIcon /> Show a toast
        </Button>
        <Button
          variant="destructive"
          onClick={async () => {
            const ok = await confirm({
              title: 'Delete this project?',
              description: 'Its pages and settings are removed for good.',
              confirmText: 'Delete',
              variant: 'destructive',
            })
            if (ok) toast.success('Project deleted')
          }}
        >
          Delete project
        </Button>
        <Badge>New</Badge>
        <Badge variant="secondary">Beta</Badge>
        <Badge variant="outline">v2.4</Badge>
      </div>
    </Tile>
  )
}

function CommandCard() {
  return (
    <Tile title="Command menu" description="Search anything, from the keyboard.">
      <Command className="rounded-lg border">
        <CommandInput placeholder="Type a command or search…" />
        <CommandList className="max-h-52">
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem>
              <CalendarIcon /> Calendar
            </CommandItem>
            <CommandItem>
              <SmileIcon /> Search emoji
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Settings">
            <CommandItem>
              <UserIcon /> Profile <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
            <CommandItem>
              <SettingsIcon /> Settings <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </Tile>
  )
}

function AccountTabsCard() {
  return (
    <Tile title="Account">
      <Tabs defaultValue="account">
        <TabsList className="w-full">
          <TabsTrigger value="account" className="flex-1">
            Account
          </TabsTrigger>
          <TabsTrigger value="password" className="flex-1">
            Password
          </TabsTrigger>
        </TabsList>
        <TabsContent value="account" className="mt-3 flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="themes-name">Name</Label>
            <Input id="themes-name" defaultValue="Pedro Duarte" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="themes-username">Username</Label>
            <Input id="themes-username" defaultValue="@peduarte" />
          </div>
        </TabsContent>
        <TabsContent value="password" className="mt-3 flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="themes-current">Current password</Label>
            <Input id="themes-current" type="password" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="themes-new">New password</Label>
            <Input id="themes-new" type="password" />
          </div>
        </TabsContent>
      </Tabs>
      <Button className="mt-auto w-full" variant="secondary">
        Save changes
      </Button>
    </Tile>
  )
}

function GoalCard() {
  const [goal, setGoal] = useState(350)
  const [budget, setBudget] = useState([40])
  return (
    <Tile title="Move goal" description="Set your daily activity goal.">
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          aria-label="Decrease"
          onClick={() => setGoal((g) => Math.max(200, g - 10))}
        >
          <MinusIcon />
        </Button>
        <div className="text-center">
          <p className="font-bold text-4xl tabular-nums tracking-tight">{goal}</p>
          <p className="text-muted-foreground text-xs uppercase">calories / day</p>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          aria-label="Increase"
          onClick={() => setGoal((g) => Math.min(600, g + 10))}
        >
          <PlusIcon />
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-sm">
          <Label>Weekly budget</Label>
          <span className="text-muted-foreground tabular-nums">${budget[0]}</span>
        </div>
        <Slider value={budget} onValueChange={setBudget} max={100} step={5} />
      </div>
      <div className="mt-auto flex flex-col gap-2">
        <div className="flex justify-between text-sm">
          <span>Storage</span>
          <span className="text-muted-foreground tabular-nums">7.2 of 10 GB</span>
        </div>
        <Progress value={72} />
      </div>
    </Tile>
  )
}

function VerifyCard() {
  const [code, setCode] = useState('')
  return (
    <Tile title="Verify your email" description="Enter the code we sent to m@example.com.">
      <InputOTP
        aria-label="Verification code"
        value={code}
        onValueChange={setCode}
        onComplete={() => toast.success('Email verified')}
        className="mx-auto"
      >
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
      <p className="text-center text-muted-foreground text-sm">
        Didn't get it?{' '}
        <button type="button" className="text-foreground underline underline-offset-4">
          Resend
        </button>
      </p>
    </Tile>
  )
}

/** Every component that reads the theme, in one grid. */
export function ThemesPreview({ compact = false }: { compact?: boolean }) {
  return (
    // Next to the color editor there is room for two columns, not three.
    <BentoGrid
      className={cn('md:grid-flow-row-dense', compact && 'md:grid-cols-2 2xl:grid-cols-3')}
    >
      <RevenueCard />
      <CalendarCard />
      <SubscriptionsCard />
      <TeamCard />
      <CreateAccountCard />
      <PaymentsCard />
      <ChatCard />
      <CookiesCard />
      <ReportCard />
      <FaqCard />
      <PaymentMethodCard />
      <NotificationsCard />
      <CommandCard />
      <AccountTabsCard />
      <GoalCard />
      <VerifyCard />
    </BentoGrid>
  )
}
