import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Stepper } from '@/components/ui/stepper'

const steps = [
  { title: 'Account', description: 'Email and password' },
  { title: 'Workspace', description: 'Name and address' },
  { title: 'Invite', description: 'Bring your team' },
  { title: 'Done', description: 'Start building' },
]

export default function StepperDemo() {
  const [step, setStep] = useState(1)

  return (
    <div className="flex w-full max-w-2xl flex-col gap-8">
      <Stepper value={step} onValueChange={setStep} steps={steps} />
      <div className="flex justify-between gap-2">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}>
          Back
        </Button>
        <Button
          onClick={() => setStep(step < steps.length ? step + 1 : 0)}
          variant={step === steps.length ? 'secondary' : 'default'}
        >
          {step === steps.length ? 'Start over' : step === steps.length - 1 ? 'Finish' : 'Next'}
        </Button>
      </div>
    </div>
  )
}
