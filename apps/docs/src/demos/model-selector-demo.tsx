import { useState } from 'react'
import { type Model, type ModelChoice, ModelSelector } from '@/components/ui/model-selector'

const models: Model[] = [
  {
    id: 'swift',
    name: 'Swift',
    description: 'Quick answers, everyday tasks',
    efforts: ['Low', 'High'],
  },
  {
    id: 'sage',
    name: 'Sage',
    description: 'Reasons through hard problems',
    efforts: ['Low', 'Medium', 'High', 'Max'],
  },
  { id: 'scribe', name: 'Scribe', description: 'Long documents, no effort setting' },
]

export default function ModelSelectorDemo() {
  const [choice, setChoice] = useState<ModelChoice>({ model: 'sage', effort: 'High' })
  return (
    <div className="flex flex-col items-center gap-3">
      <ModelSelector models={models} value={choice} onValueChange={setChoice} />
      <p className="text-muted-foreground text-sm">
        {choice.model} · {choice.effort ?? 'no effort setting'}
      </p>
    </div>
  )
}
