import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { isLand, landPoints } from '@/lib/world-map'
import { Android } from './android'
import { CodeComparison, diffLines } from './code-comparison'
import { DottedMap } from './dotted-map'
import { Globe, projectPoint } from './globe'
import { IPad } from './ipad'
import { IPhone } from './iphone'
import { MacBook } from './macbook'
import { OgPreview } from './og-preview'
import { Safari } from './safari'
import { TweetCard, TweetCardSkeleton, tokenizeTweet } from './tweet-card'

describe('world-map data logic', () => {
  it('correctly classifies known land and water coordinates', () => {
    // Buenos Aires (Argentina) - land
    expect(isLand(-34.6, -58.4)).toBe(true)
    // Madrid (Spain) - land
    expect(isLand(40.4, -3.7)).toBe(true)
    // Middle of the Atlantic Ocean - water
    expect(isLand(0, -30)).toBe(false)
    // Middle of the Pacific Ocean - water
    expect(isLand(0, -140)).toBe(false)
  })

  it('generates land points within latitude constraints', () => {
    const points = landPoints(15, { minLat: -50, maxLat: 70 })
    expect(points.length).toBeGreaterThan(0)
    for (const [lat, lng] of points) {
      expect(lat).toBeGreaterThanOrEqual(-50)
      expect(lat).toBeLessThanOrEqual(70)
      expect(lng).toBeGreaterThanOrEqual(-180)
      expect(lng).toBeLessThanOrEqual(180)
      expect(isLand(lat, lng)).toBe(true)
    }
  })
})

describe('globe pure projection logic', () => {
  it('projects front-facing point to center and opposite point as hidden', () => {
    const center = projectPoint(0, 0, 0, 0, 100)
    expect(center.visible).toBe(true)
    expect(center.x).toBeCloseTo(0, 2)
    expect(center.y).toBeCloseTo(0, 2)
    expect(center.z).toBeCloseTo(1, 2)

    const back = projectPoint(0, 180, 0, 0, 100)
    expect(back.visible).toBe(false)
    expect(back.z).toBeCloseTo(-1, 2)
  })

  it('projects poles correctly with tilt', () => {
    const northPole = projectPoint(90, 0, 0, 0, 100)
    expect(northPole.x).toBeCloseTo(0, 2)
    expect(northPole.y).toBeCloseTo(-100, 2)
  })
})

describe('tweet-card tokenizer', () => {
  it('tokenizes plain text, mentions, hashtags, and URLs', () => {
    const text = 'Hello @uiness! Check #design at https://uiness.dev'
    const tokens = tokenizeTweet(text)

    expect(tokens).toEqual([
      { type: 'text', value: 'Hello ' },
      { type: 'mention', value: '@uiness', handle: 'uiness', href: 'https://x.com/uiness' },
      { type: 'text', value: '! Check ' },
      { type: 'hashtag', value: '#design', tag: 'design', href: 'https://x.com/hashtag/design' },
      { type: 'text', value: ' at ' },
      { type: 'url', value: 'https://uiness.dev', href: 'https://uiness.dev' },
    ])
  })

  it('handles text with no special entities', () => {
    const tokens = tokenizeTweet('Just a simple thought.')
    expect(tokens).toEqual([{ type: 'text', value: 'Just a simple thought.' }])
  })

  it('handles empty input gracefully', () => {
    expect(tokenizeTweet('')).toEqual([])
  })
})

describe('code-comparison diff logic', () => {
  it('identifies unchanged, added, and removed lines with LCS', () => {
    const before = 'const a = 1\nconst b = 2\nconst c = 3'
    const after = 'const a = 1\nconst b = 20\nconst c = 3\nconst d = 4'

    const diff = diffLines(before, after)

    expect(diff.find((d) => d.content === 'const a = 1')?.type).toBe('unchanged')
    expect(diff.find((d) => d.content === 'const b = 2')?.type).toBe('removed')
    expect(diff.find((d) => d.content === 'const b = 20')?.type).toBe('added')
    expect(diff.find((d) => d.content === 'const c = 3')?.type).toBe('unchanged')
    expect(diff.find((d) => d.content === 'const d = 4')?.type).toBe('added')
  })

  it('returns all unchanged for identical code', () => {
    const code = 'line 1\nline 2'
    const diff = diffLines(code, code)
    expect(diff.every((d) => d.type === 'unchanged')).toBe(true)
    expect(diff).toHaveLength(2)
  })
})

