import { JsonViewer } from '@/ui/json-viewer'

// A made up API response, with a long array to page through.
const response = {
  id: 'evt_01J9Z3K4T7',
  type: 'invoice.paid',
  created: '2026-10-04T09:12:44Z',
  livemode: false,
  'request id': null,
  data: {
    customer: {
      id: 'cus_8812',
      name: 'Acme Corp',
      email: 'billing@acme.test',
      tags: ['enterprise', 'eu'],
    },
    amount: 129_900,
    currency: 'usd',
    lines: Array.from({ length: 240 }, (_, i) => ({
      id: `li_${String(i + 1).padStart(3, '0')}`,
      description: i % 3 === 0 ? 'Seat' : i % 3 === 1 ? 'Storage add-on' : 'Support plan',
      quantity: (i % 4) + 1,
      amount: 1200 + (i % 7) * 150,
    })),
  },
}

export default function JsonViewerDemo() {
  return <JsonViewer data={response} className="w-full" maxHeight={360} />
}
