import { BuildingIcon, RocketIcon, SproutIcon } from 'lucide-react'
import {
  RadioCards,
  RadioCardsDescription,
  RadioCardsIcon,
  RadioCardsItem,
  RadioCardsPrice,
  RadioCardsTitle,
} from '@/components/ui/radio-cards'

export default function RadioCardsDemo() {
  return (
    <RadioCards aria-label="Plan" defaultValue="pro" className="w-full max-w-2xl">
      <RadioCardsItem value="starter">
        <RadioCardsIcon>
          <SproutIcon />
        </RadioCardsIcon>
        <RadioCardsTitle>Starter</RadioCardsTitle>
        <RadioCardsDescription>One project, community support.</RadioCardsDescription>
        <RadioCardsPrice>Free</RadioCardsPrice>
      </RadioCardsItem>
      <RadioCardsItem value="pro">
        <RadioCardsIcon>
          <RocketIcon />
        </RadioCardsIcon>
        <RadioCardsTitle>Pro</RadioCardsTitle>
        <RadioCardsDescription>Unlimited projects and previews.</RadioCardsDescription>
        <RadioCardsPrice>$12 / month</RadioCardsPrice>
      </RadioCardsItem>
      <RadioCardsItem value="enterprise" disabled>
        <RadioCardsIcon>
          <BuildingIcon />
        </RadioCardsIcon>
        <RadioCardsTitle>Enterprise</RadioCardsTitle>
        <RadioCardsDescription>Talk to us first.</RadioCardsDescription>
        <RadioCardsPrice>Custom</RadioCardsPrice>
      </RadioCardsItem>
    </RadioCards>
  )
}
