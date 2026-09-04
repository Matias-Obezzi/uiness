import { CalendarIcon, CreditCardIcon, SettingsIcon, SmileIcon, UserIcon } from 'lucide-react'
import { useState } from 'react'
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

export default function CommandDemo() {
  const [picked, setPicked] = useState<string | null>(null)
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <Command className="rounded-lg border shadow-sm">
        <CommandInput placeholder="Type a command or search…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem onSelect={setPicked} keywords={['schedule', 'events']}>
              <CalendarIcon />
              Calendar
            </CommandItem>
            <CommandItem onSelect={setPicked} keywords={['emoji', 'reaction']}>
              <SmileIcon />
              Search emoji
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Settings">
            <CommandItem onSelect={setPicked}>
              <UserIcon />
              Profile
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={setPicked}>
              <CreditCardIcon />
              Billing
              <CommandShortcut>⌘B</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={setPicked} disabled>
              <SettingsIcon />
              Advanced
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
      <p className="text-muted-foreground text-sm">
        {picked ? `You picked ${picked}.` : 'Arrows move, Enter selects.'}
      </p>
    </div>
  )
}
