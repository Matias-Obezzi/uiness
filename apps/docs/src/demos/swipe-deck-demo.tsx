import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SwipeDeck } from '@/components/ui/swipe-deck'

const people = [
  {
    id: 'ines',
    name: 'Ines',
    age: 28,
    about: 'Designer, coffee snob',
    image: '/img/gallery-1.png',
  },
  { id: 'kofi', name: 'Kofi', age: 31, about: 'Climbs on weekends', image: '/img/gallery-2.png' },
  {
    id: 'hana',
    name: 'Hana',
    age: 26,
    about: 'Film photos and ramen',
    image: '/img/gallery-3.png',
  },
  { id: 'leo', name: 'Leo', age: 33, about: 'Builds synths', image: '/img/gallery-4.png' },
  { id: 'mia', name: 'Mia', age: 29, about: 'Always on a trail', image: '/img/gallery-5.png' },
]

export default function SwipeDeckDemo() {
  // A new key deals the deck again.
  const [round, setRound] = useState(0)
  const [liked, setLiked] = useState<string[]>([])
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <SwipeDeck
        key={round}
        items={people}
        superLike
        className="max-w-xs"
        onSwipe={(person, direction) =>
          direction !== 'left' && setLiked((list) => [...list, person.name])
        }
        onUndo={(person) => setLiked((list) => list.filter((name) => name !== person.name))}
        empty={
          <div className="flex flex-col items-center gap-3">
            <p>That is everyone for now.</p>
            <Button variant="outline" onClick={() => setRound(round + 1)}>
              Start over
            </Button>
          </div>
        }
      >
        {(person) => (
          <>
            <img src={person.image} alt="" draggable={false} className="size-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent p-5 pt-16 text-white">
              <h3 className="font-semibold text-2xl">
                {person.name} <span className="font-normal">{person.age}</span>
              </h3>
              <p className="text-sm text-white/80">{person.about}</p>
            </div>
          </>
        )}
      </SwipeDeck>
      <p className="text-muted-foreground text-sm" aria-live="off">
        Liked: {liked.length ? liked.join(', ') : 'no one yet'}
      </p>
    </div>
  )
}
