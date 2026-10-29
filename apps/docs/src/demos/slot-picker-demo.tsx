import { SlotPicker } from '@/components/ui/slot-picker'

export default function SlotPickerDemo() {
  return (
    <SlotPicker
      className="max-w-xl"
      hostTimeZone="America/New_York"
      defaultValue={{ start: 9 * 60 + 30, end: 10 * 60 }}
      bookings={[
        { start: 10 * 60, end: 11 * 60, title: 'Standup' },
        { start: 12 * 60 + 30, end: 13 * 60 + 30, title: 'Lunch' },
        { start: 15 * 60, end: 16 * 60 + 30, title: 'Review' },
      ]}
    />
  )
}
