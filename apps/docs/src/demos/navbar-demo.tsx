import { BellIcon, CompassIcon, HomeIcon, UserIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/ui/button'
import { Navbar, NavbarActions, NavbarBrand, NavbarLink, NavbarLinks } from '@/ui/navbar'

const links = [
  { href: '#home', label: 'Home', icon: <HomeIcon /> },
  { href: '#explore', label: 'Explore', icon: <CompassIcon /> },
  { href: '#alerts', label: 'Alerts', icon: <BellIcon />, badge: 3 },
  { href: '#profile', label: 'Profile', icon: <UserIcon /> },
]

export default function NavbarDemo() {
  const [active, setActive] = useState('#home')
  return (
    <div className="w-full overflow-hidden rounded-lg border">
      <Navbar sticky={false} breakpoint="sm" className="border-x-0 border-t-0">
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
        <NavbarActions>
          <Button size="sm">Sign in</Button>
        </NavbarActions>
      </Navbar>
      <p className="p-6 text-muted-foreground text-sm">
        Narrow the window: the links collapse into a button that opens the menu from the bottom.
      </p>
    </div>
  )
}
