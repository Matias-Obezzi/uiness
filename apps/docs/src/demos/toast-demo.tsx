import { Button } from '@/ui/button'
import { toast } from '@/ui/toast'

export default function ToastDemo() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={() => toast('Event has been created')}>
        Default
      </Button>
      <Button
        variant="outline"
        onClick={() => toast.success('Saved', { description: 'All changes are in.' })}
      >
        Success
      </Button>
      <Button variant="outline" onClick={() => toast.error('Could not save the document')}>
        Error
      </Button>
      <Button variant="outline" onClick={() => toast.info('New version available')}>
        Info
      </Button>
      <Button variant="outline" onClick={() => toast.warning('Storage is almost full')}>
        Warning
      </Button>
      <Button variant="outline" onClick={() => toast.loading('Uploading 3 files…')}>
        Loading
      </Button>
      <Button variant="ghost" onClick={() => toast.dismiss()}>
        Dismiss all
      </Button>
    </div>
  )
}
