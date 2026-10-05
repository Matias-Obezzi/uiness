import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { JsonViewer } from './json-viewer'

const data = {
  name: 'uiness',
  version: 2,
  private: true,
  license: null,
  'first release': '2026-09-30',
  team: [
    { name: 'Ada', role: 'design' },
    { name: 'Grace', role: 'engineering' },
  ],
}

const items = () => screen.getAllByRole('treeitem')
const labels = () => items().map((i) => i.getAttribute('aria-label'))
const item = (name: string) => screen.getByRole('treeitem', { name })

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('JsonViewer', () => {
  it('opens the root and shows typed values with their keys', () => {
    render(<JsonViewer data={data} />)
    expect(screen.getByRole('tree')).toBeTruthy()
    expect(labels()).toEqual([
      'root, object, 6 keys',
      'name: "uiness"',
      'version: 2',
      'private: true',
      'license: null',
      'first release: "2026-09-30"',
      'team, array, 2 items',
    ])
    expect(item('root, object, 6 keys').getAttribute('aria-expanded')).toBe('true')
    expect(item('team, array, 2 items').getAttribute('aria-expanded')).toBe('false')
    expect(item('version: 2').dataset.type).toBe('number')
  })

  it('follows the tree keys: down, right to open and enter, left to the parent', () => {
    render(<JsonViewer data={data} />)
    const root = items()[0] as HTMLElement
    expect(root.tabIndex).toBe(0)
    act(() => root.focus())
    fireEvent.keyDown(root, { key: 'End' })
    const team = item('team, array, 2 items')
    expect(document.activeElement).toBe(team)
    fireEvent.keyDown(team, { key: 'ArrowRight' })
    expect(team.getAttribute('aria-expanded')).toBe('true')
    fireEvent.keyDown(team, { key: 'ArrowRight' })
    expect(document.activeElement?.getAttribute('aria-label')).toBe('0, object, 2 keys')
    expect(document.activeElement?.getAttribute('aria-level')).toBe('3')
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(team)
    fireEvent.keyDown(team, { key: 'ArrowLeft' })
    expect(team.getAttribute('aria-expanded')).toBe('false')
  })

  it('opens the branches that hold a match and marks it', async () => {
    render(<JsonViewer data={data} />)
    await userEvent.type(screen.getByRole('searchbox'), 'grace')
    expect(item('name: "Grace"').dataset.match).toBe('true')
    expect(item('name: "Grace"').querySelector('mark')?.textContent).toBe('Grace')
    expect(screen.getByRole('status').textContent).toBe('0 of 1')
    await userEvent.keyboard('{Enter}')
    expect(document.activeElement).toBe(item('name: "Grace"'))
    expect(screen.getByRole('status').textContent).toBe('1 of 1')
  })

  it('loads long arrays a page at a time', async () => {
    render(
      <JsonViewer
        data={{ list: Array.from({ length: 25 }, (_, i) => i) }}
        pageSize={10}
        defaultExpandDepth={2}
      />,
    )
    expect(items()).toHaveLength(2 + 10 + 1)
    await userEvent.click(screen.getByText(/Show 10 more/))
    expect(items()).toHaveLength(2 + 20 + 1)
    await userEvent.click(screen.getByText(/Show 5 more/))
    expect(items()).toHaveLength(2 + 25)
  })

  it('copies a value as JSON and a path with keys that are not identifiers', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })
    const onCopy = vi.fn()
    render(<JsonViewer data={data} onCopy={onCopy} />)
    await userEvent.click(screen.getByRole('button', { name: 'Copy path root["first release"]' }))
    expect(writeText).toHaveBeenLastCalledWith('root["first release"]')
    const team = item('team, array, 2 items')
    act(() => team.focus())
    fireEvent.keyDown(team, { key: 'c' })
    await vi.waitFor(() =>
      expect(onCopy).toHaveBeenLastCalledWith({
        kind: 'value',
        path: 'root.team',
        text: JSON.stringify(data.team, null, 2),
      }),
    )
  })
})
