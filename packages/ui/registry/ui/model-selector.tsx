'use client'

import { CheckIcon, ChevronDownIcon } from 'lucide-react'
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui'
import * as React from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { SegmentedControl, SegmentedControlItem } from '@/components/ui/segmented-control'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface Model {
  id: string
  name: string
  /** One line under the name: what it is good at. */
  description?: string
  /** How hard it can think, from least to most, such as `['Low', 'Medium', 'High']`. */
  efforts?: string[]
}

export interface ModelChoice {
  model: string
  /** One of the model's `efforts`, if it has any. */
  effort?: string
}

export interface ModelSelectorLabels {
  /** Names the list of models. */
  models: string
  /** Names the effort control. */
  effort: string
  /** The trigger, read out with what is picked. */
  trigger: (model: string, effort?: string) => string
}

export const defaultModelSelectorLabels: ModelSelectorLabels = {
  models: 'Model',
  effort: 'Effort',
  trigger: (model, effort) => (effort ? `Model: ${model}, ${effort} effort` : `Model: ${model}`),
}

/**
 * The effort at the same share of the way along another model's scale, so switching from the
 * top of three levels to a model with five lands on the top of five.
 */
export function carryEffort(from: Model | undefined, effort: string | undefined, to: Model) {
  const target = to.efforts
  if (!target?.length) return undefined
  const source = from?.efforts ?? []
  const index = effort ? source.indexOf(effort) : -1
  if (index < 0 || source.length < 2) return target[Math.floor((target.length - 1) / 2)]
  return target[Math.round((index / (source.length - 1)) * (target.length - 1))]
}

export interface ModelSelectorProps
  extends Omit<React.ComponentProps<'button'>, 'value' | 'defaultValue' | 'onChange'> {
  models: Model[]
  value?: ModelChoice
  defaultValue?: ModelChoice
  onValueChange?: (value: ModelChoice) => void
  labels?: Partial<ModelSelectorLabels>
}

/**
 * Picks a model and how hard it thinks. The trigger shows both; the panel lists the models
 * and, under them, the chosen model's effort levels as a track of detents. Switching models
 * keeps the effort at the same share of the way along the new model's scale.
 */
function ModelSelector({
  models,
  value,
  defaultValue,
  onValueChange,
  labels: labelsProp,
  className,
  ...props
}: ModelSelectorProps) {
  const labels = useLabels('model-selector', defaultModelSelectorLabels, labelsProp)
  const first = models[0]
  const [uncontrolled, setUncontrolled] = React.useState<ModelChoice>(
    () =>
      defaultValue ?? {
        model: first?.id ?? '',
        effort: first && carryEffort(undefined, undefined, first),
      },
  )
  const choice = value ?? uncontrolled
  const model = models.find((m) => m.id === choice.model) ?? first
  const effortsId = React.useId()

  const change = (next: ModelChoice) => {
    if (value === undefined) setUncontrolled(next)
    onValueChange?.(next)
  }

  if (!model) return null
  return (
    <Popover>
      <PopoverTrigger
        data-slot="model-selector"
        aria-label={labels.trigger(model.name, choice.effort)}
        className={cn(
          'relative inline-flex h-8 items-center gap-1.5 rounded-md px-2 font-medium text-sm outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=open]:bg-accent pointer-coarse:h-11',
          className,
        )}
        {...props}
      >
        <span className="truncate">{model.name}</span>
        {choice.effort && (
          <span className="text-muted-foreground" aria-hidden="true">
            {choice.effort}
          </span>
        )}
        <ChevronDownIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-1.5">
        <RadioGroupPrimitive.Root
          aria-label={labels.models}
          value={model.id}
          onValueChange={(id) => {
            const next = models.find((m) => m.id === id)
            if (next) change({ model: id, effort: carryEffort(model, choice.effort, next) })
          }}
          className="flex flex-col"
        >
          {models.map((m) => (
            <RadioGroupPrimitive.Item
              key={m.id}
              value={m.id}
              className="flex items-start gap-2 rounded-md px-2 py-2 text-left outline-none hover:bg-accent focus-visible:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-sm">{m.name}</span>
                {m.description && (
                  <span className="block text-muted-foreground text-xs">{m.description}</span>
                )}
              </span>
              <RadioGroupPrimitive.Indicator>
                <CheckIcon aria-hidden="true" className="mt-0.5 size-4" />
              </RadioGroupPrimitive.Indicator>
            </RadioGroupPrimitive.Item>
          ))}
        </RadioGroupPrimitive.Root>
        {model.efforts?.length ? (
          <div className="mt-1 border-t px-2 pt-2.5 pb-1">
            <p id={effortsId} className="mb-2 text-muted-foreground text-xs">
              {labels.effort}
            </p>
            <SegmentedControl
              // A new model brings a new set of detents.
              key={model.id}
              aria-labelledby={effortsId}
              size="sm"
              fullWidth
              value={choice.effort}
              onValueChange={(effort) => change({ model: model.id, effort })}
            >
              {model.efforts.map((effort) => (
                <SegmentedControlItem key={effort} value={effort}>
                  {effort}
                </SegmentedControlItem>
              ))}
            </SegmentedControl>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}

export { ModelSelector }
