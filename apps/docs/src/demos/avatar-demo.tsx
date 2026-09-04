import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar'

export default function AvatarDemo() {
  return (
    <div className="flex items-center gap-3">
      <Avatar>
        <AvatarImage src="/img/gallery-1-tiny.png" alt="Dawn" />
        <AvatarFallback>DA</AvatarFallback>
      </Avatar>
      <Avatar className="size-10">
        <AvatarImage src="/img/gallery-3-tiny.png" alt="Dusk" />
        <AvatarFallback>DU</AvatarFallback>
      </Avatar>
      <Avatar className="size-12 rounded-lg">
        <AvatarImage src="/does-not-exist.png" alt="" />
        <AvatarFallback className="rounded-lg">AL</AvatarFallback>
      </Avatar>
      <div className="-space-x-2 flex *:ring-2 *:ring-background">
        <Avatar>
          <AvatarImage src="/img/gallery-2-tiny.png" alt="" />
          <AvatarFallback>NO</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarImage src="/img/gallery-4-tiny.png" alt="" />
          <AvatarFallback>NI</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>+3</AvatarFallback>
        </Avatar>
      </div>
    </div>
  )
}
