import { Transition, Transitions, useViewTransition } from '@uiness/transitions'
import { ArrowLeftIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

const albums = [
  { id: 1, title: 'Golden Hour', artist: 'Ines Duarte', cover: '/img/gallery-1.png' },
  { id: 2, title: 'Still Water', artist: 'Kofi Mensah', cover: '/img/gallery-2.png' },
  { id: 3, title: 'Low Tide', artist: 'Hana Sato', cover: '/img/gallery-3.png' },
  { id: 4, title: 'City Lights', artist: 'Leo Park', cover: '/img/gallery-4.png' },
]
const tracks = ['Opening', 'Long Road', 'Interlude', 'Afterglow', 'Home Again']

export default function TransitionsDemo() {
  const [open, setOpen] = useState<number | null>(null)
  const [slow, setSlow] = useState(false)
  const start = useViewTransition()
  const album = albums.find((a) => a.id === open)

  return (
    // Inside a docs page the page itself does not animate: only the album card and its parts.
    <Transitions page="none" duration={slow ? 1500 : 400}>
      <div className="flex w-full max-w-md flex-col gap-3">
        {/* Grows and shrinks to fit what it shows. */}
        <Transition name="album-card">
          <div className="overflow-hidden rounded-xl border bg-card">
            {/* Stays put while the rest changes. */}
            <Transition persist>
              <div className="flex h-12 items-center gap-2 border-b px-2">
                {album ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Back to albums"
                    onClick={() => start(() => setOpen(null), { direction: 'back' })}
                  >
                    <ArrowLeftIcon />
                  </Button>
                ) : (
                  <span className="w-2" />
                )}
                <span className="font-semibold">Albums</span>
              </div>
            </Transition>

            {album ? (
              <div className="flex flex-col gap-4 p-4">
                <div className="flex items-end gap-4">
                  <Transition name={`cover-${album.id}`}>
                    <img
                      src={album.cover}
                      alt=""
                      className="size-32 shrink-0 rounded-lg object-cover"
                    />
                  </Transition>
                  <div className="min-w-0">
                    <Transition name={`title-${album.id}`}>
                      <h3 className="w-fit font-semibold text-xl">{album.title}</h3>
                    </Transition>
                    <Transition enter="fade-up" exit="fade">
                      <p className="text-muted-foreground text-sm">{album.artist}</p>
                    </Transition>
                  </div>
                </div>
                <Transition stagger enter="fade-up" exit="fade">
                  <ol className="flex flex-col divide-y text-sm">
                    {tracks.map((track, i) => (
                      <li key={track} className="flex gap-3 py-2">
                        <span className="w-4 text-muted-foreground tabular-nums">{i + 1}</span>
                        {track}
                      </li>
                    ))}
                  </ol>
                </Transition>
              </div>
            ) : (
              <ul className="grid grid-cols-2 gap-3 p-4">
                {albums.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => start(() => setOpen(a.id))}
                      className="flex w-full flex-col gap-2 rounded-lg text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      <Transition name={`cover-${a.id}`}>
                        <img
                          src={a.cover}
                          alt=""
                          className="aspect-square w-full rounded-lg object-cover"
                        />
                      </Transition>
                      <Transition name={`title-${a.id}`}>
                        <span className="w-fit font-medium text-sm">{a.title}</span>
                      </Transition>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Transition>
        <div className="flex items-center gap-2">
          <Switch id="transitions-slow" checked={slow} onCheckedChange={setSlow} />
          <Label htmlFor="transitions-slow">Slow motion</Label>
        </div>
      </div>
    </Transitions>
  )
}
