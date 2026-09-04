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
import { Label } from '@/ui/label'
import { Switch } from '@/ui/switch'

const filters = ['In stock only', 'Free shipping', 'On sale']

export default function DrawerDemo() {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Open filters</Button>
      </DrawerTrigger>
      <DrawerContent className="mx-auto max-w-md">
        <DrawerHeader>
          <DrawerTitle>Filters</DrawerTitle>
          <DrawerDescription>Drag the sheet down to dismiss it.</DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="flex flex-col gap-4 pb-2">
          {filters.map((label) => (
            <div key={label} className="flex items-center justify-between">
              <Label htmlFor={label}>{label}</Label>
              <Switch id={label} />
            </div>
          ))}
        </DrawerBody>
        <DrawerFooter>
          <Button>Show results</Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
