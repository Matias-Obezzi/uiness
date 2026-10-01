import { confirm } from '@/ui/alert-dialog'
import { Button } from '@/ui/button'
import { toast } from '@/ui/toast'

const archive = () => new Promise<void>((resolve) => setTimeout(resolve, 1500))

export default function AlertDialogAsync() {
  const archiveProject = async () => {
    const archived = await confirm({
      title: 'Archive the project?',
      description: 'Nobody can edit it until it is restored.',
      confirmText: 'Archive',
      onConfirm: archive,
    })
    if (archived) toast.success('Project archived')
  }
  return (
    <Button variant="outline" onClick={archiveProject}>
      Archive project
    </Button>
  )
}
