import type { Issuer } from './types'

// Banks that look the same in every country. Keep them sorted by id.
export const global: Issuer[] = [
  {
    id: 'hsbc',
    name: 'HSBC',
    match: /\bhsbc\b/i,
    background: '#db0011',
    foreground: '#ffffff',
    // Icon: Simple Icons (CC0), simpleicons.org/?q=hsbc
    icon: 'm24 12.007-5.996 5.997V5.996L24 12.007zm-5.996-6.01H6.01l5.996 6.01 5.997-6.01zM0 12.006l6.01 5.997V5.996L0 12.007zm6.01 5.997h11.994l-5.997-5.997-5.996 5.997z',
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
