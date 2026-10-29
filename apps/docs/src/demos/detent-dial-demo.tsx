import { DetentDial } from '@/components/ui/detent-dial'

export default function DetentDialDemo() {
  return (
    <DetentDial
      label="Temperature"
      min={16}
      max={28}
      step={0.5}
      defaultValue={21}
      format={(v) => `${v.toFixed(1)}°C`}
    />
  )
}
