import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const sections = [
  [
    'Your account',
    'You are responsible for what happens under your account and for keeping its password to yourself. Tell us right away if you think someone else has used it.',
  ],
  [
    'Your content',
    'What you upload stays yours. You give us the right to store it, back it up and show it to the people you share it with, and nothing more.',
  ],
  [
    'Acceptable use',
    'Do not use the service to break the law, to send spam, to probe other systems or to get around the limits of your plan.',
  ],
  [
    'Payment',
    'Paid plans renew each month or each year until you cancel. Prices can change, and we will tell you thirty days before they do.',
  ],
  [
    'Cancellation',
    'You can cancel at any time from the billing page. Your workspace stays readable for ninety days so you can export it.',
  ],
  [
    'Privacy',
    'We collect what we need to run the service and nothing to sell. The privacy policy lists every kind of data and how long we keep it.',
  ],
  [
    'Availability',
    'We aim for the service to be up all the time, but cannot promise it. Planned maintenance is announced a week ahead.',
  ],
  [
    'Support',
    'Every plan includes email support. Paid plans get an answer within one working day, and the Business plan has a named contact.',
  ],
  [
    'Third parties',
    'Some features rely on other companies, such as the payment processor. Their own terms apply to what you do with them.',
  ],
  [
    'Liability',
    'If something goes wrong, what we owe you is limited to what you paid us in the twelve months before it happened.',
  ],
  [
    'Disputes',
    'We will try to settle any disagreement by talking first. If that fails, the courts of the place where we are registered decide.',
  ],
  [
    'Changes to these terms',
    'When the terms change in a way that matters, we will email you and ask you to accept them again, as you are doing now.',
  ],
] as const

export default function DialogScroll() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Read the terms</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Terms of service</DialogTitle>
          <DialogDescription>
            Updated on 1 October. Read them before you continue.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4 text-sm">
          {sections.map(([title, text], i) => (
            <section key={title} className="space-y-1">
              <h3 className="font-medium">
                {i + 1}. {title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">{text}</p>
            </section>
          ))}
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Decline</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button>Accept</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
