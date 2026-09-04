import { Button } from '@/ui/button'
import { island, Spinner } from '@/ui/island'

const save = (fail: boolean) =>
  new Promise<string>((resolve, reject) =>
    setTimeout(() => (fail ? reject(new Error('Offline')) : resolve('report.pdf')), 1500),
  )

export default function IslandPromise() {
  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={() =>
          island.promise(save(false), {
            loading: { leading: <Spinner />, trailing: 'Exporting' },
            success: (name) => ({ leading: '✓', trailing: `Saved ${name}` }),
            error: (e) => ({ leading: '⚠', trailing: (e as Error).message }),
          })
        }
      >
        Export
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          island.promise(save(true), {
            loading: { leading: <Spinner />, trailing: 'Syncing' },
            error: (e) => ({ leading: '⚠', trailing: (e as Error).message }),
          })
        }
      >
        Sync (fails)
      </Button>
    </div>
  )
}
