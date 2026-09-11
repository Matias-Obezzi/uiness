import { useState } from 'react'
import { Dropzone, type DropzoneRejection } from '@/ui/dropzone'

export default function DropzoneDemo() {
  const [files, setFiles] = useState<File[]>([])
  const [rejected, setRejected] = useState<DropzoneRejection[]>([])

  return (
    <div className="w-full max-w-md space-y-3">
      <Dropzone
        accept="image/png,image/jpeg,.webp"
        multiple
        maxFiles={3}
        maxSize={2 * 1024 * 1024}
        onFiles={(next) => {
          setFiles(next)
          setRejected([])
        }}
        onRejected={setRejected}
      />
      {files.length > 0 && (
        <p className="text-muted-foreground text-sm">
          {files.length} file{files.length === 1 ? '' : 's'} ready to upload.
        </p>
      )}
      {rejected.length > 0 && (
        <ul className="space-y-1 text-destructive text-sm">
          {rejected.map((rejection) => (
            <li key={`${rejection.file.name}:${rejection.reason}`}>{rejection.message}</li>
          ))}
        </ul>
      )}
      <p className="text-muted-foreground text-sm">
        Drop files from the desktop, or use the keyboard: Tab to the box and press Space or Enter to
        open the file picker. Anything turned away says why instead of disappearing.
      </p>
    </div>
  )
}
