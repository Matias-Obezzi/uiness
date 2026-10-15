import type { Issuer } from './types'

// Banks that look the same in every country. Keep them sorted by id.
export const global: Issuer[] = [
  {
    id: 'hsbc',
    name: 'HSBC',
    match: /\bhsbc\b/i,
    background: '#db0011',
    foreground: '#ffffff',
    website: 'https://www.hsbc.com',
  },
  {
    id: 'santander',
    name: 'Santander',
    match: /santander/i,
    background: '#ec0000',
    foreground: '#ffffff',
    website: 'https://www.santander.com',
  },
]
