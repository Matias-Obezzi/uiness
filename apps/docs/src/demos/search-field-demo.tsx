import { useEffect, useState } from 'react'
import { SearchField } from '@/ui/search-field'

const pages = ['Accordion', 'Button', 'Calendar', 'Combobox', 'Dialog', 'Popover', 'Tabs']

export default function SearchFieldDemo() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(pages)

  // Pretend the results come from a server.
  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => {
      setResults(pages.filter((p) => p.toLowerCase().includes(query.toLowerCase())))
      setLoading(false)
    }, 400)
    return () => clearTimeout(t)
  }, [query])

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <SearchField
        aria-label="Search components"
        placeholder="Search components…"
        shortcut="/"
        value={query}
        onValueChange={setQuery}
        loading={loading}
      />
      <ul className="flex flex-wrap gap-1.5 text-sm">
        {results.map((r) => (
          <li key={r} className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
            {r}
          </li>
        ))}
        {results.length === 0 && <li className="text-muted-foreground">Nothing matches.</li>}
      </ul>
    </div>
  )
}
