import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { getPageRange, PaginationLink, Paginator } from './pagination'

describe('getPageRange', () => {
  it('lists every page when they fit', () => {
    expect(getPageRange(1, 5)).toEqual([1, 2, 3, 4, 5])
    expect(getPageRange(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  // The list keeps one length wherever you are, so the buttons stay put under the pointer.
  it('folds the gaps into ellipses and keeps a constant length', () => {
    expect(getPageRange(1, 20)).toEqual([1, 2, 3, 4, 5, 'ellipsis-end', 20])
    expect(getPageRange(4, 20)).toEqual([1, 2, 3, 4, 5, 'ellipsis-end', 20])
    expect(getPageRange(5, 20)).toEqual([1, 'ellipsis-start', 4, 5, 6, 'ellipsis-end', 20])
    expect(getPageRange(17, 20)).toEqual([1, 'ellipsis-start', 16, 17, 18, 19, 20])
    expect(getPageRange(20, 20)).toEqual([1, 'ellipsis-start', 16, 17, 18, 19, 20])
  })

  it('takes siblings and boundaries', () => {
    expect(getPageRange(10, 20, 2, 2)).toEqual([
      1,
      2,
      'ellipsis-start',
      8,
      9,
      10,
      11,
      12,
      'ellipsis-end',
      19,
      20,
    ])
    expect(getPageRange(10, 20, 0)).toEqual([1, 'ellipsis-start', 10, 'ellipsis-end', 20])
  })
})

describe('Paginator', () => {
  function Controlled({ onChange }: { onChange?: (page: number) => void }) {
    const [page, setPage] = useState(1)
    return (
      <Paginator
        page={page}
        total={200}
        pageSize={10}
        compact={false}
        onPageChange={(p) => {
          setPage(p)
          onChange?.(p)
        }}
      />
    )
  }

  it('marks the current page and moves with the arrows', async () => {
    const onChange = vi.fn()
    render(<Controlled onChange={onChange} />)
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Page 1' }).getAttribute('aria-current')).toBe('page')
    expect(
      (screen.getByRole('button', { name: 'Go to previous page' }) as HTMLButtonElement).disabled,
    ).toBe(true)

    await userEvent.click(screen.getByRole('button', { name: 'Go to next page' }))
    expect(onChange).toHaveBeenLastCalledWith(2)
    expect(screen.getByRole('button', { name: 'Page 2' }).getAttribute('aria-current')).toBe('page')

    await userEvent.click(screen.getByRole('button', { name: 'Page 20' }))
    expect(onChange).toHaveBeenLastCalledWith(20)
    expect(
      (screen.getByRole('button', { name: 'Go to next page' }) as HTMLButtonElement).disabled,
    ).toBe(true)
  })

  it('renders real links with getPageHref', () => {
    render(<Paginator page={3} total={50} compact={false} getPageHref={(p) => `?page=${p}`} />)
    expect(screen.getByRole('link', { name: 'Page 4' }).getAttribute('href')).toBe('?page=4')
    expect(screen.getByRole('link', { name: 'Go to previous page' }).getAttribute('href')).toBe(
      '?page=2',
    )
  })

  it('says "Page x of y" in compact mode', () => {
    render(<Paginator page={3} total={95} compact />)
    expect(screen.getByText(/Page/).textContent).toBe('Page 3 of 10')
    expect(screen.queryByRole('button', { name: 'Page 3' })).toBeNull()
  })

  it('keeps the shadcn link API', () => {
    render(
      <PaginationLink href="#" isActive>
        4
      </PaginationLink>,
    )
    expect(screen.getByRole('link', { name: '4' }).getAttribute('aria-current')).toBe('page')
  })
})
