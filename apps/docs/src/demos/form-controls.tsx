import { useState } from 'react'
import { Checkbox } from '@/ui/checkbox'
import { FormControl, FormDescription, FormField, FormLabel, FormMessage } from '@/ui/form'
import { RadioGroup, RadioGroupItem } from '@/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select'

export default function FormControls() {
  const [plan, setPlan] = useState('')

  return (
    <div className="flex w-full max-w-sm flex-col gap-8">
      <FormField name="plan" error={plan === '' ? 'Pick a plan to continue.' : undefined} required>
        <FormLabel>Plan</FormLabel>
        <FormControl>
          <RadioGroup value={plan} onValueChange={setPlan}>
            {['Free', 'Pro', 'Team'].map((option) => (
              <div key={option} className="flex items-center gap-3">
                <RadioGroupItem value={option} id={`plan-${option}`} />
                <label htmlFor={`plan-${option}`} className="text-sm">
                  {option}
                </label>
              </div>
            ))}
          </RadioGroup>
        </FormControl>
        <FormMessage />
      </FormField>

      <FormField name="region">
        <FormLabel>Region</FormLabel>
        <FormControl>
          <Select>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pick a region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sa">South America</SelectItem>
              <SelectItem value="eu">Europe</SelectItem>
            </SelectContent>
          </Select>
        </FormControl>
        <FormDescription>Where your data lives.</FormDescription>
      </FormField>

      <FormField name="terms">
        <div className="flex items-center gap-3">
          <FormControl>
            <Checkbox />
          </FormControl>
          <FormLabel className="font-normal">I have read the terms</FormLabel>
        </div>
      </FormField>
    </div>
  )
}
