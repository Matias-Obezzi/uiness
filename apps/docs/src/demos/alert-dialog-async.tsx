import { confirm } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

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
