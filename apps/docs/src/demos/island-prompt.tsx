import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { island } from '@/components/ui/island'

export default function IslandPrompt() {
  const [result, setResult] = useState('')
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant="outline"
        onClick={async () => {
          const name = await island.prompt({
            title: 'Rename the board',
            defaultValue: 'Roadmap',
            confirmText: 'Rename',
          })
          setResult(name === null ? 'Cancelled' : `Renamed to “${name}”`)
        }}
      >
        Rename
      </Button>
      <Button
        variant="outline"
        onClick={async () => {
          const format = await island.choose({
            title: 'Export as',
            choices: [
              { label: 'PDF', value: 'pdf' },
              { label: 'PNG image', value: 'png' },
              { label: 'CSV data', value: 'csv' },
            ],
          })
          setResult(format === null ? 'Cancelled' : `Exporting ${format.toUpperCase()}`)
        }}
      >
        Export
      </Button>
      <span className="text-muted-foreground text-sm">{result}</span>
    </div>
  )
}
