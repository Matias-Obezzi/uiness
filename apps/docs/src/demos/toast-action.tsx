import { Button } from '@/ui/button'
import { toast } from '@/ui/toast'

export default function ToastAction() {
  return (
    <Button
      variant="outline"
      onClick={() =>
        toast('Message archived', {
          description: 'It will stay in Archive for 30 days.',
          action: { label: 'Undo', onClick: () => toast.success('Restored') },
          cancel: { label: 'Dismiss', onClick: () => {} },
        })
      }
    >
      Archive message
    </Button>
  )
}
