import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/ui/carousel'

export default function CarouselDemo() {
  return (
    <Carousel label="Product highlights" className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-lg">Highlights</h3>
        <div className="flex gap-2">
          <CarouselPrevious />
          <CarouselNext />
        </div>
      </div>

      <CarouselContent className="pb-2">
        <CarouselItem className="w-[22rem]">
          <article className="flex h-72 flex-col justify-end rounded-2xl bg-foreground p-6 text-background">
            <p className="font-semibold text-2xl leading-tight">A titanium design</p>
            <p className="mt-2 text-sm opacity-80">
              Lighter than it looks, and stronger than it has any right to be.
            </p>
          </article>
        </CarouselItem>

        <CarouselItem className="w-[16rem]">
          <figure className="h-72 overflow-hidden rounded-2xl">
            <img
              src="/img/gallery-1.png"
              alt="A narrow crop of a landscape"
              className="size-full object-cover"
            />
          </figure>
        </CarouselItem>

        <CarouselItem className="w-[30rem]">
          <figure className="h-72 overflow-hidden rounded-2xl">
            <img
              src="/img/gallery-2.png"
              alt="A wide landscape"
              className="size-full object-cover"
            />
          </figure>
        </CarouselItem>

        <CarouselItem className="w-[20rem]">
          <blockquote className="flex h-72 flex-col justify-center rounded-2xl border bg-muted/40 p-6">
            <p className="text-balance font-medium text-xl leading-snug">
              “The items do not have to match. This one is only text, and it sits between two
              pictures of different widths.”
            </p>
            <footer className="mt-4 text-muted-foreground text-sm">
              A card that is just words
            </footer>
          </blockquote>
        </CarouselItem>

        <CarouselItem className="w-[16rem]">
          <figure className="h-72 overflow-hidden rounded-2xl">
            <img src="/img/gallery-3.png" alt="A forest" className="size-full object-cover" />
          </figure>
        </CarouselItem>

        <CarouselItem className="w-[24rem]">
          <article className="flex h-72 flex-col justify-between rounded-2xl border p-6">
            <p className="font-semibold text-lg">Anything goes in an item</p>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li>Drag it with the mouse, or flick it on a touch screen.</li>
              <li>Tab into the run and use the arrow keys.</li>
              <li>Press the dots to jump straight to one.</li>
            </ul>
          </article>
        </CarouselItem>
      </CarouselContent>

      <CarouselDots className="mt-4" />

      <p className="mt-3 text-center text-muted-foreground text-sm">
        Tab reaches the run itself, then the arrow keys, Home and End move it — the browser does
        that part, so it works the same as any other scrolling region.
      </p>
    </Carousel>
  )
}
