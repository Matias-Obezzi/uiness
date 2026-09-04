import { Button } from '@/ui/button'
import { island, Spinner } from '@/ui/island'

export default function IslandBasic() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        onClick={() => island.show({ leading: <Spinner />, trailing: 'Syncing', duration: 2500 })}
      >
        Compact status
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          island.show({
            content: (
              <div className="flex w-72 flex-col gap-1">
                <p className="font-semibold">New message</p>
                <p className="text-sm opacity-70">Ada: the deploy is green, shipping now.</p>
              </div>
            ),
            duration: 4000,
          })
        }
      >
        Expanded content
      </Button>
      <Button variant="ghost" onClick={() => island.dismissAll()}>
        Dismiss all
      </Button>
    </div>
  )
}
