import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FormControl, FormField, FormLabel } from './form'
import { MultiSelect } from './multi-select'

const options = [
  { value: 'react', label: 'React', group: 'Libraries' },
  { value: 'vue', label: 'Vue', group: 'Libraries' },
  { value: 'svelte', label: 'Svelte', group: 'Libraries' },
  { value: 'next', label: 'Next.js', group: 'Frameworks' },
  { value: 'nuxt', label: 'Nuxt', group: 'Frameworks', disabled: true },
]

const trigger = () => screen.getByRole('combobox', { name: 'Stack' })
const tagLabels = () =>
  Array.from(document.querySelectorAll('[data-slot=multi-select-tag]')).map((t) => t.textContent)

describe('MultiSelect', () => {
  it('picks several options and keeps the list open', async () => {
    const onValueChange = vi.fn()
    render(<MultiSelect aria-label="Stack" options={options} onValueChange={onValueChange} />)
    await userEvent.click(trigger())
    await userEvent.click(await screen.findByRole('option', { name: /Vue/ }))
    await userEvent.click(screen.getByRole('option', { name: /React/ }))
    // Kept in the order of the options, not the clicks.
    expect(onValueChange).toHaveBeenLastCalledWith(['react', 'vue'])
    expect(screen.getByRole('option', { name: /React/ }).getAttribute('aria-checked')).toBe('true')
    expect(screen.getByRole('listbox').getAttribute('aria-multiselectable')).toBe('true')
    expect(tagLabels()).toEqual(['React', 'Vue'])
  })

  it('folds the extra tags into a count', () => {
    render(
      <MultiSelect
        aria-label="Stack"
        options={options}
        defaultValue={['react', 'vue', 'svelte', 'next']}
        maxShown={2}
      />,
    )
    expect(tagLabels()).toEqual(['React', 'Vue'])
    expect(screen.getByText('+2')).toBeTruthy()
    // The full list is still read out with the trigger.
    const summary = document.getElementById(
      trigger().getAttribute('aria-describedby')?.split(' ')[0] ?? '',
    )
    expect(summary?.textContent).toBe('4 selected: React, Vue, Svelte, Next.js')
  })

  it('selects everything that is enabled, then clears it all', async () => {
    const onValueChange = vi.fn()
    render(<MultiSelect aria-label="Stack" options={options} onValueChange={onValueChange} />)
    await userEvent.click(trigger())
    await userEvent.click(await screen.findByRole('option', { name: 'Select all' }))
    expect(onValueChange).toHaveBeenLastCalledWith(['react', 'vue', 'svelte', 'next'])
    await userEvent.click(screen.getByRole('option', { name: 'Clear selection' }))
    expect(onValueChange).toHaveBeenLastCalledWith([])
  })

  it('marks select all as mixed when only some are picked', async () => {
    render(<MultiSelect aria-label="Stack" options={options} defaultValue={['vue']} />)
    await userEvent.click(trigger())
    const all = await screen.findByRole('option', { name: 'Select all' })
    expect(all.getAttribute('aria-checked')).toBe('mixed')
  })

  it('filters by search and shows group headings', async () => {
    render(<MultiSelect aria-label="Stack" options={options} />)
    await userEvent.click(trigger())
    expect(await screen.findByText('Frameworks')).toBeTruthy()
    await userEvent.keyboard('sve')
    const visible = screen.getAllByRole('option').map((o) => o.textContent)
    expect(visible).toContain('Svelte')
    expect(visible).not.toContain('Next.js')
    await userEvent.keyboard('{Enter}')
    expect(tagLabels()).toEqual(['Svelte'])
  })

  it('removes a tag from its own button without opening the list', async () => {
    render(<MultiSelect aria-label="Stack" options={options} defaultValue={['react', 'vue']} />)
    await userEvent.click(screen.getByRole('button', { name: 'Remove React' }))
    expect(tagLabels()).toEqual(['Vue'])
    expect(trigger().getAttribute('aria-expanded')).toBe('false')
  })

  it('removes the last pick with Backspace on the trigger', async () => {
    render(<MultiSelect aria-label="Stack" options={options} defaultValue={['react', 'vue']} />)
    trigger().focus()
    await userEvent.keyboard('{Backspace}')
    expect(tagLabels()).toEqual(['React'])
  })

  it('posts every value with a form and takes a form label', () => {
    render(
      <form>
        <FormField name="stack">
          <FormLabel>Your stack</FormLabel>
          <FormControl>
            <MultiSelect options={options} name="stack" defaultValue={['react', 'next']} />
          </FormControl>
        </FormField>
      </form>,
    )
    const form = document.querySelector('form') as HTMLFormElement
    expect(new FormData(form).getAll('stack')).toEqual(['react', 'next'])
    expect(screen.getByRole('combobox', { name: 'Your stack' })).toBeTruthy()
  })
})
