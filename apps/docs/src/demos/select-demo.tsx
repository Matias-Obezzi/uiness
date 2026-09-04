import { Label } from '@/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/ui/select'

export default function SelectDemo() {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="timezone">Timezone</Label>
      <Select defaultValue="art">
        <SelectTrigger id="timezone" className="w-56">
          <SelectValue placeholder="Pick a timezone" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>America</SelectLabel>
            <SelectItem value="art">Buenos Aires</SelectItem>
            <SelectItem value="est">New York</SelectItem>
            <SelectItem value="pst">Los Angeles</SelectItem>
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>Europe</SelectLabel>
            <SelectItem value="cet">Madrid</SelectItem>
            <SelectItem value="gmt">London</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
