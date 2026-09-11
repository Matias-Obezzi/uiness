import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'

function Example() {
  return (
    <Tabs defaultValue="one">
      <TabsList>
        <TabsTrigger value="one">One</TabsTrigger>
        <TabsTrigger value="two">Two</TabsTrigger>
        <TabsTrigger value="three">Three</TabsTrigger>
      </TabsList>
      <TabsContent value="one">First panel</TabsContent>
      <TabsContent value="two">Second panel</TabsContent>
      <TabsContent value="three">Third panel</TabsContent>
    </Tabs>
  )
}

describe('Tabs', () => {
  it('shows the panel of the selected tab and only that one', async () => {
    render(<Example />)
    expect(screen.getByText('First panel')).toBeTruthy()
    expect(screen.queryByText('Second panel')).toBeNull()

    await userEvent.click(screen.getByRole('tab', { name: 'Two' }))
    expect(screen.getByText('Second panel')).toBeTruthy()
    expect(screen.queryByText('First panel')).toBeNull()
  })

  it('names the selection for assistive tech', async () => {
    render(<Example />)
    expect(screen.getByRole('tab', { name: 'One' }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByRole('tab', { name: 'Two' }).getAttribute('aria-selected')).toBe('false')

    await userEvent.click(screen.getByRole('tab', { name: 'Two' }))
    expect(screen.getByRole('tab', { name: 'Two' }).getAttribute('aria-selected')).toBe('true')
  })

  // A tab list is one tab stop, not three: Tab reaches it, the arrows move inside it. Getting
  // this wrong is what makes a long tab bar a wall for anyone not using a mouse.
  it('moves between tabs with the arrow keys, as one tab stop', async () => {
    render(<Example />)
    await userEvent.tab()
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'One' }))

    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Two' }))
    expect(screen.getByText('Second panel')).toBeTruthy()

    await userEvent.keyboard('{ArrowLeft}')
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'One' }))
  })

  it('wires every tab to the panel it opens', () => {
    render(<Example />)
    const tab = screen.getByRole('tab', { name: 'One' })
    const panel = screen.getByRole('tabpanel')
    expect(tab.getAttribute('aria-controls')).toBe(panel.getAttribute('id'))
    expect(panel.getAttribute('aria-labelledby')).toBe(tab.getAttribute('id'))
  })
})
