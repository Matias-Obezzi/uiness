import { SearchField } from '@/components/ui/search-field'

export default function SearchFieldExpanding() {
  return (
    <div className="flex w-full max-w-md items-center justify-between gap-4 rounded-lg border px-4 py-2">
      <span className="font-semibold text-sm">Inbox</span>
      <SearchField expanding expandedWidth="14rem" placeholder="Search mail…" shortcut="mod+k" />
    </div>
  )
}
