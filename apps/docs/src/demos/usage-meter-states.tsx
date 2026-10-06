import { UsageMeter } from '@/components/ui/usage-meter'

const seats = (admins: number, members: number, guests: number) => [
  { key: 'admins', label: 'Admins', value: admins },
  { key: 'members', label: 'Members', value: members },
  { key: 'guests', label: 'Guests', value: guests },
]

export default function UsageMeterStates() {
  return (
    <div className="grid w-full max-w-md gap-8">
      <UsageMeter label="Seats" segments={seats(2, 9, 3)} limit={25} />
      <UsageMeter label="Seats" segments={seats(3, 15, 4)} limit={25} />
      <UsageMeter label="Seats" segments={seats(3, 21, 5)} limit={25} />
    </div>
  )
}
