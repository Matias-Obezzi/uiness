import { Badge } from '@/ui/badge'
import { Button } from '@/ui/button'
import {
  ExpandableCard,
  ExpandableCardContent,
  ExpandableCardDescription,
  ExpandableCardTitle,
  ExpandableCardTrigger,
} from '@/ui/expandable-card'

const trips = [
  {
    image: '/img/gallery-1.png',
    place: 'Lofoten',
    country: 'Norway',
    nights: 6,
    text: 'Fishing villages under granite peaks, with midnight sun in June and the northern lights from September.',
  },
  {
    image: '/img/gallery-2.png',
    place: 'Hallstatt',
    country: 'Austria',
    nights: 3,
    text: 'A lake town at the foot of the Dachstein, best early in the morning before the boats arrive.',
  },
  {
    image: '/img/gallery-4.png',
    place: 'Isle of Skye',
    country: 'Scotland',
    nights: 5,
    text: 'Ridges, sea cliffs and single track roads. Bring a rain jacket whatever the forecast says.',
  },
]

export default function ExpandableCardDemo() {
  return (
    <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-3">
      {trips.map((trip) => (
        <ExpandableCard key={trip.place}>
          <ExpandableCardTrigger>
            <img src={trip.image} alt="" className="aspect-[4/3] w-full object-cover" />
            <span className="flex flex-col gap-0.5 p-4">
              <span className="font-semibold">{trip.place}</span>
              <span className="text-muted-foreground text-sm">
                {trip.country} · {trip.nights} nights
              </span>
            </span>
          </ExpandableCardTrigger>
          <ExpandableCardContent>
            <img src={trip.image} alt="" className="aspect-[16/9] w-full object-cover" />
            <div className="flex flex-col gap-4 p-6">
              <div className="flex flex-col gap-1">
                <ExpandableCardTitle>{trip.place}</ExpandableCardTitle>
                <ExpandableCardDescription>
                  {trip.country} · {trip.nights} nights
                </ExpandableCardDescription>
              </div>
              <p className="text-pretty text-sm leading-relaxed">{trip.text}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Hiking</Badge>
                <Badge variant="secondary">Photography</Badge>
                <Badge variant="secondary">Coast</Badge>
              </div>
              <Button className="self-start">Plan this trip</Button>
            </div>
          </ExpandableCardContent>
        </ExpandableCard>
      ))}
    </div>
  )
}
