import { Spinner } from '@/components/ui/spinner'

export default function SpinnerDemo() {
  return (
    <div className="flex flex-wrap items-center gap-6">
      <Spinner />
      <Spinner className="size-6" />
      <Spinner className="size-8 text-muted-foreground" />
      <span className="flex items-center gap-2 text-muted-foreground text-sm">
        <Spinner aria-hidden="true" />
        Syncing your library…
      </span>
    </div>
  )
}
