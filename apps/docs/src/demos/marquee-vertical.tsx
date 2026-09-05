import { Marquee } from '@/ui/marquee'

const tags = ['React', 'Tailwind', 'Radix', 'Vite', 'TypeScript', 'Biome', 'pnpm', 'Vitest']

export default function MarqueeVertical() {
  return (
    <div className="flex h-64 gap-4">
      <Marquee vertical duration={20}>
        {tags.map((t) => (
          <span key={t} className="rounded-lg border px-4 py-2 text-sm">
            {t}
          </span>
        ))}
      </Marquee>
      <Marquee vertical reverse duration={20}>
        {tags.map((t) => (
          <span key={t} className="rounded-lg border px-4 py-2 text-sm">
            {t}
          </span>
        ))}
      </Marquee>
    </div>
  )
}
