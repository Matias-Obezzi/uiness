import { Button } from '@/ui/button'
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/ui/drawer'

const places = Array.from({ length: 12 }, (_, i) => ({
  name: `Place ${i + 1}`,
  distance: `${(i + 1) * 120} m away`,
}))

export default function DrawerSnap() {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Open the sheet</Button>
      </DrawerTrigger>
      <DrawerContent snapPoints={[0.35, 0.75, 1]} className="mx-auto max-w-md">
        <DrawerHeader>
          <DrawerTitle>Nearby</DrawerTitle>
          <DrawerDescription>
            Drag the sheet between its three sizes, or tap the handle.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="flex flex-col gap-3 pb-6">
          {places.map((place) => (
            <div key={place.name} className="rounded-lg border p-3 text-sm">
              <p className="font-medium">{place.name}</p>
              <p className="text-muted-foreground">{place.distance}</p>
            </div>
          ))}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  )
}
