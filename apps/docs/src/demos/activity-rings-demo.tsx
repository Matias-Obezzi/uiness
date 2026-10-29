import { ActivityRings } from '@/components/ui/activity-rings'

export default function ActivityRingsDemo() {
  return (
    <ActivityRings
      rings={[
        { label: 'Move', value: 640, goal: 500, unit: 'kcal' },
        { label: 'Exercise', value: 24, goal: 30, unit: 'min' },
        { label: 'Stand', value: 9, goal: 12, unit: 'h' },
      ]}
    />
  )
}
