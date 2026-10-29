import { LiquidSlider } from '@/components/ui/liquid-slider'

export default function LiquidSliderDemo() {
  return (
    <LiquidSlider
      label="Water today"
      defaultValue={45}
      format={(v) => `${(v * 0.025).toFixed(1)} L of 2.5 L`}
    />
  )
}
