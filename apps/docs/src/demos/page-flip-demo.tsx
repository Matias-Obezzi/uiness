import { PageFlip } from '@/components/ui/page-flip'

const chapter = [
  ['The Lighthouse', 'Chapter one'],
  ['The keeper climbed the stairs at dusk, as he had every evening for thirty years.'],
  ['Below, the sea turned from silver to slate, and the gulls went quiet one by one.'],
  ['/img/gallery-4.png', 'The bay at night'],
  ['He lit the lamp and watched its beam find the rocks, then the reef, then nothing at all.'],
  ['Far out, a light answered. It had never done that before.'],
]

export default function PageFlipDemo() {
  return (
    <PageFlip
      pages={chapter.map(([text, note]) =>
        text?.startsWith('/') ? (
          <figure key={text} className="flex h-full flex-col gap-2">
            <img src={text} alt={note} className="min-h-0 flex-1 rounded object-cover" />
            <figcaption className="text-muted-foreground text-xs">{note}</figcaption>
          </figure>
        ) : note ? (
          <div key={text} className="flex h-full flex-col items-center justify-center text-center">
            <p className="font-serif text-lg sm:text-2xl">{text}</p>
            <p className="text-muted-foreground text-xs">{note}</p>
          </div>
        ) : (
          <p key={text} className="font-serif text-xs leading-relaxed sm:text-base">
            {text}
          </p>
        ),
      )}
    />
  )
}
