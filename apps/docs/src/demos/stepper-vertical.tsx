import { useState } from 'react'
import { Button } from '@/ui/button'
import { Stepper, StepperItem } from '@/ui/stepper'

export default function StepperVertical() {
  const [step, setStep] = useState(2)

  return (
    <Stepper
      value={step}
      onValueChange={setStep}
      orientation="vertical"
      className="w-full max-w-sm"
    >
      <StepperItem title="Upload the file" description="contacts.csv, 1,204 rows" />
      <StepperItem title="Match the columns" description="7 of 7 matched" />
      <StepperItem title="Check the rows" description="2 rows have no email" error={step === 2}>
        {step === 2 && (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setStep(3)}>
              Skip them
            </Button>
            <Button size="sm" variant="outline">
              Review
            </Button>
          </div>
        )}
      </StepperItem>
      <StepperItem title="Import" description="Adds the contacts to your list" />
    </Stepper>
  )
}
