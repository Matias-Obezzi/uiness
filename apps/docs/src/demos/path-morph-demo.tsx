import { PathMorph } from '@/ui/path-morph'

const shapes = [
  // star
  'M50 5 L61 38 L97 38 L68 59 L79 92 L50 71 L21 92 L32 59 L3 38 L39 38 Z',
  // heart
  'M50 88 C20 65 5 50 5 32 C5 18 16 8 29 8 C38 8 46 13 50 20 C54 13 62 8 71 8 C84 8 95 18 95 32 C95 50 80 65 50 88 Z',
  // blob
  'M50 8 C70 8 92 22 92 45 C92 70 74 92 50 92 C28 92 8 76 8 52 C8 28 28 8 50 8 Z',
  // square
  'M15 15 L85 15 L85 85 L15 85 Z',
]

export default function PathMorphDemo() {
  return <PathMorph paths={shapes} className="size-40 text-primary" interval={1800} />
}
