import { Button } from '@/components/ui/button'
import { Navbar, NavbarActions, NavbarBrand, NavbarLink, NavbarLinks } from '@/components/ui/navbar'

export default function NavbarShrink() {
  return (
    // A box that scrolls stands in for the page.
    <div className="h-96 w-full overflow-y-auto rounded-lg border">
      <Navbar shrinkOnScroll breakpoint="sm">
        <NavbarBrand href="#top">Acme</NavbarBrand>
        <NavbarLinks className="ml-2">
          <NavbarLink href="#features" active>
            Features
          </NavbarLink>
          <NavbarLink href="#pricing">Pricing</NavbarLink>
          <NavbarLink href="#docs">Docs</NavbarLink>
        </NavbarLinks>
        <NavbarActions>
          <Button size="sm">Sign in</Button>
        </NavbarActions>
      </Navbar>
      <div className="flex flex-col gap-4 p-6">
        <p className="text-muted-foreground text-sm">
          Scroll this box: the bar shrinks into a pill.
        </p>
        {Array.from({ length: 8 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: placeholder blocks
          <div key={i} className="h-24 rounded-lg bg-muted/60" />
        ))}
      </div>
    </div>
  )
}
