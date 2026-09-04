import { Button } from '@/ui/button'
import { toast } from '@/ui/toast'

const save = (fail: boolean) =>
  new Promise<{ name: string }>((resolve, reject) =>
    setTimeout(() => (fail ? reject(new Error('Offline')) : resolve({ name: 'report.pdf' })), 1800),
  )

export default function ToastPromise() {
  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={() =>
          toast.promise(save(false), {
            loading: 'Saving…',
            success: (data) => `${data.name} has been saved`,
            error: (e) => `Could not save: ${(e as Error).message}`,
          })
        }
      >
        Save
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.promise(save(true), {
            loading: 'Syncing…',
            success: 'Synced',
            error: (e) => `Could not sync: ${(e as Error).message}`,
          })
        }
      >
        Sync (fails)
      </Button>
    </div>
  )
}
