import { MailIcon, SettingsIcon, TrashIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge } from '@/ui/badge'
import { Button } from '@/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/ui/card'
import { Checkbox } from '@/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu'
import { Image } from '@/ui/image'
import { Input } from '@/ui/input'
import { Island, island } from '@/ui/island'
import { Label } from '@/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover'
import { Separator } from '@/ui/separator'
import { Switch } from '@/ui/switch'
import { Textarea } from '@/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'

export function UiDemo() {
  const [dark, setDark] = useState(true)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    return () => document.documentElement.classList.remove('dark')
  }, [dark])

  return (
    <div className="ui-demo mx-auto flex max-w-3xl flex-col gap-8 pb-16">
      <Island />
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-xl">@uiness/ui playground</h1>
        <label htmlFor="dark-mode" className="flex items-center gap-2 text-sm">
          <Switch id="dark-mode" checked={dark} onCheckedChange={setDark} />
          dark
        </label>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-medium text-muted-foreground text-sm">Button</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="destructive">
            <TrashIcon /> Delete
          </Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" aria-label="Settings">
            <SettingsIcon />
          </Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
      </section>

      <Separator />

      <section className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create account</CardTitle>
            <CardDescription>Form controls with the theme tokens.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" placeholder="A few words" />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="terms" />
              <Label htmlFor="terms">I agree to the terms</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="news" />
              <Label htmlFor="news">Product updates</Label>
            </div>
          </CardContent>
          <CardFooter className="gap-2">
            <Button className="flex-1">Sign up</Button>
            <Button variant="outline">Cancel</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overlays</CardTitle>
            <CardDescription>Dialog, dropdown, popover and tooltip.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit profile</DialogTitle>
                  <DialogDescription>Changes are saved when you press save.</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" defaultValue="Matías" />
                </div>
                <DialogFooter>
                  <Button>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Menu</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>My account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <MailIcon /> Inbox <DropdownMenuShortcut>⌘I</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <SettingsIcon /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">
                  <TrashIcon /> Delete account
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">Popover</Button>
              </PopoverTrigger>
              <PopoverContent className="flex flex-col gap-2">
                <p className="font-medium text-sm">Dimensions</p>
                <Input placeholder="Width" />
                <Input placeholder="Height" />
              </PopoverContent>
            </Popover>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">Hover me</Button>
              </TooltipTrigger>
              <TooltipContent>Tooltips use the foreground color.</TooltipContent>
            </Tooltip>

            <Button
              variant="secondary"
              onClick={async () => {
                const ok = await island.confirm({
                  title: 'Archive project?',
                  description: 'You can restore it later.',
                  confirmText: 'Archive',
                })
                island.alert({
                  title: ok ? 'Archived' : 'Kept',
                  mode: 'compact',
                  icon: ok ? '✓' : '↩',
                })
              }}
            >
              Island confirm
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-medium text-muted-foreground text-sm">Image</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Image
            src="/slow/2000/photo.png?ui=1"
            alt=""
            width={1600}
            height={1000}
            variant="blur"
            placeholder="/img/photo-tiny.png"
          />
          <Image
            src="/slow/2500/photo.png?ui=2"
            alt=""
            width={1600}
            height={1000}
            variant="pixelate"
            progressive
          />
          <Image
            src="/slow/3000/photo.png?ui=3"
            alt=""
            width={1600}
            height={1000}
            variant="reveal"
          />
        </div>
      </section>
    </div>
  )
}
