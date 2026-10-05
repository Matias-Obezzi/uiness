import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { type TreeNode, TreeView } from './tree-view'

const data: TreeNode[] = [
  {
    id: 'src',
    label: 'src',
    children: [
      {
        id: 'components',
        label: 'components',
        children: [
          { id: 'button', label: 'button.tsx' },
          { id: 'card', label: 'card.tsx' },
        ],
      },
      { id: 'index', label: 'index.ts' },
    ],
  },
  { id: 'public', label: 'public', children: [{ id: 'logo', label: 'logo.svg' }] },
  { id: 'readme', label: 'README.md' },
]

const item = (name: string) => screen.getByRole('treeitem', { name: new RegExp(`^${name}`) })
const focused = () => (document.activeElement as HTMLElement).dataset.id

describe('TreeView', () => {
  it('exposes the tree structure to assistive tech', () => {
    render(<TreeView aria-label="Files" data={data} defaultExpanded={['src']} />)
    expect(screen.getByRole('tree', { name: 'Files' })).toBeTruthy()
    const src = item('src')
    expect(src.getAttribute('aria-expanded')).toBe('true')
    expect(src.getAttribute('aria-level')).toBe('1')
    expect(src.getAttribute('aria-setsize')).toBe('3')
    const index = item('index.ts')
    expect(index.getAttribute('aria-level')).toBe('2')
    expect(index.getAttribute('aria-posinset')).toBe('2')
    expect(index.hasAttribute('aria-expanded')).toBe(false)
    expect(item('public').getAttribute('aria-expanded')).toBe('false')
  })

  // The tree pattern: one tab stop, arrows move through what is visible, right opens and goes
  // in, left closes and goes out.
  it('moves, opens and closes with the arrow keys', async () => {
    const user = userEvent.setup()
    render(<TreeView aria-label="Files" data={data} />)
    await user.tab()
    expect(focused()).toBe('src')

    await user.keyboard('{ArrowRight}')
    expect(item('src').getAttribute('aria-expanded')).toBe('true')
    expect(focused()).toBe('src')
    await user.keyboard('{ArrowRight}')
    expect(focused()).toBe('components')
    await user.keyboard('{ArrowDown}')
    expect(focused()).toBe('index')
    await user.keyboard('{ArrowLeft}')
    expect(focused()).toBe('src')
    await user.keyboard('{ArrowLeft}')
    expect(item('src').getAttribute('aria-expanded')).toBe('false')
    await user.keyboard('{End}')
    expect(focused()).toBe('readme')
    await user.keyboard('{Home}')
    expect(focused()).toBe('src')
  })

  it('jumps by typing and opens every sibling folder with *', async () => {
    const user = userEvent.setup()
    render(<TreeView aria-label="Files" data={data} />)
    await user.tab()
    await user.keyboard('r')
    expect(focused()).toBe('readme')
    await user.keyboard('{Home}*')
    expect(item('src').getAttribute('aria-expanded')).toBe('true')
    expect(item('public').getAttribute('aria-expanded')).toBe('true')
  })

  it('selects one node, or several with multiple', async () => {
    const user = userEvent.setup()
    const onSelectedChange = vi.fn()
    const { unmount } = render(
      <TreeView aria-label="Files" data={data} onSelectedChange={onSelectedChange} />,
    )
    await user.click(screen.getByText('README.md'))
    expect(onSelectedChange).toHaveBeenLastCalledWith(['readme'])
    expect(item('README.md').getAttribute('aria-selected')).toBe('true')
    unmount()

    render(
      <TreeView
        aria-label="Files"
        data={data}
        selectionMode="multiple"
        onSelectedChange={onSelectedChange}
      />,
    )
    expect(screen.getByRole('tree').getAttribute('aria-multiselectable')).toBe('true')
    await user.tab()
    await user.keyboard(' ')
    await user.keyboard('{Shift>}{ArrowDown}{ArrowDown}{/Shift}')
    expect(onSelectedChange).toHaveBeenLastCalledWith(['src', 'public', 'readme'])
  })

  it('checks folders through their contents, with a mixed state', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    render(
      <TreeView
        aria-label="Files"
        data={data}
        checkboxes
        defaultExpanded={['src', 'components']}
        onCheckedChange={onCheckedChange}
      />,
    )
    await user.click(screen.getByText('button.tsx'))
    expect(item('button.tsx').getAttribute('aria-checked')).toBe('true')
    expect(item('components').getAttribute('aria-checked')).toBe('mixed')
    expect(item('src').getAttribute('aria-checked')).toBe('mixed')

    item('components').focus()
    await user.keyboard(' ')
    expect(item('components').getAttribute('aria-checked')).toBe('true')
    expect(item('card.tsx').getAttribute('aria-checked')).toBe('true')
    expect(onCheckedChange).toHaveBeenLastCalledWith(['button', 'card', 'components'])

    item('src').focus()
    await user.keyboard(' ')
    expect(item('src').getAttribute('aria-checked')).toBe('true')
    await user.keyboard(' ')
    expect(item('button.tsx').getAttribute('aria-checked')).toBe('false')
  })

  it('loads children the first time a folder opens', async () => {
    const user = userEvent.setup()
    let resolve: (nodes: TreeNode[]) => void = () => {}
    const loadChildren = vi.fn(
      () =>
        new Promise<TreeNode[]>((r) => {
          resolve = r
        }),
    )
    render(
      <TreeView
        aria-label="Remote"
        data={[{ id: 'remote', label: 'remote', hasChildren: true }]}
        loadChildren={loadChildren}
      />,
    )
    await user.click(screen.getByText('remote'))
    expect(loadChildren).toHaveBeenCalledTimes(1)
    expect(item('remote').getAttribute('aria-busy')).toBe('true')

    await act(async () => resolve([{ id: 'a', label: 'a.txt' }]))
    expect(item('remote').hasAttribute('aria-busy')).toBe(false)
    expect(item('a.txt').getAttribute('aria-level')).toBe('2')

    await user.click(screen.getByText('remote'))
    await user.click(screen.getByText('remote'))
    expect(loadChildren).toHaveBeenCalledTimes(1)
  })
})
