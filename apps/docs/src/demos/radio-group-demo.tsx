import { RadioGroup, RadioGroupItem } from '@/ui/radio-group'

const plans = [
  { value: 'free', label: 'Free', hint: 'One project, community support.' },
  { value: 'pro', label: 'Pro', hint: 'Unlimited projects and email support.' },
  { value: 'team', label: 'Team', hint: 'Everything in Pro, plus seats.' },
]

export default function RadioGroupDemo() {
  return (
    <RadioGroup defaultValue="pro" className="w-full max-w-sm">
      {plans.map((plan) => (
        <label
          key={plan.value}
          htmlFor={plan.value}
          className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent has-[button[data-state=checked]]:border-primary"
        >
          <RadioGroupItem value={plan.value} id={plan.value} className="mt-0.5" />
          <span>
            <span className="block font-medium text-sm">{plan.label}</span>
            <span className="block text-muted-foreground text-sm">{plan.hint}</span>
          </span>
        </label>
      ))}
    </RadioGroup>
  )
}
