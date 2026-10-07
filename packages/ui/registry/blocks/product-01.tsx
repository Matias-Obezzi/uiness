'use client'

import {
  type LucideIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  TruckIcon,
} from 'lucide-react'
import * as React from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ThreeViewer } from '@/components/ui/three-viewer'
import { cn } from '@/lib/utils'

export interface ProductColor {
  id: string
  name: string
  /** Any CSS color, for the swatch. */
  swatch: string
  /** A price for this color, when it differs. */
  price?: number
  /** False shows the color as sold out. Default true. */
  inStock?: boolean
}

export interface ProductPerk {
  icon: 'shipping' | 'returns' | 'warranty'
  label: string
}

export interface Product01Labels {
  color: string
  /** `{name}` is replaced. */
  soldOut: string
  addToCart: string
  added: string
}

export interface Product01Props extends Omit<React.ComponentProps<'section'>, 'title'> {
  /** A line above the name, like the collection. `null` hides it. */
  category?: React.ReactNode
  name?: string
  description?: React.ReactNode
  price?: number
  currency?: string
  locale?: string
  /** A small tag beside the price, like "New". `null` hides it. */
  badge?: string | null
  /** The 3D model: a `.glb` or `.gltf`, with a poster shown while it loads. */
  model?: { src: string; poster?: string; alt: string }
  colors?: ProductColor[]
  perks?: ProductPerk[]
  /** Sections under the buy button that open in place. */
  details?: { title: string; content: React.ReactNode }[]
  /** Called with the chosen color. Return a promise to keep the button busy until it settles. */
  onAddToCart?: (color: ProductColor) => unknown
  labels?: Partial<Product01Labels>
}

const defaultLabels: Product01Labels = {
  color: 'Color',
  soldOut: '{name}, sold out',
  addToCart: 'Add to cart',
  added: 'Added to cart',
}

const perkIcons: Record<ProductPerk['icon'], LucideIcon> = {
  shipping: TruckIcon,
  returns: RotateCcwIcon,
  warranty: ShieldCheckIcon,
}

const defaultColors: ProductColor[] = [
  { id: 'mango', name: 'Mango velvet', swatch: '#e8823a' },
  { id: 'peacock', name: 'Peacock velvet', swatch: '#1f5e6b', price: 1340 },
  { id: 'night', name: 'Night linen', swatch: '#2a2a33', inStock: false },
]

const defaultPerks: ProductPerk[] = [
  { icon: 'shipping', label: 'Free delivery in 5 to 7 days' },
  { icon: 'returns', label: '100 nights to decide' },
  { icon: 'warranty', label: 'Ten year frame warranty' },
]

const defaultDetails = [
  {
    title: 'Dimensions',
    content: '78 cm wide, 74 cm deep, 72 cm high. Seat height 41 cm.',
  },
  {
    title: 'Materials',
    content:
      'Solid oak legs, a beech frame, and a velvet or linen cover that zips off for washing.',
  },
  {
    title: 'Care',
    content: 'Vacuum the cover with a soft brush. Wash it cold, and let it dry flat.',
  },
]

/**
 * A product page you can turn around: the 3D model, with its toolbar, on one side; name,
 * price, colors, the buy button, perks and details that open in place on the other. A sold
 * out color stays visible but cannot be picked. The columns stack when the container is narrow.
 */
