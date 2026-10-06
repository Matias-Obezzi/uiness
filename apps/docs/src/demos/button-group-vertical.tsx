import { ButtonGroup, ButtonGroupItem } from '@/components/ui/button-group'

const links = ['Overview', 'Activity', 'Settings', 'Billing']

export default function ButtonGroupVertical() {
  return (
    <ButtonGroup orientation="vertical" aria-label="Account" className="w-48">
      {links.map((link) => (
        <ButtonGroupItem key={link} asChild>
          <a
            href={`#${link.toLowerCase()}`}
            aria-current={link === 'Overview' ? 'page' : undefined}
          >
            {link}
          </a>
        </ButtonGroupItem>
      ))}
    </ButtonGroup>
  )
}
