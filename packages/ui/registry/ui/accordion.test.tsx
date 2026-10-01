import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion'

const faq = [
  { value: 'refunds', question: 'Can I get a refund?', answer: 'Within 30 days, no questions.' },
  { value: 'plans', question: 'Can I change plans?', answer: 'Any time, from billing.' },
  { value: 'data', question: 'Where is my data?', answer: 'In the EU, encrypted at rest.' },
]

function Items() {
  return faq.map((item) => (
    <AccordionItem key={item.value} value={item.value}>
      <AccordionTrigger>{item.question}</AccordionTrigger>
      <AccordionContent>{item.answer}</AccordionContent>
    </AccordionItem>
  ))
}

const panel = (answer: string) =>
  screen.getByText(answer).closest('[data-slot=accordion-content]') as HTMLElement
const trigger = (question: string) => screen.getByRole('button', { name: question })

describe('Accordion', () => {
  // Radix unmounts closed content, which keeps FAQ answers out of the page search engines get
  // and out of reach of Ctrl+F. Here every answer is in the page, hidden until found.
  it('keeps closed answers in the page, hidden until found', () => {
    render(
      <Accordion type="single" collapsible>
        <Items />
      </Accordion>,
    )
    for (const item of faq) {
      expect(panel(item.answer).getAttribute('hidden')).toBe('until-found')
    }
  })

  it('opens the item when find in page matches its closed answer', () => {
    const onValueChange = vi.fn()
    render(
      <Accordion type="single" collapsible defaultValue="refunds" onValueChange={onValueChange}>
        <Items />
      </Accordion>,
    )
    act(() => {
      panel('In the EU, encrypted at rest.').dispatchEvent(new Event('beforematch'))
    })
    expect(onValueChange).toHaveBeenCalledWith('data')
    expect(panel('In the EU, encrypted at rest.').hasAttribute('hidden')).toBe(false)
    expect(trigger('Where is my data?').getAttribute('aria-expanded')).toBe('true')
    // Single: the one that was open closes.
    expect(panel('Within 30 days, no questions.').getAttribute('hidden')).toBe('until-found')
  })

  it('follows a controlled value when find in page opens an item', () => {
    function Controlled() {
      const [value, setValue] = React.useState<string[]>([])
      return (
        <>
          <output>{value.join(',')}</output>
          <Accordion type="multiple" value={value} onValueChange={setValue}>
            <Items />
          </Accordion>
        </>
      )
    }
    render(<Controlled />)
    act(() => {
      panel('Any time, from billing.').dispatchEvent(new Event('beforematch'))
    })
    expect(screen.getByRole('status').textContent).toBe('plans')
    act(() => {
      panel('Within 30 days, no questions.').dispatchEvent(new Event('beforematch'))
    })
    expect(screen.getByRole('status').textContent).toBe('plans,refunds')
  })

  it('opens one item at a time and closes it again when collapsible', async () => {
    render(
      <Accordion type="single" collapsible>
        <Items />
      </Accordion>,
    )
    await userEvent.click(trigger('Can I get a refund?'))
    expect(panel('Within 30 days, no questions.').hasAttribute('hidden')).toBe(false)

    await userEvent.click(trigger('Can I change plans?'))
    expect(panel('Any time, from billing.').hasAttribute('hidden')).toBe(false)
    expect(panel('Within 30 days, no questions.').getAttribute('hidden')).toBe('until-found')

    await userEvent.click(trigger('Can I change plans?'))
    expect(panel('Any time, from billing.').getAttribute('hidden')).toBe('until-found')
  })

  it('keeps the open item open when single and not collapsible', async () => {
    render(
      <Accordion type="single" defaultValue="refunds">
        <Items />
      </Accordion>,
    )
    await userEvent.click(trigger('Can I get a refund?'))
    expect(panel('Within 30 days, no questions.').hasAttribute('hidden')).toBe(false)
  })

  it('opens several items at once when multiple', async () => {
    const onValueChange = vi.fn()
    render(
      <Accordion type="multiple" onValueChange={onValueChange}>
        <Items />
      </Accordion>,
    )
    await userEvent.click(trigger('Can I get a refund?'))
    await userEvent.click(trigger('Where is my data?'))
    expect(onValueChange).toHaveBeenLastCalledWith(['refunds', 'data'])
    expect(panel('Within 30 days, no questions.').hasAttribute('hidden')).toBe(false)
    expect(panel('In the EU, encrypted at rest.').hasAttribute('hidden')).toBe(false)
  })

  it('wires headings, triggers and regions together', () => {
    render(
      <Accordion type="single" collapsible>
        <Items />
      </Accordion>,
    )
    const button = trigger('Can I get a refund?')
    const region = panel('Within 30 days, no questions.')
    expect(button.parentElement?.tagName).toBe('H3')
    expect(button.getAttribute('aria-controls')).toBe(region.id)
    expect(region.getAttribute('role')).toBe('region')
    expect(region.getAttribute('aria-labelledby')).toBe(button.id)
  })

  it('moves between triggers with the arrow keys, Home and End', async () => {
    render(
      <Accordion type="single" collapsible>
        <Items />
      </Accordion>,
    )
    await userEvent.tab()
    expect(document.activeElement).toBe(trigger('Can I get a refund?'))
    await userEvent.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(trigger('Can I change plans?'))
    await userEvent.keyboard('{End}')
    expect(document.activeElement).toBe(trigger('Where is my data?'))
    await userEvent.keyboard('{Home}')
    expect(document.activeElement).toBe(trigger('Can I get a refund?'))
    await userEvent.keyboard('{ArrowUp}')
    expect(document.activeElement).toBe(trigger('Where is my data?'))
  })

  it('keeps a disabled item plainly hidden, out of find in page', () => {
    const onValueChange = vi.fn()
    render(
      <Accordion type="multiple" onValueChange={onValueChange}>
        <AccordionItem value="locked" disabled>
          <AccordionTrigger>Locked</AccordionTrigger>
          <AccordionContent>Members only</AccordionContent>
        </AccordionItem>
      </Accordion>,
    )
    expect(panel('Members only').getAttribute('hidden')).toBe('')
    act(() => {
      panel('Members only').dispatchEvent(new Event('beforematch'))
    })
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('sends closed answers in the server HTML', () => {
    const html = renderToString(
      <Accordion type="single" collapsible defaultValue="refunds">
        <Items />
      </Accordion>,
    )
    for (const item of faq) expect(html).toContain(item.answer)
    expect(html.match(/data-slot="accordion-content"[^>]*hidden=""/g)).toHaveLength(2)
  })
})
