import { crt, Fx, palette, palettes, pixelate } from '@uiness/fx'
import { ArrowRightIcon, DownloadIcon, TrendingUpIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Choreo } from '@/components/ui/choreo'
import { findPage, pageHref } from '~/lib/nav'
import { site } from '~/lib/site'
import { mostInstalled, useUsage } from '~/lib/usage'
import { CodeBlock } from './code-block'
import { Logo } from './logo'

const features = [
  {
    title: 'Image',
    pkg: 'image',
    href: '/docs/image',
    description:
      'Blur, pixel and reveal transitions while an image loads, with real download progress if you want it.',
  },
  {
    title: 'Island',
    pkg: 'island',
    href: '/docs/island',
    description:
      'A Dynamic Island for the web. Statuses, live activities, alerts and confirms that morph with a spring.',
  },
  {
    title: 'Fx',
    pkg: 'fx',
    href: '/docs/fx',
    description:
      'Canvas effects you compose like functions: pixelate, dither to a Game Boy palette, glitch, CRT, ASCII.',
  },
  {
    title: 'Toast',
    pkg: 'toast',
    href: '/docs/toast',
    description:
      'Notifications that stack with the newest in front, expand on hover, swipe away and follow your promises.',
  },
  {
    title: 'Scroll',
    pkg: 'scroll',
    href: '/docs/scroll',
    description:
      'Progress of any element through the viewport, parallax that writes straight to the DOM, and the section being read.',
  },
  {
    title: 'Drag and drop',
    pkg: 'dnd',
    href: '/docs/dnd',
    description:
      'Sortable lists, boards, grids and free dragging. Headless hooks, and every drag also works from the keyboard.',
  },
  {
    title: 'Choreo',
    pkg: 'choreo',
    href: '/docs/choreo',
    description:
      'Animates a whole site from what is already on the page. It reads the DOM and gives every element an entrance.',
  },
  {
    title: 'Motion',
    href: '/docs/motion/spotlight',
    description:
      'Spotlights, auroras, marquees, typewriters, tilting cards and more, on CSS and the Web Animations API, no animation library.',
  },
  {
    title: 'Blocks',
    href: '/docs/blocks/hero',
    description:
      'Whole page sections, heroes, pricing, testimonials, footers, made from the components and ready to edit.',
  },
  {
    title: 'Components',
    href: '/docs/components/button',
    description:
      'A registry of accessible components on Radix and Tailwind. The code lands in your project, you own it.',
  },
]

interface Downloads {
  total: number
  packages: Record<string, number>
}

const count = (n: number) => n.toLocaleString('en')

export function Home() {
  // Last week on npm, from a CDN-cached function. Absent locally and on failure: nothing shows.
  const [downloads, setDownloads] = useState<Downloads | null>(null)
  useEffect(() => {
    document.title = site.name
    fetch('/api/downloads')
      .then((res) => (res.ok ? res.json() : null))
      .then(setDownloads)
      .catch(() => {})
  }, [])
  return (
    <Choreo className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
      <section className="grid items-center gap-10 lg:grid-cols-2">
        <div className="space-y-6">
          <Logo className="size-14 text-foreground" />
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
          <p className="h-5 text-muted-foreground text-sm tabular-nums">
            {downloads &&
              downloads.total > 0 &&
              `${count(downloads.total)} npm downloads last week`}
          </p>
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

      <section className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              <CardContent className="text-muted-foreground text-xs tabular-nums">
                {f.pkg &&
                  downloads?.packages[f.pkg] !== undefined &&
                  `${count(downloads.packages[f.pkg] as number)} downloads last week`}
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <Popular />
    </Choreo>
  )
}

/**
 * What people use: the pages installed most this month and the ones whose views grew most this
 * week, from the site's own counts. Each list shows only once there is something in it.
 */
function Popular() {
  const usage = useUsage()
  const installed = mostInstalled(usage, 5)
  const trending = (usage?.trending ?? [])
    .map(({ path, week, before }) => ({
      page: findPage(path.replace(/^\/docs\/?/, '')),
      growth: week - before,
    }))
    .filter((t): t is { page: NonNullable<typeof t.page>; growth: number } => Boolean(t.page))
  if (installed.length === 0 && trending.length === 0) return null
  return (
    <section className="mt-16 grid gap-6 sm:grid-cols-2">
      {installed.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <DownloadIcon aria-hidden className="size-4 text-muted-foreground" />
            Most installed this month
          </h2>
          <ol className="divide-y overflow-hidden rounded-xl border">
            {installed.map(({ page, installs }) => (
              <li key={page.slug}>
                <Link
                  to={pageHref(page)}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-accent/40"
                >
                  <span className="truncate">{page.title}</span>
                  <span className="shrink-0 text-muted-foreground tabular-nums">
                    {installs.toLocaleString('en')}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      )}
      {trending.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <TrendingUpIcon aria-hidden className="size-4 text-muted-foreground" />
            Trending this week
          </h2>
          <ol className="divide-y overflow-hidden rounded-xl border">
            {trending.map(({ page, growth }) => (
              <li key={page.slug}>
                <Link
                  to={pageHref(page)}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-accent/40"
                >
                  <span className="truncate">{page.title}</span>
                  <span className="shrink-0 text-muted-foreground tabular-nums">
                    +{growth.toLocaleString('en')} views
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  )
}