function Product01({
  category = 'Living room',
  name = 'Sheen lounge chair',
  description = 'A low, deep chair for long evenings, upholstered in a velvet that catches the light.',
  price = 1290,
  currency = 'USD',
  locale = 'en-US',
  badge = 'New',
  model = {
    src: '/models/chair.glb',
    poster: '/models/chair.webp',
    alt: 'The Sheen lounge chair in 3D',
  },
  colors = defaultColors,
  perks = defaultPerks,
  details = defaultDetails,
  onAddToCart,
  labels: labelsProp,
  className,
  ...props
}: Product01Props) {
  const labels = { ...defaultLabels, ...labelsProp }
  const id = React.useId()
  const firstAvailable = colors.find((c) => c.inStock !== false) ?? colors[0]
  const [colorId, setColorId] = React.useState(firstAvailable?.id)
  const [adding, setAdding] = React.useState(false)
  const [added, setAdded] = React.useState(false)
  const color = colors.find((c) => c.id === colorId)
  const shownPrice = color?.price ?? price
  const formatPrice = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  })

  const addToCart = async () => {
    if (!color) return
    setAdding(true)
    try {
      await onAddToCart?.(color)
      setAdded(true)
    } finally {
      setAdding(false)
    }
  }

  return (
    <section
      data-slot="block-product-01"
      aria-labelledby={`${id}-name`}
      className={cn('@container w-full', className)}
      {...props}
    >
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-10 @3xl:grid-cols-[1.2fr_1fr] @3xl:py-16">
        <ThreeViewer
          src={model.src}
          poster={model.poster}
          alt={model.alt}
          toolbarActions={['reset', 'views', 'zoomIn', 'zoomOut', 'fullscreen']}
          className="aspect-square w-full @3xl:sticky @3xl:top-6 @3xl:self-start"
        />

        <div className="flex flex-col">
          {category && <p className="text-eyebrow text-muted-foreground uppercase">{category}</p>}
          <h2 id={`${id}-name`} className="mt-2 text-balance text-title">
            {name}
          </h2>
          <div className="mt-3 flex items-center gap-3">
            <p className="font-semibold text-2xl tabular-nums">{formatPrice.format(shownPrice)}</p>
            {badge && <Badge variant="secondary">{badge}</Badge>}
          </div>
          {description && <p className="mt-4 text-pretty text-muted-foreground">{description}</p>}

          {colors.length > 0 && (
            <fieldset className="mt-8">
              <legend className="font-medium text-sm">
                {labels.color}
                {color && <span className="ml-2 text-muted-foreground">{color.name}</span>}
              </legend>
              <RadioGroup
                value={colorId}
                onValueChange={(value) => {
                  setColorId(value)
                  setAdded(false)
                }}
                className="mt-3 flex flex-wrap gap-3"
              >
                {colors.map((c) => {
                  const soldOut = c.inStock === false
                  return (
                    <RadioGroupItem
                      key={c.id}
                      value={c.id}
                      disabled={soldOut}
                      aria-label={soldOut ? labels.soldOut.replace('{name}', c.name) : c.name}
                      title={c.name}
                      style={{ background: c.swatch }}
                      className={cn(
                        'size-9 border-2 border-background ring-1 ring-border ring-offset-0 [&_[data-slot=radio-group-indicator]]:hidden',
                        'data-[state=checked]:ring-2 data-[state=checked]:ring-foreground',
                        // A sold out color keeps its swatch, crossed through.
                        soldOut &&
                          'relative opacity-50 after:absolute after:inset-0 after:m-auto after:h-0.5 after:w-full after:-rotate-45 after:bg-foreground',
                      )}
                    />
                  )
                })}
              </RadioGroup>
            </fieldset>
          )}

          <Button
            size="lg"
            className="mt-8"
            loading={adding}
            disabled={!color || color.inStock === false}
            onClick={addToCart}
          >
            <ShoppingBagIcon />
            {added ? labels.added : labels.addToCart}
          </Button>
          <p role="status" className="sr-only">
            {added ? labels.added : ''}
          </p>

          {perks.length > 0 && (
            <ul className="mt-6 grid gap-2 text-sm">
              {perks.map((perk) => {
                const Icon = perkIcons[perk.icon]
                return (
                  <li key={perk.label} className="flex items-center gap-2 text-muted-foreground">
                    <Icon className="size-4 text-foreground" />
                    {perk.label}
                  </li>
                )
              })}
            </ul>
          )}

          {details.length > 0 && (
            <Accordion type="single" collapsible className="mt-8 border-t">
              {details.map((detail) => (
                <AccordionItem key={detail.title} value={detail.title}>
                  <AccordionTrigger>{detail.title}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {detail.content}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </div>
    </section>
  )
}

export { Product01 }
