import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CodeBlock, parseLineRanges } from './code-block'

const code = ['const a = 1', 'const b = 2', '', 'export { a, b }'].join('\n')
const lines = () => [...document.querySelectorAll<HTMLElement>('[data-line]')]

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('parseLineRanges', () => {
  it('reads single lines, ranges and arrays', () => {
    expect([...parseLineRanges('3-5,8')]).toEqual([3, 4, 5, 8])
    expect([...parseLineRanges(' 2 , 6-4 ')]).toEqual([2, 4, 5, 6])
    expect([...parseLineRanges([1, 9])]).toEqual([1, 9])
    expect(parseLineRanges('x').size).toBe(0)
  })
})

describe('CodeBlock', () => {
  it('numbers the lines and marks the highlighted ones', () => {
    render(<CodeBlock code={code} highlight="11,13" startLine={10} filename="a.ts" language="ts" />)
    expect(lines().map((l) => l.dataset.line)).toEqual(['10', '11', '12', '13'])
    expect(lines().map((l) => l.dataset.highlighted === 'true')).toEqual([false, true, false, true])
    expect(screen.getByRole('region', { name: 'a.ts' })).toBeTruthy()
    expect(screen.getByText('ts')).toBeTruthy()
  })

  it('marks ranges', () => {
    render(<CodeBlock code={code} highlight="2-3" />)
    expect(lines().map((l) => l.dataset.highlighted === 'true')).toEqual([false, true, true, false])
  })

  it('splits highlighted HTML into its lines, dropping the pre and code around it', () => {
    const html =
      '<pre class="shiki"><code><span class="line"><span style="color:red">const</span> a</span>\n<span class="line">b</span></code></pre>'
    render(<CodeBlock code={'const a\nb'} html={html} />)
    expect(lines()[0]?.querySelector('[style*=color]')?.textContent).toBe('const')
    expect(lines()[1]?.textContent).toBe('2b')
  })

  it('switches wrapping and copies the source', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })
    render(<CodeBlock code={code} />)
    const wrap = screen.getByRole('button', { name: 'Wrap lines' })
    expect(wrap.getAttribute('aria-pressed')).toBe('false')
    await userEvent.click(wrap)
    expect(wrap.getAttribute('aria-pressed')).toBe('true')
    expect(document.querySelector('[data-line] span:last-child')?.className).toContain(
      'whitespace-pre-wrap',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Copy code' }))
    expect(writeText).toHaveBeenCalledWith(code)
    expect(screen.getByRole('button', { name: 'Copied' })).toBeTruthy()
  })

  it('collapses long code behind a button', async () => {
    const long = Array.from({ length: 40 }, (_, i) => `line ${i + 1}`).join('\n')
    render(<CodeBlock code={long} maxLines={10} />)
    const more = screen.getByRole('button', { name: 'Show all 40 lines' })
    expect(more.getAttribute('aria-expanded')).toBe('false')
    await userEvent.click(more)
    expect(screen.getByRole('button', { name: 'Show less' }).getAttribute('aria-expanded')).toBe(
      'true',
    )
  })

  it('leaves out the line numbers and controls when asked', () => {
    render(<CodeBlock code={code} lineNumbers={false} wrapToggle={false} copyable={false} />)
    expect(lines()[0]?.textContent).toBe('const a = 1')
    expect(screen.queryByRole('button')).toBeNull()
  })
})
