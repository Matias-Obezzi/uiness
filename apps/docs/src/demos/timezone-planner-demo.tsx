import { TimezonePlanner } from '@/components/ui/timezone-planner'

export default function TimezonePlannerDemo() {
  return (
    <TimezonePlanner
      defaultValue={14 * 60}
      people={[
        { name: 'You · Lisbon', timeZone: 'Europe/Lisbon' },
        { name: 'Maya · New York', timeZone: 'America/New_York' },
        { name: 'Kenji · Tokyo', timeZone: 'Asia/Tokyo', workStart: 10, workEnd: 19 },
      ]}
    />
  )
}
