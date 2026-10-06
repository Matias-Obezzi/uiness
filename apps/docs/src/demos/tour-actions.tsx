import { BellIcon, InboxIcon, SettingsIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/ui/button'
import { toast } from '@/ui/toast'
import { Tour, type TourStep } from '@/ui/tour'

const steps: TourStep[] = [
  {
    id: 'inbox',
    target: '[data-tour="actions-inbox"]',
    title: 'Your inbox',
    content: 'Mentions and replies land here first.',
    side: 'bottom',
  },
  {
    id: 'alerts',
    target: '[data-tour="actions-alerts"]',
    title: 'Notifications',
    content: 'Choose what reaches you and when.',
    side: 'bottom',
    // A step can bring its own actions instead of the tour's.
    actions: (
      <Button asChild variant="link" size="sm" className="px-0">
        <a href="#props">Read more</a>
      </Button>
    ),
  },
  {
    id: 'settings',
    target: '[data-tour="actions-settings"]',
    title: 'Settings',
    content: 'Everything else lives behind this button.',
    side: 'bottom',
    align: 'end',
  },
]

export default function TourActions() {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="flex w-full max-w-md items-center gap-2 rounded-xl border bg-background px-4 py-2.5 text-sm">
        <span className="font-semibold">Acme</span>
        <div className="ml-auto flex gap-1">
          <Button data-tour="actions-inbox" variant="ghost" size="icon" aria-label="Inbox">
            <InboxIcon />
          </Button>
          <Button data-tour="actions-alerts" variant="ghost" size="icon" aria-label="Notifications">
            <BellIcon />
          </Button>
          <Button data-tour="actions-settings" variant="ghost" size="icon" aria-label="Settings">
            <SettingsIcon />
          </Button>
        </div>
      </div>
      <Button onClick={() => setOpen(true)}>Start tour</Button>
      <Tour
        steps={steps}
        open={open}
        onOpenChange={setOpen}
        showExit
        actions={({ stop }) => (
          <Button
            variant="link"
            size="sm"
            className="px-0"
            onClick={() => {
              stop()
              setOpen(false)
              toast('We will show it again tomorrow')
            }}
          >
            Later
          </Button>
        )}
        onSkip={({ index, total }) => toast(`Tour closed at step ${index + 1} of ${total}`)}
      />
    </div>
  )
}
