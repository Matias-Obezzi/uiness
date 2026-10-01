import { useState } from 'react'
import { confirm } from '@/ui/alert-dialog'
import { Button } from '@/ui/button'
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/ui/drawer'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'

export default function DrawerGuard() {
  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState('Ada Lovelace')
  const [name, setName] = useState(saved)
  const dirty = name !== saved

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (next) setName(saved)
        setOpen(next)
      }}
    >
      <DrawerTrigger asChild>
        <Button variant="outline">Edit profile</Button>
      </DrawerTrigger>
      <DrawerContent
        className="mx-auto max-w-md"
        onDismissAttempt={() =>
          !dirty ||
          confirm({
            title: 'Discard your changes?',
            description: 'The new name has not been saved.',
            confirmText: 'Discard',
            cancelText: 'Keep editing',
            variant: 'destructive',
          })
        }
      >
        <DrawerHeader>
          <DrawerTitle>Profile</DrawerTitle>
          <DrawerDescription>Change the name, then try to swipe the sheet away.</DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="flex flex-col gap-2 pb-2">
          <Label htmlFor="drawer-guard-name">Name</Label>
          <Input id="drawer-guard-name" value={name} onChange={(e) => setName(e.target.value)} />
        </DrawerBody>
        <DrawerFooter>
          {/* Saving is a decision already made, so it closes through `open`, without asking. */}
          <Button
            onClick={() => {
              setSaved(name)
              setOpen(false)
            }}
          >
            Save
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
