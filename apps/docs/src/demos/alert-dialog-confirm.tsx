import { confirm } from '@/ui/alert-dialog'
import { Button } from '@/ui/button'
import { toast } from '@/ui/toast'

export default function AlertDialogConfirm() {
  const remove = async () => {
    const ok = await confirm({
      title: 'Delete 3 files?',
      description: 'They go to the trash for 30 days.',
      confirmText: 'Delete',
      variant: 'destructive',
    })
    if (!ok) return
    toast.success('3 files deleted')
  }
  return (
    <Button variant="outline" onClick={remove}>
      Delete files
    </Button>
  )
}
