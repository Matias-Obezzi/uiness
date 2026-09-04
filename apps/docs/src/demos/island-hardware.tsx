import { useMemo, useState } from 'react'
import { Button } from '@/ui/button'
import { createIsland, Island, Spinner, useStandalone } from '@/ui/island'
import { Label } from '@/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select'

type Mode = 'auto' | 'off' | 'wrap' | 'stack'
type Position = 'top' | 'bottom'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default function IslandHardware() {
  // Its own store, so this tester never touches the island the site itself uses.
  const store = useMemo(() => createIsland(), [])
  const standalone = useStandalone()
  const [mode, setMode] = useState<Mode>('auto')
  const [position, setPosition] = useState<Position>('top')

  const resolved = mode === 'auto' ? (standalone ? 'stack' : 'off') : mode
  const hardware = position === 'top' && resolved !== 'off' ? { mode: resolved } : false

  const upload = async () => {
    const handle = store.show({
      id: 'upload',
      leading: <Spinner />,
      trailing: <span className="tabular-nums">0%</span>,
    })
    for (let p = 20; p <= 100; p += 20) {
      await wait(400)
      handle.update({ trailing: <span className="tabular-nums">{p}%</span> })
    }
    handle.update({ leading: '✓', trailing: 'Uploaded', duration: 2000 })
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <Island store={store} position={position} hardware={hardware} />

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="island-mode">Hardware mode</Label>
          <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
            <SelectTrigger id="island-mode" size="sm" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">auto ({standalone ? 'stack' : 'off'})</SelectItem>
              <SelectItem value="off">off</SelectItem>
              <SelectItem value="wrap">wrap</SelectItem>
              <SelectItem value="stack">stack</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="island-position">Position</Label>
          <Select value={position} onValueChange={(v) => setPosition(v as Position)}>
            <SelectTrigger id="island-position" size="sm" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top">top</SelectItem>
              <SelectItem value="bottom">bottom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={upload}>
          Live upload
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            store.show({
              content: (
                <div className="flex w-64 flex-col gap-1">
                  <p className="font-semibold">New message</p>
                  <p className="text-sm opacity-70">Ada: the deploy is green.</p>
                </div>
              ),
              duration: 4000,
            })
          }
        >
          Expanded
        </Button>
        <Button variant="ghost" size="sm" onClick={() => store.dismissAll()}>
          Dismiss
        </Button>
      </div>

      <p className="text-muted-foreground text-sm">
        This page is running {standalone ? 'as an installed app' : 'in a browser tab'}, so `auto`
        resolves to <code>{standalone ? 'stack' : 'off'}</code>. Add the site to your home screen on
        an iPhone and open it from there to see the island line up with the cutout.
      </p>
    </div>
  )
}