describe('Phase 4 component rendering and accessibility', () => {
  it('Globe renders canvas with role="img" and accessible label', () => {
    render(<Globe aria-label="World exploration" />)
    const el = screen.getByRole('img', { name: 'World exploration' })
    expect(el).toBeTruthy()
  })

  it('DottedMap renders svg with single path and role="img"', () => {
    render(<DottedMap aria-label="Global map" step={10} />)
    const el = screen.getByRole('img', { name: 'Global map' })
    expect(el).toBeTruthy()
    expect(el.querySelector('path')).toBeTruthy()
  })

  it('TweetCard renders author info, content, and metrics accessible names', () => {
    render(
      <TweetCard
        author={{ name: 'Jane Doe', handle: 'janedoe', avatar: '/avatar.jpg', verified: true }}
        text="Launching our new project @uiness today! #webdev"
        createdAt="2026-10-07T00:00:00Z"
        metrics={{ replies: 12, reposts: 34, likes: 56, views: 7890 }}
      />,
    )

    expect(screen.getByText('Jane Doe')).toBeTruthy()
    expect(screen.getByText('@janedoe')).toBeTruthy()
    expect(screen.getByRole('link', { name: '@uiness' })).toBeTruthy()
    expect(screen.getByRole('link', { name: '#webdev' })).toBeTruthy()
    expect(screen.getByText(/Reply/)).toBeTruthy()
    expect(screen.getByText(/Like/)).toBeTruthy()
  })

  it('TweetCardSkeleton renders pulse placeholder', () => {
    const { container } = render(<TweetCardSkeleton />)
    expect(container.querySelector('[data-slot="tweet-card-skeleton"]')).toBeTruthy()
  })

  it('OgPreview renders platform preview card with accessible link name', () => {
    render(
      <OgPreview
        url="https://example.com/blog/hello"
        title="Hello World Blog Post"
        description="A great article about web technologies."
        image="/og.jpg"
        variant="x"
      />,
    )

    const link = screen.getByRole('link', { name: 'Preview of Hello World Blog Post' })
    expect(link).toBeTruthy()
    expect(screen.getByText('Hello World Blog Post')).toBeTruthy()
    expect(screen.getByText('example.com')).toBeTruthy()
  })

  it('CodeComparison renders split and unified views with copy action', () => {
    const { rerender } = render(
      <CodeComparison
        before="const x = 1"
        after="const x = 2"
        beforeLabel="Old"
        afterLabel="New"
        mode="split"
      />,
    )

    expect(screen.getByText('Old')).toBeTruthy()
    expect(screen.getByText('New')).toBeTruthy()

    rerender(<CodeComparison before="const x = 1" after="const x = 2" mode="unified" />)

    expect(screen.getByText('Before')).toBeTruthy()
    expect(screen.getByText('After')).toBeTruthy()
  })

  it('Devices render mockups with images and alt attributes', () => {
    render(
      <div>
        <IPhone src="/iphone.jpg" alt="iPhone Preview" />
        <Android src="/android.jpg" alt="Android Preview" />
        <IPad src="/ipad.jpg" alt="iPad Preview" />
        <MacBook src="/macbook.jpg" alt="MacBook Preview" />
        <Safari src="/safari.jpg" alt="Safari Preview" url="uiness.dev" />
      </div>,
    )

    expect(screen.getByAltText('iPhone Preview')).toBeTruthy()
    expect(screen.getByAltText('Android Preview')).toBeTruthy()
    expect(screen.getByAltText('iPad Preview')).toBeTruthy()
    expect(screen.getByAltText('MacBook Preview')).toBeTruthy()
    expect(screen.getByAltText('Safari Preview')).toBeTruthy()
    expect(screen.getByText('uiness.dev')).toBeTruthy()
  })
})
