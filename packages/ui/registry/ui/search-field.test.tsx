import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FormControl, FormField, FormLabel } from './form'
import { SearchField } from './search-field'

const box = () => screen.getByRole('searchbox') as HTMLInputElement

describe('SearchField', () => {
  it('clears with the button and hands focus back to the field', async () => {
    const onClear = vi.fn()
    render(<SearchField aria-label="Search docs" defaultValue="button" onClear={onClear} />)
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(box().value).toBe('')
    expect(document.activeElement).toBe(box())
    expect(onClear).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull()
  })

  it('clears with Escape and searches with Enter', async () => {
    const onSearch = vi.fn()
    render(<SearchField aria-label="Search" onSearch={onSearch} />)
    await userEvent.type(box(), 'dialog{Enter}')
    expect(onSearch).toHaveBeenCalledWith('dialog')
    await userEvent.keyboard('{Escape}')
    expect(box().value).toBe('')
  })

  it('focuses from anywhere with "/" but not while typing elsewhere', async () => {
    render(
      <>
        <input aria-label="Other" />
        <SearchField aria-label="Search" shortcut="/" />
      </>,
    )
    expect(box().getAttribute('aria-keyshortcuts')).toBe('/')
    expect(screen.getByText('/')).toBeTruthy()

    await userEvent.click(screen.getByLabelText('Other'))
    await userEvent.keyboard('/')
    expect(document.activeElement).toBe(screen.getByLabelText('Other'))

    ;(document.activeElement as HTMLElement).blur()
    fireEvent.keyDown(document.body, { key: '/' })
    expect(document.activeElement).toBe(box())
  })

  it('focuses with mod+K even from another input', () => {
    render(
      <>
        <input aria-label="Other" />
        <SearchField aria-label="Search" shortcut="mod+k" />
      </>,
    )
    screen.getByLabelText('Other').focus()
    fireEvent.keyDown(screen.getByLabelText('Other'), { key: 'k', ctrlKey: true })
    expect(document.activeElement).toBe(box())
  })

  it('shows a spinner and marks itself busy while loading', () => {
    render(<SearchField aria-label="Search" loading />)
    expect(box().getAttribute('aria-busy')).toBe('true')
    expect(document.querySelector('[data-slot=spinner]')).toBeTruthy()
  })

  it('grows out of an icon button and folds back when left empty', async () => {
    render(
      <>
        <SearchField expanding placeholder="Search…" />
        <button type="button">Elsewhere</button>
      </>,
    )
    const root = document.querySelector('[data-slot=search-field]') as HTMLElement
    const trigger = screen.getByRole('button', { name: 'Search' })
    expect(root.hasAttribute('data-expanded')).toBe(false)
    expect(trigger.getAttribute('aria-expanded')).toBe('false')

    await userEvent.click(trigger)
    expect(root.hasAttribute('data-expanded')).toBe(true)
    expect(document.activeElement).toBe(box())

    await userEvent.click(screen.getByText('Elsewhere'))
    expect(root.hasAttribute('data-expanded')).toBe(false)
  })

  it('stays open while it holds text, and Escape on an empty one folds it', async () => {
    render(<SearchField expanding placeholder="Search…" />)
    await userEvent.click(screen.getByRole('button', { name: 'Search' }))
    await userEvent.type(box(), 'x')
    await userEvent.tab()
    const root = document.querySelector('[data-slot=search-field]') as HTMLElement
    expect(root.hasAttribute('data-expanded')).toBe(true)

    box().focus()
    await userEvent.keyboard('{Escape}{Escape}')
    expect(root.hasAttribute('data-expanded')).toBe(false)
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Search' }))
  })

  it('takes its label from a form field', () => {
    render(
      <FormField name="q">
        <FormLabel>Find</FormLabel>
        <FormControl>
          <SearchField />
        </FormControl>
      </FormField>,
    )
    expect(screen.getByLabelText('Find')).toBe(box())
  })
})
