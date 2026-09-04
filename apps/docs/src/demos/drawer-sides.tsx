import { Button } from '@/ui/button'
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  type DrawerSide,
  DrawerTitle,
  DrawerTrigger,
} from '@/ui/drawer'

const sides: DrawerSide[] = ['bottom', 'top', 'left', 'right']

export default function DrawerSides() {
  return (
    <div className="flex flex-wrap gap-2">
      {sides.map((side) => (
        <Drawer key={side}>
          <DrawerTrigger asChild>
            <Button variant="outline" className="capitalize">
              {side}
            </Button>
          </DrawerTrigger>
          <DrawerContent side={side}>
            <DrawerHeader>
              <DrawerTitle className="capitalize">{side}</DrawerTitle>
              <DrawerDescription>Drag towards the edge to close it.</DrawerDescription>
            </DrawerHeader>
            <DrawerBody className="pb-6 text-muted-foreground text-sm">
              Left and right drawers keep the full height of the screen.
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      ))}
    </div>
  )
}
