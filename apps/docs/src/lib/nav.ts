export interface NavPage {
  /** Route slug after /docs/. Empty for the introduction. */
  slug: string
  title: string
  description: string
  /** Path of the MDX file under src/content. */
  file: string
  /** The day it shipped, ISO. Pages are tagged new for a while after it. */
  added?: string
}

export interface NavSection {
  title: string
  pages: NavPage[]
  /** Keep the pages in the order written, for sections meant to be read top to bottom. */
  ordered?: boolean
}

const page = (slug: string, title: string, description: string, file = slug): NavPage => ({
  slug,
  title,
  description,
  file: `${file}.mdx`,
})

const sections: NavSection[] = [
  {
    title: 'Getting started',
    ordered: true,
    pages: [
      page(
        '',
        'Introduction',
        'What uiness is, what it is not, and how the pieces fit.',
        'introduction',
      ),
      page(
        'installation',
        'Installation',
        'Add the registry to your project and install your first component.',
      ),
      page('theming', 'Theming', 'CSS variables, dark mode and how to make it yours.'),
    ],
  },
  {
    title: 'Packages',
    pages: [
      page('image', 'Image', 'An <img> that loads with blur, pixels, reveals and real progress.'),
      page(
        'island',
        'Island',
        'A Dynamic Island for the web: statuses, live activities, alerts and confirms.',
      ),
      page('fx', 'Fx', 'Canvas image effects: pixelate, dither, palettes, glitch, CRT and more.'),
      page('toast', 'Toast', 'Notifications that stack, expand on hover and follow your promises.'),
      page(
        'scroll',
        'Scroll',
        'Scroll progress, parallax and the active section, for any element.',
      ),
      page(
        'dnd',
        'Dnd',
        'Headless drag and drop: sortable lists, boards, grids and free dragging, with the keyboard.',
      ),
      page(
        'choreo',
        'Choreo',
        'Animates a whole site from what is already on the page, no markup changes.',
      ),
    ],
  },
  {
    title: 'Components',
    pages: [
      page(
        'components/alert',
        'Alert',
        'An inline callout for information, success, warnings and errors.',
      ),
      page(
        'components/alert-dialog',
        'Alert Dialog',
        'Asks for a decision before going on, declared or awaited with confirm().',
      ),
      page('components/avatar', 'Avatar', 'A picture of a user with a fallback.'),
      page('components/badge', 'Badge', 'A small label for statuses and counts.'),
      page('components/bento-grid', 'Bento Grid', 'A grid of cards with spans and a hover lift.'),
      page('components/button', 'Button', 'Triggers an action, with variants and sizes.'),
      page('components/calendar', 'Calendar', 'Pick a day, several days or a range.'),
      page('components/card', 'Card', 'A surface with header, content and footer.'),
      page('components/checkbox', 'Checkbox', 'A control that can be checked or unchecked.'),
      page('components/combobox', 'Combobox', 'A searchable select, single or multiple.'),
      page(
        'components/context-menu',
        'Context Menu',
        'Right click menus declared once by name, picked per element with a hook.',
      ),
      page('components/date-picker', 'Date Picker', 'A button that opens a calendar.'),
      page(
        'components/command',
        'Command',
        'A command palette with fuzzy search, groups and a keyboard shortcut.',
      ),
      page('components/dialog', 'Dialog', 'A window over the page that asks for attention.'),
      page(
        'components/drawer',
        'Drawer',
        'A panel from any edge, dragged to close, with snap points.',
      ),
      page('components/dropdown-menu', 'Dropdown Menu', 'A menu of actions opened from a trigger.'),
      page('components/form', 'Form', 'Fields that wire label, description and error together.'),
      page(
        'components/carousel',
        'Carousel',
        'A horizontal run of items of any width and any content.',
      ),
      page('components/gallery', 'Gallery', 'An image grid with a full screen lightbox.'),
      page('components/input', 'Input', 'A text field.'),
      page('components/input-otp', 'Input OTP', 'A one time code field.'),
      page('components/label', 'Label', 'An accessible caption for a control.'),
      page(
        'components/navbar',
        'Navbar',
        'Site navigation that becomes a menu or a bottom bar on phones.',
      ),
      page('components/popover', 'Popover', 'Rich content anchored to a trigger.'),
      page('components/progress', 'Progress', 'How far along a task is.'),
      page('components/radio-group', 'Radio Group', 'Pick one of several options.'),
      page('components/scroll-area', 'Scroll Area', 'A scrollable region with themed bars.'),
      page('components/select', 'Select', 'Pick one option from a list.'),
      page('components/separator', 'Separator', 'A visual divider.'),
      page(
        'components/sidebar',
        'Sidebar',
        'A collapsible sidebar that becomes a drawer on phones.',
      ),
      page('components/skeleton', 'Skeleton', 'A placeholder while content loads.'),
      page('components/slider', 'Slider', 'Pick a number, or a range.'),
      page('components/spinner', 'Spinner', 'Shows that something is loading.'),
      page('components/switch', 'Switch', 'An on and off toggle.'),
      page('components/tabs', 'Tabs', 'Switch between views in the same space.'),
      page('components/textarea', 'Textarea', 'A multi line text field.'),
      page('components/toggle', 'Toggle', 'A button that stays pressed, alone or in a group.'),
      page('components/tooltip', 'Tooltip', 'A short hint on hover or focus.'),
    ],
  },
  {
    title: 'Blocks',
    pages: [
      page('blocks/hero', 'Hero', 'The first thing a page says: headline, lead and actions.'),
      page('blocks/features', 'Features', 'What the product does: feature grids and live bentos.'),
      page('blocks/logos', 'Logos', 'Customer wordmarks in an endless, fading row.'),
      page('blocks/stats', 'Stats', 'Big figures that count up, with labels and captions.'),
      page('blocks/navbar', 'Navbar', 'The bar across the top: wordmark, links and the way in.'),
      page('blocks/footer', 'Footer', 'Links, a newsletter signup and the small print.'),
      page('blocks/cta', 'Call to Action', 'A closing section that asks for the next step.'),
      page('blocks/auth', 'Auth', 'Sign in forms with providers and a side panel.'),
      page('blocks/pricing', 'Pricing', 'Plans side by side with a billing switch.'),
      page('blocks/testimonials', 'Testimonials', 'Quotes from customers, in moving rows.'),
      page('blocks/faq', 'FAQ', 'Questions and answers that open in place.'),
    ],
  },
  {
    title: 'Drag and drop',
    pages: [
      page('dnd/sortable', 'Sortable', 'A list you reorder by dragging, or with the keyboard.'),
      page('dnd/kanban', 'Kanban', 'Columns of cards, moved inside a column or across them.'),
      page(
        'dnd/reorderable-grid',
        'Reorderable Grid',
        'Tiles rearranged in two directions, the way app icons move.',
      ),
      page(
        'dnd/draggable',
        'Draggable',
        'Anything you can pick up and move, optionally kept inside its parent.',
      ),
      page(
        'dnd/dropzone',
        'Dropzone',
        'Files dropped in from the desktop, checked by type, size and count.',
      ),
    ],
  },
  {
    title: 'Motion',
    pages: [
      page(
        'motion/spotlight',
        'Spotlight',
        'A light that follows the pointer, and cards whose borders glow.',
      ),
      page('motion/aurora', 'Aurora', 'Drifting blurred color for a background.'),
      page('motion/meteors', 'Meteors', 'Streaks falling across a background.'),
      page('motion/pattern', 'Pattern', 'Grid or dot background that fades at the edges.'),
      page('motion/sparkles', 'Sparkles', 'Twinkling particles on a canvas.'),
      page(
        'motion/text-generate',
        'Text Generate',
        'Words that appear one after another from a blur.',
      ),
      page('motion/typewriter', 'Typewriter', 'Text typed one character at a time.'),
      page('motion/flip-words', 'Flip Words', 'One word from a list at a time.'),
      page('motion/shimmer', 'Shimmer', 'A highlight sweeping across text.'),
      page('motion/number-ticker', 'Number Ticker', 'A number that counts up into view.'),
      page('motion/reveal', 'Reveal', 'Content that transitions in when it scrolls into view.'),
      page('motion/tilt-card', 'Tilt Card', 'A card that tilts towards the pointer in 3D.'),
      page('motion/marquee', 'Marquee', 'Content that scrolls forever.'),
      page('motion/moving-border', 'Moving Border', 'A light running around a border.'),
      page('motion/animated-tooltip', 'Animated Tooltip', 'Avatars with a springy name card.'),
      page('motion/hover-highlight', 'Hover Highlight', 'A highlight that slides between items.'),
      page('motion/compare', 'Compare', 'Drag a divider between two layers.'),
      page('motion/tracing-beam', 'Tracing Beam', 'A line that lights up as you scroll.'),
      page('motion/parallax-grid', 'Parallax Grid', 'Columns that scroll at different speeds.'),
      page('motion/sticky-scroll', 'Sticky Scroll', 'A sticky panel that swaps as you read.'),
      page('motion/timeline', 'Timeline', 'Entries down a line that lights up as you scroll.'),
      page('motion/path-morph', 'Path Morph', 'Morphs between any SVG paths.'),
      page('motion/link-preview', 'Link Preview', 'A picture of the destination on hover.'),
      page('motion/gradient-text', 'Gradient Text', 'Text filled with a flowing gradient.'),
      page('motion/scramble-text', 'Scramble Text', 'Text that decodes itself from random glyphs.'),
      page('motion/odometer', 'Odometer', 'Digits that roll to their new value.'),
      page('motion/text-reveal', 'Text Reveal', 'Words that light up as you scroll.'),
      page('motion/confetti', 'Confetti', 'Bursts of confetti from a function or a button.'),
      page('motion/orbit', 'Orbit', 'Items circling a center.'),
      page('motion/sonar', 'Sonar', 'Rings pulsing out from a center.'),
      page('motion/retro-grid', 'Retro Grid', 'A perspective grid rolling towards you.'),
      page('motion/animated-list', 'Animated List', 'A feed that adds items one at a time.'),
      page('motion/card-stack', 'Card Stack', 'A pile of cards that goes round.'),
      page('motion/velocity-marquee', 'Velocity Marquee', 'Text rows that speed up as you scroll.'),
      page('motion/terminal', 'Terminal', 'A terminal that plays a session.'),
      page('motion/magnetic', 'Magnetic', 'Content that pulls towards a nearby pointer.'),
      page('motion/ripple', 'Ripple', 'An ink ripple from where you press.'),
      page('motion/dock', 'Dock', 'A dock that magnifies under the pointer.'),
      page('motion/flip-card', 'Flip Card', 'A card that turns over to show its back.'),
    ],
  },
]

