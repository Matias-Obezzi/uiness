import { CheckIcon } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'
import { type BillingPeriod, BillingToggle, Price } from '@/ui/billing-toggle'
import { Button } from '@/ui/button'

const plans = [
  { name: 'Hobby', monthly: 0, yearly: 0, features: ['1 project', 'Community support'] },
  {
    name: 'Pro',
    monthly: 24,
    yearly: 19,
    features: ['Unlimited projects', 'Email support', 'Analytics'],
    featured: true,
  },
  { name: 'Team', monthly: 79, yearly: 63, features: ['Everything in Pro', 'SSO', 'Audit log'] },
]

export default function BillingToggleDemo() {
  const [period, setPeriod] = React.useState<BillingPeriod>('monthly')
  return (
    <div className="grid w-full justify-items-center gap-8">
      <BillingToggle value={period} onValueChange={setPeriod} savings={0.2} locale="en-US" />
      <div className="grid w-full gap-4 sm:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={cn(
              'flex flex-col gap-4 rounded-xl border p-5',
              plan.featured && 'border-foreground/20 shadow-sm',
            )}
          >
            <div className="font-medium text-sm">{plan.name}</div>
            <div>
              <Price
                amount={period === 'yearly' ? plan.yearly : plan.monthly}
                locale="en-US"
                period="/month"
              />
              <p className="mt-1 text-muted-foreground text-xs">
                {plan.monthly === 0
                  ? 'Free forever'
                  : period === 'yearly'
                    ? `$${plan.yearly * 12} billed yearly`
                    : 'Billed monthly'}
              </p>
            </div>
            <ul className="grid gap-1.5 text-sm">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <CheckIcon aria-hidden className="size-4 text-muted-foreground" />
                  {f}
                </li>
              ))}
            </ul>
            <Button variant={plan.featured ? 'default' : 'outline'} className="mt-auto">
              Choose {plan.name}
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
