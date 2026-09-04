import { crt, Fx, palette, palettes, pixelate } from '@uiness/fx'
import { ArrowRightIcon } from 'lucide-react'
import { useEffect } from 'react'
import { Link } from 'react-router'
import { Button } from '@/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { site } from '~/lib/site'
import { CodeBlock } from './code-block'

const features = [
  {
    title: 'Image',
    href: '/docs/image',
    description:
      'Blur, pixel and reveal transitions while an image loads, with real download progress if you want it.',
  },
  {
    title: 'Island',
    href: '/docs/island',
    description:
      'A Dynamic Island for the web. Statuses, live activities, alerts and confirms that morph with a spring.',
  },
  {
    title: 'Fx',
    href: '/docs/fx',
    description:
      'Canvas effects you compose like functions: pixelate, dither to a Game Boy palette, glitch, CRT, ASCII.',
  },
  {
    title: 'Components',
    href: '/docs/components/button',
    description:
      'A registry of accessible components on Radix and Tailwind. The code lands in your project, you own it.',
  },
]

export function Home() {
  useEffect(() => {
    document.title = site.name
  }, [])
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
      <section className="grid items-center gap-10 lg:grid-cols-2">
        <div className="space-y-6">
          <h1 className="font-bold text-4xl tracking-tight sm:text-5xl">
            React UI primitives with a bit of magic.
          </h1>
          <p className="text-lg text-muted-foreground">
            Images that load beautifully, a Dynamic Island for the web, canvas effects, and a
            component registry that plays well with the tools you already use. Open source, zero
            runtime dependencies.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/docs/installation">
                Get started <ArrowRightIcon />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/docs/components/button">Browse components</Link>
            </Button>
          </div>
          <CodeBlock
            code={`npx shadcn@latest add ${site.registryNamespace}/island`}
            lang="bash"
            className="max-w-md"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Fx
            src="/img/photo.png"
            alt=""
            effects={[pixelate(6), palette(palettes.gameboy)]}
            resolution={160}
            className="rounded-lg"
          />
          <Fx src="/img/photo.png" alt="" effects={crt()} className="rounded-lg" />
          <Fx
            src="/img/photo.png"
            alt=""
            effects={[palette(palettes.pico8)]}
            resolution={200}
            className="rounded-lg"
          />
          <Fx src="/img/photo.png" alt="" effects={[pixelate(14)]} className="rounded-lg" />
        </div>
      </section>

      <section className="mt-20 grid gap-4 sm:grid-cols-2">
        {features.map((f) => (
          <Link key={f.title} to={f.href} className="group">
            <Card className="h-full transition-colors group-hover:bg-accent/40">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {f.title}
                  <ArrowRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </CardTitle>
                <CardDescription>{f.description}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          </Link>
        ))}
      </section>
    </div>
  )
}
