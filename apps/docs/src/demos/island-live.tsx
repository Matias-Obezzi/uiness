import { Button } from '@/ui/button'
import { island, Spinner } from '@/ui/island'

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export default function IslandLive() {
  const upload = async () => {
    const handle = island.show({ id: 'upload', leading: <Spinner />, trailing: '0%' })
    for (let p = 10; p <= 100; p += 10) {
      await wait(180)
      handle.update({ trailing: `${p}%` })
    }
    handle.update({ leading: '✓', trailing: 'Uploaded', duration: 1500 })
  }
  return (
    <Button variant="outline" onClick={upload}>
      Upload a file
    </Button>
  )
}
