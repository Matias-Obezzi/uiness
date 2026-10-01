import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/ui/accordion'

const faq = [
  {
    value: 'free',
    question: 'Is there a free plan?',
    answer:
      'Yes. The Starter plan is free forever for up to three projects, with no credit card needed.',
  },
  {
    value: 'change',
    question: 'Can I change plans later?',
    answer:
      'Any time, from the billing page. Upgrades apply right away and are prorated; downgrades take effect at the end of the period.',
  },
  {
    value: 'data',
    question: 'Where is my data stored?',
    answer:
      'In the EU or the US, your choice, encrypted at rest and in transit. You can export all of it whenever you like.',
  },
  {
    value: 'cancel',
    question: 'What happens if I cancel?',
    answer:
      'Your workspace stays readable for 90 days so you can export everything. After that it is deleted for good, backups included.',
  },
]

export default function AccordionDemo() {
  return (
    <Accordion type="single" collapsible defaultValue="free" className="w-full max-w-lg">
      {faq.map((item) => (
        <AccordionItem key={item.value} value={item.value}>
          <AccordionTrigger>{item.question}</AccordionTrigger>
          <AccordionContent className="text-muted-foreground">{item.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
