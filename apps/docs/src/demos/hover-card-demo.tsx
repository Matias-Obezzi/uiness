import { CalendarIcon, MapPinIcon } from 'lucide-react'
import { Button } from '@/ui/button'
import { ProfileHoverCard } from '@/ui/hover-card'

export default function HoverCardDemo() {
  return (
    <p className="max-w-sm text-center text-muted-foreground text-sm leading-relaxed">
      The new type scale was drawn by{' '}
      <ProfileHoverCard
        name="Noor Haddad"
        handle="@noor"
        avatar="/img/gallery-3-tiny.png"
        description="Type designer. Draws letters for screens, maps and the occasional menu."
        meta={
          <>
            <span className="inline-flex items-center gap-1">
              <MapPinIcon /> Lisbon
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarIcon /> Joined March 2021
            </span>
          </>
        }
        stats={[
          { label: 'Following', value: 312 },
          { label: 'Followers', value: '12.4k' },
        ]}
        action={
          <Button size="sm" variant="outline">
            Follow
          </Button>
        }
      >
        <a href="#noor" className="font-medium text-foreground underline underline-offset-4">
          @noor
        </a>
      </ProfileHoverCard>{' '}
      over a winter, and tuned for small sizes.
    </p>
  )
}