/** Pages that shipped on the same day. Add a batch here when new pages land. */
const releases: Record<string, string[]> = {
  '2026-10-01': ['components/alert-dialog', 'components/spinner'],
  '2026-09-30': [
    'blocks/features',
    'blocks/logos',
    'blocks/stats',
    'blocks/navbar',
    'blocks/footer',
    'blocks/cta',
    'blocks/auth',
    'blocks/hero',
    'blocks/pricing',
    'blocks/testimonials',
    'blocks/faq',
    'choreo',
    'components/context-menu',
    'motion/gradient-text',
    'motion/scramble-text',
    'motion/odometer',
    'motion/text-reveal',
    'motion/confetti',
    'motion/orbit',
    'motion/sonar',
    'motion/retro-grid',
    'motion/animated-list',
    'motion/card-stack',
    'motion/velocity-marquee',
    'motion/terminal',
    'motion/magnetic',
    'motion/ripple',
    'motion/dock',
    'motion/flip-card',
  ],
}

const addedOn = new Map(
  Object.entries(releases).flatMap(([date, slugs]) => slugs.map((slug) => [slug, date] as const)),
)

/** Every section alphabetical, apart from the ones meant to be read in order. */
export const nav: NavSection[] = sections.map((section) => {
  const pages = section.pages.map((p) => ({ ...p, added: addedOn.get(p.slug) }))
  if (!section.ordered) pages.sort((a, b) => a.title.localeCompare(b.title))
  return { ...section, pages }
})

export const pages: NavPage[] = nav.flatMap((section) => section.pages)

/** How long a page is called new after it ships. */
const NEW_FOR_DAYS = 30

export const isNew = (p: NavPage, now = Date.now()) =>
  p.added !== undefined && now - Date.parse(p.added) < NEW_FOR_DAYS * 24 * 60 * 60 * 1000

export const findPage = (slug: string): NavPage | undefined =>
  pages.find((p) => p.slug === slug.replace(/\/$/, ''))

export const pageHref = (p: NavPage) => (p.slug ? `/docs/${p.slug}` : '/docs')
