import { useEffect, useState } from 'react'
import { type AgentStep, AgentSteps } from '@/components/ui/agent-steps'
import { Button } from '@/components/ui/button'

const plan = [
  { label: 'Read the issue', log: ['GET /issues/482', 'Title: Checkout fails on Safari'] },
  { label: 'Find the failing code', log: ['grep "applePay" src/', 'src/checkout/pay.ts:41'] },
  { label: 'Write a fix', log: ['Edit src/checkout/pay.ts', 'Guard against a missing session'] },
  { label: 'Run the tests', log: ['vitest run checkout', '24 passed'] },
]

export default function AgentStepsDemo() {
  const [run, setRun] = useState(0)
  const [at, setAt] = useState(0)
  const [startedAt, setStartedAt] = useState(() => Date.now())
  const [endedAt, setEndedAt] = useState<number>()

  // One step every two seconds; a log line each second.
  useEffect(() => {
    if (at >= plan.length * 2) {
      setEndedAt(Date.now())
      return
    }
    const timer = setTimeout(() => setAt(at + 1), 1000)
    return () => clearTimeout(timer)
  }, [at])

  const steps: AgentStep[] = plan.map((step, i) => {
    const status = at >= (i + 1) * 2 ? 'done' : at >= i * 2 ? 'running' : 'pending'
    return {
      id: `${run}-${i}`,
      label: step.label,
      status,
      log: status === 'pending' ? undefined : step.log.slice(0, at - i * 2 + 1),
    }
  })

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <AgentSteps
        steps={steps}
        startedAt={startedAt}
        endedAt={endedAt}
        summary={<p>Fixed the Safari checkout and all 24 tests pass. Ready for review.</p>}
      />
      <Button
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => {
          setRun(run + 1)
          setAt(0)
          setStartedAt(Date.now())
          setEndedAt(undefined)
        }}
      >
        Run again
      </Button>
    </div>
  )
}
