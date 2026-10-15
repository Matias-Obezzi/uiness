import type { Issuer } from './types'

// Brazil. Keep them sorted by id.
export const br: Issuer[] = [
  {
    id: 'itau',
    name: 'Itaú',
    match: /ita[uú]/i,
    countries: ['BR'],
    background: '#ec7000',
    foreground: '#ffffff',
    website: 'https://www.itau.com.br',
  },
  {
    id: 'nubank',
    name: 'Nubank',
    match: /\bnu ?(bank|pagamentos)\b/i,
    background: '#820ad1',
    foreground: '#ffffff',
    website: 'https://nubank.com.br',
  },
]
