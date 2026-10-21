import { describe, expect, it } from 'vitest'
import { headingIds } from '../scripts/heading-ids'

const heading = (depth: number, value: string) => ({
  type: 'heading',
  depth,
  children: [{ type: 'text', value }],
})

describe('headingIds', () => {
  it('numbers a repeated heading, so ids and table of contents keys stay unique', () => {
    const tree = {
      type: 'root',
      children: [
        heading(2, 'Price'),
        heading(2, 'Props'),
        heading(3, 'Price'),
        heading(3, 'Price'),
      ],
    }
    headingIds()(tree)
    expect(
      tree.children.map(
        (h) => (h as { data?: { hProperties?: { id?: string } } }).data?.hProperties?.id,
      ),
    ).toEqual(['price', 'props', 'price-1', 'price-2'])
  })
})
