import { BellIcon, CompassIcon, HomeIcon, PlusIcon, SettingsIcon, UserIcon } from 'lucide-react'
import { useState } from 'react'
import { Navbar, NavbarBrand, NavbarLink, NavbarLinks } from '@/ui/navbar'

const links = [
  { href: '#home', label: 'Home', icon: <HomeIcon /> },
  { href: '#explore', label: 'Explore', icon: <CompassIcon /> },
  { href: '#new', label: 'New', icon: <PlusIcon /> },
  { href: '#alerts', label: 'Alerts', icon: <BellIcon />, badge: 12 },
  { href: '#profile', label: 'Profile', icon: <UserIcon /> },
  { href: '#settings', label: 'Settings', icon: <SettingsIcon /> },
]

export default function NavbarTabs() {
  const [active, setActive] = useState('#home')
  return (
    <Navbar mobile="tabs" breakpoint="sm" maxTabs={5} sticky={false} className="border-x-0">
      <NavbarBrand href="#home">Acme</NavbarBrand>
      <NavbarLinks className="ml-2">
        {links.map((link) => (
          <NavbarLink
            key={link.href}
            href={link.href}
            icon={link.icon}
            badge={link.badge}
            active={active === link.href}
            onClick={(e) => {
              e.preventDefault()
              setActive(link.href)
            }}
          >
            {link.label}
          </NavbarLink>
        ))}
      </NavbarLinks>
    </Navbar>
  )
}
